# SOLID原則の観点からのコード分析

## 現在のコードの問題点

### 1. 単一責任原則（SRP）違反
**問題**: `/api/health/route.ts`が多くの責任を持ちすぎている
- 認証処理
- リクエストパース
- データ変換（キャメルケース↔スネークケース）
- ビジネスロジック（totalCalories計算）
- データベース操作
- エラーハンドリング

### 2. オープン・クローズド原則（OCP）違反
**問題**: 新しいフィールドを追加するたびに既存のコードを修正
- APIルートの修正が必要
- 手動でのフィールドマッピング追加
- 型定義の更新

### 3. 依存性逆転原則（DIP）違反
**問題**: 具体的な実装に直接依存
- Supabaseクライアントを直接使用
- データベーススキーマと密結合

### 4. インターフェース分離原則（ISP）部分的違反
**問題**: 大きすぎるデータ構造
- すべてのフィールドがオプショナル
- 用途別のインターフェースが未分離

### 5. リスコフの置換原則（LSP）
現状では大きな問題なし

## 推奨される改善案

### 1. レイヤードアーキテクチャの導入

```
src/
├── domain/           # ドメインモデル
│   ├── entities/    # エンティティ
│   └── repositories/ # リポジトリインターフェース
├── infrastructure/   # インフラ層
│   ├── database/    # DB実装
│   └── mappers/     # データマッパー
├── application/      # アプリケーション層
│   └── services/    # ビジネスロジック
└── presentation/     # プレゼンテーション層
    └── api/         # APIルート
```

### 2. ORM導入の検討

#### Option A: Prisma（推奨）
**メリット**:
- 型安全性
- マイグレーション管理
- Supabaseとの統合が容易
- スキーマファーストアプローチ

**デメリット**:
- ビルドサイズ増加
- 学習コスト

#### Option B: Drizzle ORM
**メリット**:
- 軽量
- TypeScript向けに設計
- SQLライクな構文

**デメリット**:
- Prismaより機能が少ない
- コミュニティが小さい

#### Option C: TypeORM
**メリット**:
- 多機能
- Active Record/Data Mapperパターン対応

**デメリット**:
- 重い
- デコレータベース（Next.jsと相性問題の可能性）

### 3. 推奨実装パターン

#### リポジトリパターン
```typescript
// domain/repositories/IHealthDataRepository.ts
export interface IHealthDataRepository {
  findByDate(date: string): Promise<HealthData | null>;
  findAll(options?: FindOptions): Promise<HealthData[]>;
  save(data: HealthData): Promise<HealthData>;
  update(id: string, data: Partial<HealthData>): Promise<HealthData>;
}

// infrastructure/database/HealthDataRepository.ts
export class HealthDataRepository implements IHealthDataRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findByDate(date: string): Promise<HealthData | null> {
    const data = await this.prisma.healthData.findUnique({
      where: { date }
    });
    return data ? HealthDataMapper.toDomain(data) : null;
  }
  // ...
}
```

#### マッパーパターン
```typescript
// infrastructure/mappers/HealthDataMapper.ts
export class HealthDataMapper {
  static toDomain(prismaData: PrismaHealthData): HealthData {
    return {
      id: prismaData.id,
      date: prismaData.date,
      weight: prismaData.weight,
      // 自動的にすべてのフィールドをマップ
      ...this.mapNutritionFields(prismaData)
    };
  }
  
  static toPersistence(domainData: HealthData): PrismaHealthData {
    // ドメインモデルからDBモデルへ
  }
}
```

#### サービス層
```typescript
// application/services/HealthDataService.ts
export class HealthDataService {
  constructor(
    private healthDataRepo: IHealthDataRepository,
    private validator: IValidator
  ) {}
  
  async recordHealthData(input: RecordHealthDataDTO): Promise<HealthData> {
    // バリデーション
    await this.validator.validate(input);
    
    // ビジネスロジック
    const totalCalories = this.calculateTotalCalories(input);
    
    // 保存
    return this.healthDataRepo.save({
      ...input,
      totalCalories
    });
  }
}
```

### 4. 段階的な移行計画

#### Phase 1: Prisma導入（推奨開始点）
1. Prismaのインストールと設定
2. 既存のスキーマからPrismaスキーマ生成
3. マイグレーション管理の移行

#### Phase 2: リポジトリパターン実装
1. リポジトリインターフェース定義
2. Prismaを使用した実装
3. 既存コードから段階的に移行

#### Phase 3: サービス層の分離
1. ビジネスロジックをサービスに移動
2. APIルートを薄く保つ

#### Phase 4: 完全なクリーンアーキテクチャ
1. ドメインモデルの確立
2. 依存性注入の実装

## 即座に実施可能な改善

### 1. フィールドマッピングの自動化
```typescript
const fieldMappings = {
  weight: 'weight',
  bodyFatPercentage: 'body_fat_percentage',
  muscleMass: 'muscle_mass',
  // ... 設定ベースのマッピング
};

function mapFields(data: any, mappings: Record<string, string>) {
  return Object.entries(mappings).reduce((acc, [from, to]) => {
    if (data[from] !== undefined) {
      acc[to] = data[from];
    }
    return acc;
  }, {});
}
```

### 2. バリデーション層の追加
```typescript
import { z } from 'zod';

const HealthDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().positive().optional(),
  // ... スキーマベースのバリデーション
});
```

## 結論

現在のコードは動作しますが、今後の拡張性を考慮すると以下を推奨します：

1. **短期的**: Prismaの導入とスキーマベースの開発
2. **中期的**: リポジトリパターンによる抽象化
3. **長期的**: 完全なクリーンアーキテクチャへの移行

これにより、新しいフィールドの追加が：
- Prismaスキーマの更新
- マイグレーションの実行
- 型の自動生成

の3ステップで完了し、手動でのコード修正が最小限になります。
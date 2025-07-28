# Prisma導入によるリファクタリング計画

## 概要
現在の手動マッピングとSQLベースの管理から、Prismaを使用した型安全でSOLID原則に準拠したアーキテクチャへの移行計画。

## なぜPrismaか？

1. **型安全性**: スキーマから自動的にTypeScript型を生成
2. **マイグレーション管理**: 体系的なDBスキーマ変更管理
3. **Supabase互換**: PostgreSQLを完全サポート
4. **開発効率**: 新フィールド追加が簡単

## 移行ロードマップ

### Phase 1: Prisma基盤構築（1-2日）

#### 1.1 Prismaセットアップ
```bash
npm install prisma @prisma/client
npm install -D @types/node
npx prisma init
```

#### 1.2 既存スキーマの取り込み
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model HealthData {
  id                String   @id @default(uuid())
  date              DateTime @unique @db.Date
  weight            Decimal? @db.Decimal(5, 2)
  bodyFatPercentage Decimal? @map("body_fat_percentage") @db.Decimal(4, 2)
  muscleMass        Decimal? @map("muscle_mass") @db.Decimal(5, 2)
  steps             Int?
  activeCalories    Int?     @map("active_calories")
  restingCalories   Int?     @map("resting_calories")
  totalCalories     Int?     @map("total_calories")
  // PFC栄養素
  proteinG          Decimal? @map("protein_g") @db.Decimal(6, 2)
  fatG              Decimal? @map("fat_g") @db.Decimal(6, 2)
  carbohydrateG     Decimal? @map("carbohydrate_g") @db.Decimal(6, 2)
  // その他の栄養素
  fiberG            Decimal? @map("fiber_g") @db.Decimal(5, 2)
  sugarG            Decimal? @map("sugar_g") @db.Decimal(5, 2)
  sodiumMg          Decimal? @map("sodium_mg") @db.Decimal(7, 2)
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  @@map("health_data")
}
```

#### 1.3 環境変数設定
```env
DATABASE_URL="postgres://[user]:[password]@[host]:[port]/[database]?pgbouncer=true"
DIRECT_URL="postgres://[user]:[password]@[host]:[port]/[database]"
```

### Phase 2: リポジトリパターン実装（2-3日）

#### 2.1 ディレクトリ構造
```
src/
├── lib/
│   ├── prisma.ts              # Prismaクライアント
│   ├── repositories/          # リポジトリ層
│   │   ├── interfaces/       # リポジトリインターフェース
│   │   └── implementations/  # 実装
│   ├── services/             # ビジネスロジック
│   └── validators/           # バリデーション
```

#### 2.2 Prismaクライアント
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### 2.3 リポジトリインターフェース
```typescript
// src/lib/repositories/interfaces/IHealthDataRepository.ts
import { HealthData } from '@prisma/client'

export interface IHealthDataRepository {
  findByDate(date: Date): Promise<HealthData | null>
  findMany(take?: number, skip?: number): Promise<HealthData[]>
  upsert(data: CreateHealthDataDto): Promise<HealthData>
  update(id: string, data: UpdateHealthDataDto): Promise<HealthData>
  delete(id: string): Promise<void>
}
```

#### 2.4 リポジトリ実装
```typescript
// src/lib/repositories/implementations/PrismaHealthDataRepository.ts
import { prisma } from '@/lib/prisma'
import { IHealthDataRepository } from '../interfaces/IHealthDataRepository'

export class PrismaHealthDataRepository implements IHealthDataRepository {
  async findByDate(date: Date): Promise<HealthData | null> {
    return prisma.healthData.findUnique({
      where: { date }
    })
  }

  async upsert(data: CreateHealthDataDto): Promise<HealthData> {
    const { totalCalories, ...restData } = data
    
    // ビジネスロジックはサービス層へ
    return prisma.healthData.upsert({
      where: { date: data.date },
      update: { ...restData, totalCalories },
      create: { ...restData, totalCalories }
    })
  }
}
```

### Phase 3: サービス層の実装（1-2日）

#### 3.1 ヘルスデータサービス
```typescript
// src/lib/services/HealthDataService.ts
import { IHealthDataRepository } from '@/lib/repositories/interfaces/IHealthDataRepository'
import { healthDataSchema } from '@/lib/validators/healthDataSchema'

export class HealthDataService {
  constructor(private repository: IHealthDataRepository) {}

  async recordHealthData(input: any): Promise<HealthData> {
    // バリデーション
    const validated = healthDataSchema.parse(input)
    
    // ビジネスロジック
    const totalCalories = this.calculateTotalCalories(validated)
    
    // 永続化
    return this.repository.upsert({
      ...validated,
      totalCalories
    })
  }

  private calculateTotalCalories(data: any): number | null {
    if (data.activeCalories && data.restingCalories) {
      return data.activeCalories + data.restingCalories
    }
    return data.activeCalories || data.restingCalories || null
  }
}
```

#### 3.2 バリデーションスキーマ
```typescript
// src/lib/validators/healthDataSchema.ts
import { z } from 'zod'

export const healthDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().positive().nullable().optional(),
  bodyFatPercentage: z.number().min(0).max(100).nullable().optional(),
  muscleMass: z.number().positive().nullable().optional(),
  steps: z.number().int().nonnegative().nullable().optional(),
  activeCalories: z.number().int().nonnegative().nullable().optional(),
  restingCalories: z.number().int().nonnegative().nullable().optional(),
  // PFC
  proteinG: z.number().nonnegative().nullable().optional(),
  fatG: z.number().nonnegative().nullable().optional(),
  carbohydrateG: z.number().nonnegative().nullable().optional(),
  // その他
  fiberG: z.number().nonnegative().nullable().optional(),
  sugarG: z.number().nonnegative().nullable().optional(),
  sodiumMg: z.number().nonnegative().nullable().optional(),
})
```

### Phase 4: APIルートのリファクタリング（1日）

#### 4.1 新しいAPIルート
```typescript
// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaHealthDataRepository } from '@/lib/repositories/implementations/PrismaHealthDataRepository'
import { HealthDataService } from '@/lib/services/HealthDataService'
import { withAuth } from '@/lib/middleware/auth'
import { withCors } from '@/lib/middleware/cors'

const repository = new PrismaHealthDataRepository()
const service = new HealthDataService(repository)

export const GET = withCors(async () => {
  try {
    const data = await repository.findMany(100)
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
})

export const POST = withCors(withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const result = await service.recordHealthData(body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}))
```

## 新フィールド追加の流れ（Prisma導入後）

### 1. スキーマ更新
```prisma
model HealthData {
  // ... 既存フィールド
  waterMl    Int?     @map("water_ml")  // 新フィールド追加
}
```

### 2. マイグレーション生成・実行
```bash
npx prisma migrate dev --name add_water_intake
```

### 3. 型の自動更新
Prismaが自動的にTypeScript型を更新

### 4. バリデーションスキーマ更新
```typescript
// 1箇所のみ更新
waterMl: z.number().int().nonnegative().nullable().optional(),
```

完了！APIは自動的に新フィールドを処理

## 移行スケジュール

| Phase | 期間 | 内容 |
|-------|------|------|
| 1 | 1-2日 | Prisma基盤構築 |
| 2 | 2-3日 | リポジトリパターン実装 |
| 3 | 1-2日 | サービス層実装 |
| 4 | 1日 | APIリファクタリング |
| テスト | 1日 | 統合テスト |

合計: 約1週間

## メリット

1. **保守性向上**: 新フィールド追加が簡単
2. **型安全性**: コンパイル時エラー検出
3. **テスタビリティ**: 依存性注入でテスト容易
4. **拡張性**: SOLID原則準拠

## リスクと対策

1. **リスク**: 移行中のダウンタイム
   **対策**: 段階的移行、旧APIと並行稼働

2. **リスク**: パフォーマンス低下
   **対策**: Prismaクエリ最適化、インデックス確認

3. **リスク**: 予期しないバグ
   **対策**: 包括的なテストスイート作成
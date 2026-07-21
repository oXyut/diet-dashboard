# 体重予測 ML

このフォルダはダッシュボード本体から独立した、**翌日体重の予測**と**予測理由の説明**のための Python プロジェクトです。Python 環境と依存関係は `uv` で管理します。

## 2つのモデル

| 目的     | モデル                  | 出力                                                                                     |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| 予測精度 | 時系列CV付き Ridge 回帰 | 過去から未来へ進む検証で正則化を選んだ翌日体重予測。小規模な個人データでも安定しやすい。 |
| 解釈     | Ridge 線形回帰          | どの指標が予測を増減させたか、標準化係数・当日の寄与として表示する。                     |

両者を分けることで、「当たりやすさ」と「説明のしやすさ」を混同しません。解釈モデルの係数は因果関係を証明するものではありません。

## 最初の実行（データなしでも可）

```bash
cd /Users/suzukiyuto/work/diet-dashboard/weight-ml
uv sync --extra dev
uv run train-weight-model
uv run pytest
```

入力を省略した実行は、240 日分の**合成データによる動作デモ**です。`artifacts/training_report.json` に必ず `synthetic_demo` と警告が出るため、実測の精度と取り違えません。

## Airflow + MLflow（APIから直接取得）

実データの運用ではCSVを使いません。Airflowが認証済みの `GET /api/ml/health` をページング取得し、MLflowに取得スナップショット・ハッシュ・評価値・モデルを記録します。Docker Composeの起動方法は [`orchestration/.env.example`](orchestration/.env.example) を参照してください。

```bash
cd /Users/suzukiyuto/work/diet-dashboard/weight-ml/orchestration
cp .env.example .env
# .env にダッシュボードのHTTPS URLとAPIキーを設定
docker compose up --build
```

- Airflow: http://localhost:8080
- MLflow: http://localhost:5001
- DAG `weight_forecast`: 毎日10:00 JSTに予測し、日曜だけ再学習します。
- 取得した実データはDockerのローカルボリュームとMLflow成果物にのみ保存されます。

## CSVによるローカル検証（任意）

ダッシュボードの `HealthData` と同じ列名の CSV を用意します。列の完全な見本は [`data/health_data.csv.example`](data/health_data.csv.example) を参照してください。必要なのは `date` と `weight` です。それ以外の欠損値は学習時に補完しますが、体重・摂取カロリー・総消費カロリー・歩数をできるだけ毎日記録すると有用です。

最低条件は、体重のある連続 30 日です。まずは 60〜90 日、季節性まで扱うには半年以上の実測値を推奨します。

```bash
uv run train-weight-model --input data/health_data.csv --output-dir artifacts/real
uv run predict-weight --input data/health_data.csv --model-dir artifacts/real
```

## 評価の読み方

`training_report.json` の `temporal_holdout_metrics` は、古い 80% で学習し新しい 20% で検証する時系列評価です。

- `mae_kg`: 平均的に何 kg 外れたか。小さいほど良い。
- `rmse_kg`: 大きな外れをより重く数える誤差。小さいほど良い。
- `r2`: ばらつきをどれだけ説明できたか。小規模データでは不安定になりやすい。

体重は水分・塩分・便通・測定時間などの影響を受けるため、日次の一点予測を健康判断や医療判断に使わないでください。朝・排尿後など測定条件をそろえるほど、モデルが学びやすくなります。

## 出力物

- `prediction_model.joblib`: 精度優先モデル
- `interpretation_model.joblib`: 係数を説明できるモデル
- `training_report.json`: 時系列評価、最新日の予測、全体／個別の説明

# 📊 ECON DASHBOARD — 米国経済指標ダッシュボード

FRED APIを使った15の経済指標をリアルタイムで可視化する投資判断ダッシュボード。

## 📱 機能

- **15指標**: NFP, 失業率, 新規失業保険, JOLTS, CPI, コアCPI, FF金利, GDP, ISM, 小売売上, 10Y/2Y国債, イールドカーブ, VIX, S&P500
- **4つのビュー**: シングル / マルチ / 比較 / テーブル
- **テクニカル指標**: SMA, ボリンジャーバンド, RSI, MACD
- **AI投資シグナル**: カテゴリ別・総合の強気/弱気判定
- **経済カレンダー**: 次回発表日カウントダウン
- **スマホ対応**: レスポンシブデザイン、safe-area対応

## 🚀 デプロイ手順

### 1. リポジトリ作成

```bash
# GitHubで新しいリポジトリ「econ-dashboard」を作成

git init
git remote add origin https://github.com/あなたのユーザー名/econ-dashboard.git
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. ローカルで動作確認

```bash
npm run dev
# → http://localhost:5173 でアクセス
```

### 4. GitHub Pagesにデプロイ

```bash
npm run deploy
```

これだけで `https://あなたのユーザー名.github.io/econ-dashboard/` で公開されます。

### 5. GitHub Pages設定（初回のみ）

1. GitHubリポジトリの Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **(root)**
4. Save

## 🔑 FRED APIキー

1. https://fred.stlouisfed.org でアカウント作成（無料）
2. https://fred.stlouisfed.org/docs/api/api_key.html でAPIキー取得
3. ダッシュボード上部の入力欄にキーを入力して「接続」
4. キーはブラウザのlocalStorageに保存され、次回以降は自動接続

## ⚙️ カスタマイズ

### リポジトリ名を変える場合

`vite.config.js` の `base` を変更：

```js
base: '/あなたのリポジトリ名/',
```

### 指標を追加する場合

`src/App.jsx` の `INDICATORS` オブジェクトにエントリを追加：

```js
NEW_IND: {
  id: "FRED_SERIES_ID",
  name: "表示名",
  nameEn: "English Name",
  unit: "単位",
  color: "#HEX",
  cat: "カテゴリ",
  // ...
}
```

## 📂 構成

```
econ-dashboard/
├── index.html          # エントリポイント
├── package.json        # 依存関係
├── vite.config.js      # Vite設定（base path）
└── src/
    ├── main.jsx        # React マウント
    └── App.jsx         # メインアプリ（全機能）
```

## ライセンス

MIT

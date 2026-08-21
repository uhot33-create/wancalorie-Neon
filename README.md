# わんカロリー（wancalorie-Neon）

愛犬の1日のカロリーを足し算し、理想体重に向けたごはん・おやつの量を計算するアプリです。

プロジェクト名は **wancalorie-Neon** です。Neon / Vercel / GitHub でもこの名前を使ってください。

## 必要なもの

- [Node.js 22](https://nodejs.org/) 以上
- ターミナル（Windows なら PowerShell、Mac なら「ターミナル」）

## 動かし方

1. このフォルダを解凍する
2. その中で次を実行する

```bash
npm install
npm run dev
```

3. ブラウザで [http://localhost:8080](http://localhost:8080) を開く
4. 「はじめての方は新規登録」からメールとパスワード（8文字以上）で登録する

Google / X ログインは、Grok 上のプレビュー向けです。自分のパソコンでは **メール登録** を使ってください。

止めるときは、ターミナルで `Ctrl + C` です。

## 使い方

1. 愛犬の名前・体重・理想体重を登録
2. 「今日」でごはん・おやつのカロリーを足す
3. 「フード」によく使う餌を登録
4. 「プラン」で1日の必要量と給与グラムを確認

## データの保存

初期状態では、データはこのパソコン上の一時データベースに入ります。  
`npm run dev` を止めたり、パソコンを再起動したりすると消えることがあります。

残したい場合は、Postgres（Neon など）を用意し、環境変数 `DATABASE_URL` を設定してください。

## Vercel に公開する（Grok 課金は不要）

ソースを自分の [Vercel](https://vercel.com/) に置くと、Grok を解約しても使い続けられます。個人利用なら Hobby プラン（無料）で足ります。AWS のような時間課金はありません。

1. [Neon](https://neon.tech/) でプロジェクト名 **wancalorie-Neon** の Postgres を作り、接続文字列（`DATABASE_URL`）をコピーする
2. [Vercel](https://vercel.com/) にログインし、このフォルダをプロジェクト名 **wancalorie-Neon** で Import（GitHub に上げるか、`vercel` CLI）
3. プロジェクトの Environment Variables に次を入れる

| 名前 | 値 |
|------|------|
| `DATABASE_URL` | Neon の接続文字列 |
| `BETTER_AUTH_SECRET` | 長いランダム文字列（例: `openssl rand -hex 32`） |
| `BETTER_AUTH_URL` | 公開後の URL（例: `https://wancalorie-neon.vercel.app`） |

4. Deploy する
5. 開いたサイトで **メール新規登録** する

自分の Vercel では Google / X ログインは使いません（Grok プレビュー専用です）。メールとパスワードで登録してください。

データは Neon に残るので、サーバーを止めても消えません。

## ログインを省略したい場合

起動前に次を付けると、ログインなしの開発用ユーザーで開きます。

```bash
VITE_AUTH_ENABLED=false npm run dev
```

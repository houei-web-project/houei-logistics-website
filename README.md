# 豊栄物流 — 現サイト複製＋AI採用相談プレビュー

プレビュー: http://127.0.0.1:4317/

2026年10月8日に公開サイトから取得した7ページを使用。元のHTML、写真、CSS、レスポンシブ構成、フォント、GSAPのアニメーションを保存し、独立したShadow DOM内の採用チャットを追加しています。

## 起動

Node.js 22以降と、Ollamaの `qwen2.5-coder:3b` が必要です。このMacでは既存モデルの利用を確認済みです。依存パッケージのインストールは不要です。

```sh
npm start
```

起動後、上記プレビューを開いて右下の「採用について相談する」を押してください。必要なら `.env.example` を `.env` にコピーし、ローカルの接続先を指定できます。

## チャットの方式

- ローカル起動時は、実際のローカルLLMが自由文の質問を分類し、公開情報と照合した回答文を表示します。
- GitHub Pagesなどの静的公開URLでは、ブラウザー内でTransformers.jsの多言語モデルを読み込み、質問の意味に近い採用情報を照合して回答します。
- 小型モデルが採用条件を書き換えることを避けるため、回答本文は `server/knowledge.mjs` にまとめています。
- 公開デモの回答本文は `public/chat/semantic-demo.mjs` にまとめています。年齢条件の矛盾は担当者確認に誘導し、応募受付や予約確定を装いません。
- 会話はブラウザーのメモリーのみ。サーバーは会話を保存しません。ローカル起動時のAI問い合わせはこのMac内で完結します。
- 静的公開URLのデモでは、質問文をサイト側サーバーやAI APIへ送信しません。初回のみAIモデルの取得に時間がかかります。
- 回答の根拠: https://houei-butsuryu.co.jp/recruit.html
- 本番運用時には会社による募集情報の承認、更新担当、外部公開用AI接続先の設定が必要です。

## 元サイトとの意図した差分

1. 全7ページに採用チャットを追加。
2. Google Analyticsを除去し、検索除外を指定。
3. 元の問い合わせフォームの実送信を停止し、試用時のメッセージを表示。
4. 元サイトのGoogle Maps APIキーは再利用せず、同社の公開マップをiframe表示。地図の見た目は元のAPI表示と異なります。
5. 地図のないページで発生していた元のJSエラーを防止。
6. CSS・JS・フォント・画像をローカル配信。会社の本番サイトは変更していません。

公開用ビルドは `node scripts/build-public.mjs` で作成します。公開トップは元サイト複製版です。`/original.html` も同じ元サイト版で、新デザイン案は `/renewal.html` に保存しています。公開版のAIチャットはブラウザー内AIデモとして動作します。公式窓口へのリンクを開いた後の操作は実サイトでの操作になります。

## 検証

```sh
npm run check
npm test
node scripts/qa.mjs
```

ブラウザー検証は、この環境に付属するPlaywrightを使用します。別の環境では `PLAYWRIGHT_PATH` にPlaywrightのインストール先を指定してください。

7ページをPC（1440px）・スマートフォン（390px）で検証し、JSエラー・画像欠落・ローカルHTTPエラー・横はみ出し、実AI応答、開閉、Esc、接続失敗の表示、フォームの送信停止を確認します。結果・スクリーンショットは `qa/` に保存されます。

取得元一覧: `mirror-manifest.json`。再取得は `python3 scripts/mirror.py`。`public/chat/` は再取得の対象外です。

## 管理画面

公開ページ右下の Admin から `/admin/` に入ります。採用情報11項目の事実・回答案・根拠URL・確認日・メモ・承認状態を確認、編集できます。初期状態は全件確認待ちです。データはD1に保存され、同時更新競合を検出します。

認証はサーバーの `ADMIN_PASSWORD` と `ADMIN_SESSION_SECRET`、8時間のHttpOnlyセッションを使用。秘密情報はSitesのシークレットに設定し、Gitには保存しません。ログイン情報はプロジェクト外のローカルファイルで管理します。管理画面の承認はAI接続の有効化とは別です。

## 経営層向け提案書

`/proposal.html` はAIによる業務効率化・採用強化の提案ページです。章ナビゲーション、説明用の作業時間試算、印刷用レイアウトを備えています。CSSとJavaScriptは `public/proposal/` に分離しています。

試算の初期値は仮定であり実績ではありません。実装済みのサイト・管理画面・公開AIチャットデモと、本番AI接続・社内業務AIなどの導入案を分けて掲載しています。チャットや管理用の浮動リンクはこのページには挿入しません。

## GitHub Pagesでの公開

提案書: https://houei-web-project.github.io/houei-logistics-website/proposal/

サイト: https://houei-web-project.github.io/houei-logistics-website/

サイトマップ: https://houei-web-project.github.io/houei-logistics-website/sitemap/

`main` への更新時に `.github/workflows/pages.yml` が検証・ビルドを行い、GitHub Pagesへ自動公開します。手動実行はGitHub Actionsの「Run workflow」から行えます。

```sh
npm run build:pages
```

公開用の静的ファイルを `dist/pages/` に生成します。画像・CSS・ページリンクをリポジトリ配下のURLに変換し、`/proposal/`、`/renewal/`、`/sitemap/` の入口も生成します。元の `public/` とSites向けビルドは変更しません。

公開チャットはブラウザー内AIデモとして動作します。認証・D1が必要な管理画面はGitHub Pagesには配置せず、サイトマップ内の説明とGitHub上のソース確認に留めます。既存のSites公開と管理データは維持します。

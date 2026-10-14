# 豊栄物流 — 現サイト複製＋採用Q&Aプレビュー

プレビュー: http://127.0.0.1:4317/

2026年10月8日に公開サイトから取得した7ページを使用。元のHTML、写真、CSS、レスポンシブ構成、フォント、GSAPのアニメーションを保存し、独立したShadow DOM内の採用チャットを追加しています。

## 起動

Node.js 22以降で起動できます。採用Q&AにAIモデルやAPIキーは不要です。

```sh
npm start
```

起動後、上記プレビューを開いて右下の採用相談ボタンを押してください。

## チャットの方式

- ローカル・GitHub Pagesとも、質問ボタンを選ぶと定型回答を同期表示します。自由入力はありません。
- 質問と回答の11項目は `public/chat/widget.js` 冒頭の `faqItems` にまとめています。
- AIモデルのダウンロード、AI API通信、回答の待機処理はありません。API利用料金は0円です。
- 年齢など確認が必要な条件は担当者へ案内し、チャット内で応募受付や予約確定はしません。
- 回答の根拠: https://houei-butsuryu.co.jp/recruit.html （2026年10月8日取得）
- 今後、採用資料を整理してRAG方式のAI回答へ拡張する予定です。旧 `public/chat/semantic-demo.mjs` と `server/knowledge.mjs`、サーバーのAI処理は参考実装として残していますが、現行widgetからは呼び出しません。

## 元サイトとの意図した差分

1. 全7ページに採用チャットを追加。
2. Google Analyticsを除去し、検索除外を指定。
3. 元の問い合わせフォームの実送信を停止し、試用時のメッセージを表示。
4. 元サイトのGoogle Maps APIキーは再利用せず、同社の公開マップをiframe表示。地図の見た目は元のAPI表示と異なります。
5. 地図のないページで発生していた元のJSエラーを防止。
6. CSS・JS・フォント・画像をローカル配信。会社の本番サイトは変更していません。

公開用ビルドは `node scripts/build-public.mjs` で作成します。公開トップは元サイト複製版です。`/original.html` も同じ元サイト版で、新デザイン案は `/renewal.html` に保存しています。公開版の採用Q&Aは選択式の定型回答で動作します。公式窓口へのリンクを開いた後の操作は実サイトでの操作になります。

## 検証

```sh
npm run check
npm test
node scripts/qa.mjs
```

ブラウザー検証は、この環境に付属するPlaywrightを使用します。別の環境では `PLAYWRIGHT_PATH` にPlaywrightのインストール先を指定してください。

7ページをPC（1440px）・スマートフォン（390px）で検証し、JSエラー・画像欠落・ローカルHTTPエラー・横はみ出し、選択式の定型回答、AI通信ゼロ、開閉、Esc、フォームの送信停止を確認します。結果・スクリーンショットは `qa/` に保存されます。

取得元一覧: `mirror-manifest.json`。再取得は `python3 scripts/mirror.py`。`public/chat/` は再取得の対象外です。

## 管理画面

公開ページ右下の Admin から `/admin/` に入ります。採用情報11項目の事実・回答案・根拠URL・確認日・メモ・承認状態を確認、編集できます。初期状態は全件確認待ちです。データはD1に保存され、同時更新競合を検出します。

認証はサーバーの `ADMIN_PASSWORD` と `ADMIN_SESSION_SECRET`、8時間のHttpOnlyセッションを使用。秘密情報はSitesのシークレットに設定し、Gitには保存しません。ログイン情報はプロジェクト外のローカルファイルで管理します。管理画面の承認はAI接続の有効化とは別です。

## 経営層向け提案書

`/proposal.html` は採用AIの提案ページです。採用チャット、求人原稿・FAQ作成、API使用料金、導入の進め方を短くまとめ、`public/renewal/style.css` の濃紺・ライムのデザインを共用します。専用CSSとJavaScriptは `public/proposal/` に分離しています。

API料金はGPT-5.4 miniの公式単価を使った導入時の試算で、現在の選択式デモはAIを使用せず、API料金は0円です。1相談あたり累積入力10,000・出力2,000トークン、1ドル150円の仮定で約2.5円とし、月100・500・1,000相談の目安を掲載しています。開発・サーバー・保守・税・追加ツール費用は含みません。チャットや管理用の浮動リンクはこの提案ページには挿入しません。

## GitHub Pagesでの公開

提案書: https://houei-web-project.github.io/houei-logistics-website/proposal/

IP無線・GPS動態管理の提案書: https://houei-web-project.github.io/houei-logistics-website/radio-proposal/

IP無線提案は `public/radio-proposal.html` と専用CSS・JSで構成し、`public/renewal/style.css` の濃紺・ライムのデザインを共用します。製品写真・参考GPS画面・配布用PDFは `public/radio-proposal/assets/` に配置しています。画像拡大、印刷、PDFダウンロードに対応し、AIチャット・管理用浮動リンクは表示しません。確認済み機能と試行・契約条件を区別した導入検討資料です。

サイト: https://houei-web-project.github.io/houei-logistics-website/

サイトマップ: https://houei-web-project.github.io/houei-logistics-website/sitemap/

`main` への更新時に `.github/workflows/pages.yml` が検証・ビルドを行い、GitHub Pagesへ自動公開します。手動実行はGitHub Actionsの「Run workflow」から行えます。

```sh
npm run build:pages
```

公開用の静的ファイルを `dist/pages/` に生成します。画像・CSS・ページリンクをリポジトリ配下のURLに変換し、`/proposal/`、`/radio-proposal/`、`/renewal/`、`/sitemap/` の入口も生成します。元の `public/` とSites向けビルドは変更しません。

公開チャットは選択式の定型回答で動作します。認証・D1が必要な管理画面はGitHub Pagesには配置せず、サイトマップ内の説明とGitHub上のソース確認に留めます。既存のSites公開と管理データは維持します。

## IP無線提案ページの表示確認

GitHub Pagesビルドを配信した状態で `node scripts/qa-radio-proposal.mjs` を実行します。既定の確認先は `http://127.0.0.1:4328/houei-logistics-website/radio-proposal/` です。`RADIO_QA_URL` で変更できます。1440・1024・768・390・320pxで画像、はみ出し、メニュー、拡大画面とフォーカス復帰、PDFダウンロード、印刷を確認し、結果を `qa/radio-results.json` に保存します。

## 採用AI提案ページの表示確認

同じ配信環境で `node scripts/qa-recruit-proposal.mjs` を実行します。既定の確認先は `http://127.0.0.1:4328/houei-logistics-website/proposal.html` です。`PROPOSAL_QA_URL` で変更できます。5サイズの表示・メニュー・料金計算との整合性・試算条件の開閉・デモ先のチャット起動・印刷と開閉状態の復元を確認し、結果を `qa/recruit-results.json` に保存します。

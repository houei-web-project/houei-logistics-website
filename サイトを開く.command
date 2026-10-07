#!/bin/zsh
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
preview_url="http://127.0.0.1:4317/renewal.html"
if curl -fsS --max-time 2 http://127.0.0.1:4317/api/health >/dev/null 2>&1; then
  open "$preview_url"
  exit 0
fi
if ! command -v node >/dev/null 2>&1; then
  echo "起動にはNode.jsが必要です。"
  read -r "reply?Enterキーで閉じます。"
  exit 1
fi
(
  for attempt in {1..30}; do
    if curl -fsS --max-time 1 http://127.0.0.1:4317/api/health >/dev/null 2>&1; then
      open "$preview_url"
      exit 0
    fi
    sleep 1
  done
) &
echo "サイトを起動します。このウインドウを開いている間、プレビューを利用できます。"
echo "終了するには Control + C を押してください。"
node --env-file-if-exists=.env server/index.mjs

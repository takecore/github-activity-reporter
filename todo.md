# 自分の今週の github activity レポート取得コマンド

# 名前

github weekly reporter
happy reporter
hapi-repo

## 取得するもの

- Open した issue
  - 数
  - タイトル
  - リンク
- Close した issue
  - 数
  - タイトル
  - リンク
- Open した PR
  - 数
  - タイトル
  - リンク
- Close した PR
  - 数
  - タイトル
  - リンク
- 実装したコード差分
  - + した行数
  - - した行数
- Comment の数
  - issue + PR の数
  - issue の数
  - PR の数

- IssuesEvent
  - payload.action: opened オープンしたPR
  - payload.action: closeed クローズしたPR
- PullRequestEvent
  - payload.action: opened オープンしたPR
  - payload.action: closed 且つ payload.pull_request.merged === true クローズしたPR
- IssueCommentEvent
  - payload.action: created 作成したissueコメント
- PullRequestReviewCommentEvent
  - payload.action: created 作成したpr reviewコメント

Google のアクティビティが欲しい

# 実装について

- コマンドで実装する
- 引数で日本語・英語で出力するテンプレートを切り替えられる
- 引数で日付を指定できる
- 引数でファイルにエクスポートできる
- エクスポート形式を plane, md, html で分けられる

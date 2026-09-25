ママ図鑑 v3 - 完全復元対応版

追加機能
- キャラクター / 共通設定 / 人格設定 の3階層
- ラジ医者などの「会話エンジン設定」を人物プロフィールと分離して保存
- 共通設定に、世界・共通運用・画像生成・親密シーン・情報境界・復元ルールを保存
- 「完全復元文をコピー」で、全キャラ＋共通設定＋人格設定を1つのテキストにまとめてコピー
- JSONバックアップは version 3。characters / commonSettings / personas を一括保存
- 旧version 1のキャラクターバックアップも読み込み可能
- 設定貼り付けは、1人分・人格1人分・共通設定・完全バックアップに対応

重要
- GitHubへ公開するソースには個人設定を入れていません。入力データはブラウザのIndexedDB内です。
- 既存のGitHub Pagesと同じURLでファイルを上書きすれば、従来のcharactersストアは削除せずDBをversion 2へ更新します。
- 更新後、Safari/PWAで古い画面が残る場合は一度アプリを閉じて開き直してください。service workerのキャッシュ名も更新済みです。
- 大切なデータは定期的にJSON書き出ししてください。

GitHub更新
このフォルダ内の index.html / app.js / styles.css / sw.js / manifest.webmanifest / README.txt を、現在のリポジトリ直下へ同名で上書きしてください。

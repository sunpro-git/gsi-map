# 地理院マップ

国土地理院の地図を Google マップ風の操作で使う地図アプリです。
このリポジトリは配布用の一式（GitHub Pages で公開しているもの）です。

## できること

- 国土地理院の地図（標準・淡色・航空写真・白地図）と、陰影起伏図などの重ね表示
- 登山道の表示（国土地理院の徒歩道／OpenStreetMap）。線をクリックしてルートに取り込める
- ルート作成（フリーハンド・道なり・消しゴム）、距離と高低差、GPX 書き出し
- 経路検索（有料道路・幹線道路を避ける指定つき）
- 現在地の表示とルートナビ（残り距離・到着予定・自動リルート）
- 作成したルートや地点を Google ドライブに保存（要ログイン設定）

## 出典

- 地図・標高・住所：[地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)（国土地理院）
- 登山道・経路：[OpenStreetMap](https://www.openstreetmap.org/copyright) の貢献者、Waymarked Trails、Valhalla
- 地図描画：MapLibre GL JS

## ファイル

| ファイル | 役割 |
| --- | --- |
| `index.html` | アプリ本体（CSS と JavaScript を取り込み済み） |
| `sw.js` | オフライン利用のためのサービスワーカー |
| `manifest.webmanifest`, `icons/` | ホーム画面に追加したときの名前とアイコン |

`index.html` と同じ階層にすべて置いてください。

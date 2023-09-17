# @suin/esa-webhook-router

[esa.io の Generic Webhook]を受信し、ペイロードの`kind`ごとにルーティングするルーター。

[esa.io の generic webhook]: https://docs.esa.io/posts/37

## 特徴

- 現在、以下のペイロードに対応しています。
  - 記事作成時(kind: "post_create")
  - 記事更新時(kind: "post_update")
  - 記事アーカイブ時(kind: "post_archive")
  - 記事削除時(kind: "post_delete")
  - 記事復旧時(kind: "post_restore")
- リクエストボディ改ざん防止のための`X-Esa-Signature`に対応しています。

## 動作要件

- Node.js: 18.x 以上

## インストール

```bash
yarn add @suin/esa-webhook-router
# or
npm install @suin/esa-webhook-router
```

## 使い方

### 基本的な用法

```typescript
import { createRouter } from "@suin/esa-webhook-router";
// `createRouter`には、イベントの種類ごとに実行するハンドラー関数を渡します。
const route = createRouter({
  post_create: ({ event }) => console.log("投稿が作成されました。", event),
  post_update: ({ event }) => console.log("投稿が更新されました。", event),
  post_archive: ({ event }) =>
    console.log("投稿がアーカイブされました。", event),
  post_delete: ({ event }) => console.log("投稿が削除されました。", event),
});
// `createRouter`の戻り値は関数なので、それにHTTPリクエストを渡すと、ハンドラーが実行されます。
await route(request);
```

### AWS LambdaやNetlify Functionで使う

`createRouter`で作成した関数には、`APIGatewayProxyEvent`を渡すことができるので、AWS LambdaやNetlify Functionでもこのライブラリを用いることができるはずです。動作確認はしてません。

### `X-Esa-Signature`をあつかう

esa Webhookにはリクエストボディーの署名が[`X-Esa-Signature`](https://docs.esa.io/posts/37#X-Esa-Signature)ヘッダについています。この署名の検証を行うには次の方法のどれかで、シークレットを渡してください。

- 環境変数`ESA_WEBHOOK_SECRET`をセットする。
- `createRouter`の`secret`オプションをセットする。

どちらも設定されている場合は、`secret`オプションが優先されます。

### 使い方をもっと学ぶ

より詳しい使い方については、[usage.spec.ts](./usage.spec.ts)をご覧ください。

## 動作デモ

いろいろな環境での動作デモを用意してあります。

- [ローカル環境での動作デモ](./demo/local/main.ts): ローカル環境でHTTPサーバーを起動し、esa Webhookを受け取れるようにします。グローバルのURLはCloudflare Tunnelを使って作成しますので、実際のesaチームと結合して動作させることができます。起動するには、このリポジトリを`git clone`し、`yarn install && yarn tsx local/main.ts`を実行してください。
- [Vercel Functionsでの動作デモ](./api/webhook.ts): Vercel Functionsにデプロイして、esa Webhookを受け取れるようにします。実際のesaチームと結合して動作させることができます。ローカルで実行するには、このリポジトリを`git clone`し、`yarn install && npx vercel dev`を実行してください。

## API リファレンス

https://suin.github.io/esa-webhook-router/

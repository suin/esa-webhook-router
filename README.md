# @suin/esa-webhook-router

[esa.io の Generic Webhook]を受信し、ペイロードの`kind`ごとにルーティングするルーター。

[esa.io の generic webhook]: https://docs.esa.io/posts/37

## 特徴

- 現在、以下のペイロードに対応しています。
  - 記事作成時(kind: "post_create")
  - 記事更新時(kind: "post_update")
  - 記事アーカイブ時(kind: "post_archive")
  - 記事削除時(kind: "post_delete")
- リクエストボディ改ざん防止のための`X-Esa-Signature`に対応しています。

## インストール

```bash
yarn add @suin/esa-webhook-router
# or
npm install @suin/esa-webhook-router
```

## 使い方

### 基本的な用法

```typescript
import { createRouter } from '@suin/esa-webhook-router'
const router = createRouter()

router.on('post_create', ({ post }) => {
  console.log(post)
})
router.on('post_update', ({ post }) => {
  console.log(post)
})
router.on('post_archive', ({ post }) => {
  console.log(post)
})
router.on('post_delete', ({ post }) => {
  console.log(post)
})
```

### AWS Lambda や Netlify Function で使う

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda'
import { createRouter } from '@suin/esa-webhook-router'

const router = createRouter()

export const handler: APIGatewayProxyHandler = (event, context, callback) => {
  router.on('post_create', ({ team, post, user }) => {
    console.log({ team, post, user })
    /* ...team, post, userなどの処理... */
    callback(null, {
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'OK',
    })
  })
  try {
    router.route(event)
  } catch (e) {
    // エラー処理
    callback(null, {
      statusCode: 400,
      headers: { 'content-type': 'text/plain' },
      body: e.message,
    })
  }
}
```

### `X-Esa-Signature`をあつかう

- [`X-Esa-Signature`の詳細](https://docs.esa.io/posts/37#X-Esa-Signature)

```typescript
import { createRouter } from '@suin/esa-webhook-router'
const router = createRouter({ secret: 'my_secret_key' })
```

## API リファレンス

https://suin.github.io/esa-webhook-router/

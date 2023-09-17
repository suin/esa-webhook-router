import { tunnel } from "cloudflared";
import { createServer } from "http";
import { createRouter, RoutingError } from "../..";

const port = 3000;
const secret = "a1b2c3d4e5f6g7h8i9j0k";

async function main() {
  const server = createServer(async (req, res) => {
    const route = createRouter({
      secret,
      post_create: ({ event }) => console.log("投稿が作成されました。", event),
      post_update: ({ event }) => console.log("投稿が更新されました。", event),
      post_archive: ({ event }) =>
        console.log("投稿がアーカイブされました。", event),
      post_delete: ({ event }) => console.log("投稿が削除されました。", event),
      post_restore: ({ event }) => console.log("投稿が復旧されました。", event),
    });
    try {
      await route(req);
    } catch (error) {
      if (error instanceof RoutingError) {
        console.error(error.message);
        res.writeHead(error.httpStatus);
        res.write(`${error.type} (${error.category}): ${error.message}`);
        res.end();
        return;
      }
      console.error(error);
      res.writeHead(500);
      res.write("Internal Server Error");
      res.end();
      return;
    }
    res.write("OK");
    res.end();
  });
  server.listen(port, () => console.log(`URL 1: http://127.0.0.1:${port}`));
  await new Promise((resolve, reject) =>
    server.on("error", reject).on("listening", resolve),
  );
  const url = await cloudflare();
  console.log("URL 2:", url);
  console.log(`::: esa Webhook Genericの設定例 :::
esaのWebhookの設定画面に以下のように設定してください。
表示名: esa-webhook-routerのテスト
フィルタ: (空欄)
URL: ${url} (このURLは起動ごとに変化するのでご注意を!)
Secret: ${secret}
[✓] 記事を新規作成した時
[✓] 記事を更新した時（ShipIt で保存時、またはWIP → ShipIt に変更時）
[✓] 記事を更新した時（WIP → ShipIt に変更時のみ）
[✓] 記事をアーカイブした時
[✓] 記事を削除した時
[✓] 記事を復旧した時
[ ] 記事の外部公開を開始／停止した時
[ ] Change log を更新した時
[ ] コメントが投稿された時
[ ] チームにメンバーが参加したとき
[ ] on Mentioned in Post
[ ] on Mentioned in Comment
[ ] docs.esa.io が更新されたとき`);
}

const cloudflare = async () => {
  const { url, connections, child } = tunnel({
    "--url": `http://127.0.0.1:${port}`,
  });
  await Promise.all(connections);
  child.on("exit", (code: unknown) => {
    console.log("tunnel process exited with code", code);
  });
  return await url;
};

main();

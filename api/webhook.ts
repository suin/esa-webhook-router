import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRouter, RoutingError } from "..";

const route = createRouter({
  post_create: ({ event }) => console.log("投稿が作成されました。", event),
  post_update: ({ event }) => console.log("投稿が更新されました。", event),
  post_archive: ({ event }) =>
    console.log("投稿がアーカイブされました。", event),
  post_delete: ({ event }) => console.log("投稿が削除されました。", event),
  post_restore: ({ event }) => console.log("投稿が復旧されました。", event),
});

const handler = async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> => {
  try {
    await route(req);
  } catch (error) {
    if (error instanceof RoutingError) {
      console.error(error.message);
      return res.status(error.httpStatus).json({
        ok: false,
        type: error.type,
        category: error.category,
        message: error.message,
      });
    }
    console.error(error);
    return res.status(500);
  }
  return res.status(200).json({ ok: true });
};

export default handler;

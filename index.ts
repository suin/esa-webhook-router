import type {
  DeletedPost,
  Event,
  Icon,
  Post,
  PostArchive,
  PostCreate,
  PostDelete,
  PostRestore,
  PostUpdate,
  PostWithDiff,
  Team,
  Thumb,
  User,
} from "./event";
import { isEvent } from "./event";
import { RoutingError } from "./routingError";
import type { RequestLike } from "./toRequest";
import { toRequest } from "./toRequest";
import { verifySignature } from "./verifySignature";

export type CreateRouter = <
  PostCreateHandler extends Handler<PostCreate, any> = (
    params: Params<PostCreate>,
  ) => void,
  PostUpdateHandler extends Handler<PostUpdate, any> = (
    params: Params<PostUpdate>,
  ) => void,
  PostArchiveHandler extends Handler<PostArchive, any> = (
    params: Params<PostArchive>,
  ) => void,
  PostDeleteHandler extends Handler<PostDelete, any> = (
    params: Params<PostDelete>,
  ) => void,
  PostRestoreHandler extends Handler<PostRestore, any> = (
    params: Params<PostRestore>,
  ) => void,
>(
  options: RouterOptions<
    PostCreateHandler,
    PostUpdateHandler,
    PostArchiveHandler,
    PostDeleteHandler,
    PostRestoreHandler
  >,
) => (
  request: RequestLike,
) => Promise<
  | Awaited<ReturnType<PostCreateHandler>>
  | Awaited<ReturnType<PostUpdateHandler>>
  | Awaited<ReturnType<PostArchiveHandler>>
  | Awaited<ReturnType<PostDeleteHandler>>
  | Awaited<ReturnType<PostRestoreHandler>>
>;

export type RouterOptions<
  PostCreateHandler extends Handler<PostCreate, any>,
  PostUpdateHandler extends Handler<PostUpdate, any>,
  PostArchiveHandler extends Handler<PostArchive, any>,
  PostDeleteHandler extends Handler<PostDelete, any>,
  PostRestoreHandler extends Handler<PostRestore, any>,
> = {
  readonly secret?: string | undefined;
  readonly post_create?: PostCreateHandler | undefined;
  readonly post_update?: PostUpdateHandler | undefined;
  readonly post_archive?: PostArchiveHandler | undefined;
  readonly post_delete?: PostDeleteHandler | undefined;
  readonly post_restore?: PostRestoreHandler | undefined;
};

export type Handler<EventType extends Event, ReturnType> = (
  params: Params<EventType>,
) => ReturnType | Promise<ReturnType>;
export type Params<EventType extends Event> = {
  event: EventType;
  request: Request;
};

export const createRouter: CreateRouter = (options) => async (requestLike) => {
  const {
    secret = process.env["ESA_WEBHOOK_SECRET"],
    post_create = defaultHandler,
    post_update = defaultHandler,
    post_archive = defaultHandler,
    post_delete = defaultHandler,
    post_restore = defaultHandler,
  } = options;
  const request = toRequest(requestLike);
  const signaturePayload = request.headers.get("x-esa-signature");
  if (isString(secret)) {
    if (!isString(signaturePayload)) {
      throw RoutingError.missingSignature({ request });
    }
    let body: ArrayBuffer | undefined;
    try {
      body = await request.clone().arrayBuffer();
    } catch (cause) {
      throw RoutingError.cannotReadBody({ request, cause });
    }
    const [, signature] = signaturePayload.match(/^sha256=(.+)$/) ?? [];
    if (!isString(signature)) {
      throw RoutingError.cannotParseSignature({
        request,
        signature: signaturePayload,
      });
    }
    let verified: boolean | undefined;
    try {
      verified = await verifySignature(secret, signature, body);
    } catch (cause) {
      throw RoutingError.cannotVerifySignature({ request, cause });
    }
    if (!verified) {
      throw RoutingError.invalidSignature({ request, signature });
    }
  }
  let event: Event | undefined;
  try {
    event = await request.clone().json();
  } catch (cause) {
    throw RoutingError.cannotReadJson({ request, cause });
  }
  const errors: string[] = [];
  if (!isEvent(event, errors)) {
    throw RoutingError.unsupportedEvent({ request, errors });
  }
  switch (event.kind) {
    case "post_create":
      return post_create({ event, request });
    case "post_update":
      return post_update({ event, request });
    case "post_archive":
      return post_archive({ event, request });
    case "post_delete":
      return post_delete({ event, request });
    case "post_restore":
      return post_restore({ event, request });
  }
};

const defaultHandler = (): void => {};

export type {
  RequestLike,
  Event,
  PostCreate,
  PostArchive,
  PostDelete,
  PostUpdate,
  DeletedPost,
  Post,
  Icon,
  PostWithDiff,
  Team,
  User,
  Thumb,
};

export { RoutingError };

const isString = (value: unknown): value is string => typeof value === "string";

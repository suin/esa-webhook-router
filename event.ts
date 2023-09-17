import { isObject } from "@suin/is-object";

export interface PostCreate {
  readonly kind: "post_create";
  readonly team: Team;
  readonly post: Post;
  readonly user: User;
}

export interface PostUpdate {
  readonly kind: "post_update";
  readonly team: Team;
  readonly post: PostWithDiff;
  readonly user: User;
}

export interface PostArchive {
  readonly kind: "post_archive";
  readonly team: Team;
  readonly post: Post;
  readonly user: User;
}

export interface PostDelete {
  readonly kind: "post_delete";
  readonly team: Team;
  readonly post: DeletedPost;
  readonly user: User;
}

export interface PostRestore {
  readonly kind: "post_restore";
  readonly team: Team;
  readonly post: Post;
  readonly user: User;
}

export interface Team {
  readonly name: string;
}

export interface Post {
  readonly name: string;
  readonly body_md: string;
  readonly body_html: string;
  readonly message: string;
  readonly wip: boolean;
  readonly number: number;
  readonly url: string;
}

export interface User {
  readonly icon: Icon;
  readonly name: string;
  readonly screen_name: string;
}

export interface Icon {
  readonly url: string;
  readonly thumb_s: Thumb;
  readonly thumb_ms: Thumb;
  readonly thumb_m: Thumb;
  readonly thumb_l: Thumb;
}

export interface Thumb {
  readonly url: string;
}

export interface PostWithDiff extends Post {
  readonly diff_url: string;
}

export interface DeletedPost {
  readonly name: string;
  readonly wip: boolean;
  readonly number: number;
}

type Kind = Event["kind"];
const kinds = new Set<Kind>([
  "post_create",
  "post_update",
  "post_archive",
  "post_delete",
  "post_restore",
]);

export type Event =
  | PostCreate
  | PostUpdate
  | PostArchive
  | PostDelete
  | PostRestore;

export const isEvent = (
  event: unknown,
  errors: string[] = [],
): event is Event => {
  if (!isObject<Event>(event)) {
    errors.push("The event is not an type object.");
    return false;
  }
  if (!kinds.has(event.kind as Kind)) {
    errors.push(
      `The \`kind\` value \`${JSON.stringify(event.kind)}\` is not supported.`,
    );
    return false;
  }
  return true;
};

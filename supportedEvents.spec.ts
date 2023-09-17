import { describe, expect, test } from "vitest";
import { createRouter, RoutingError, Event } from "./index";

describe("サポートするイベント", () => {
  test.each(supportedEvents)(
    "イベント $body.kind をサポートします。",
    async ({ method, url, headers, body }) => {
      const route = createRouter({
        post_create: ({ event }) => event,
        post_update: ({ event }) => event,
        post_archive: ({ event }) => event,
        post_delete: ({ event }) => event,
        post_restore: ({ event }) => event,
      });
      const request = new Request(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      const event = await route(request);
      expect(event.kind).toBe(body.kind);
      expect(event).toMatchObject(body);
    },
  );
});

describe("サポートしていないイベント", () => {
  test.each([
    "post_start_sharing",
    "post_stop_sharing",
    "comment_create",
    "member_join",
  ] as const)("イベント %s はサポートしていません。", async (kind) => {
    const route = createRouter({ [kind]: ({ event }: any) => event });
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ kind }),
    });
    expect(route(request)).rejects.toThrow(RoutingError);
  });
});

const supportedEvents = [
  {
    method: "POST",
    url: "https://example.com/webhook",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      "user-agent": "esa-Hookshot/v1",
      "x-esa-delivery": "1",
    },
    body: {
      kind: "post_create",
      team: {
        name: "esa",
      },
      post: {
        name: "たいとる",
        body_md: "ほんぶん",
        body_html: "<p>ほんぶん</p>\n",
        message: "Create post.",
        wip: false,
        number: 1253,
        url: "https://example.esa.io/posts/1253",
      },
      user: {
        icon: {
          url: "https://img.esa.io/uploads/production/users/1/icon/402685a258cf2a33c1d6c13a89adec92.png",
          thumb_s: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_s_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_ms: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_ms_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_m: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_m_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_l: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_l_402685a258cf2a33c1d6c13a89adec92.png",
          },
        },
        name: "Atsuo Fukaya",
        screen_name: "fukayatsu",
      },
    },
  },
  {
    method: "POST",
    url: "https://example.com/webhook",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      "user-agent": "esa-Hookshot/v1",
      "x-esa-delivery": "1",
    },
    body: {
      kind: "post_update",
      team: {
        name: "esa",
      },
      post: {
        name: "たいとる",
        body_md: "ほんぶん",
        body_html: "<p>ほんぶん</p>\n",
        message: "Update post.",
        wip: false,
        number: 1253,
        url: "https://example.esa.io/posts/1253",
        diff_url: "https://example.esa.io/posts/1253/revisions/3",
      },
      user: {
        icon: {
          url: "https://img.esa.io/uploads/production/users/1/icon/402685a258cf2a33c1d6c13a89adec92.png",
          thumb_s: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_s_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_ms: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_ms_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_m: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_m_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_l: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_l_402685a258cf2a33c1d6c13a89adec92.png",
          },
        },
        name: "Atsuo Fukaya",
        screen_name: "fukayatsu",
      },
    },
  },
  {
    method: "POST",
    url: "https://example.com/webhook",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      "user-agent": "esa-Hookshot/v1",
      "x-esa-delivery": "1",
    },
    body: {
      kind: "post_archive",
      team: {
        name: "esa",
      },
      post: {
        name: "Archived/たいとる",
        body_md: "ほんぶん",
        body_html: "<p>ほんぶん</p>\n",
        message: "Archived!",
        wip: false,
        number: 1253,
        url: "https://example.esa.io/posts/1253",
      },
      user: {
        icon: {
          url: "https://img.esa.io/uploads/production/users/1/icon/402685a258cf2a33c1d6c13a89adec92.png",
          thumb_s: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_s_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_ms: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_ms_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_m: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_m_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_l: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_l_402685a258cf2a33c1d6c13a89adec92.png",
          },
        },
        name: "Atsuo Fukaya",
        screen_name: "fukayatsu",
      },
    },
  },
  {
    method: "POST",
    url: "https://example.com/webhook",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      "user-agent": "esa-Hookshot/v1",
      "x-esa-delivery": "1",
    },
    body: {
      kind: "post_delete",
      team: {
        name: "esa",
      },
      post: {
        name: "たいとる",
        wip: false,
        number: 1253,
      },
      user: {
        icon: {
          url: "https://img.esa.io/uploads/production/users/1/icon/402685a258cf2a33c1d6c13a89adec92.png",
          thumb_s: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_s_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_ms: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_ms_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_m: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_m_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_l: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_l_402685a258cf2a33c1d6c13a89adec92.png",
          },
        },
        name: "Atsuo Fukaya",
        screen_name: "fukayatsu",
      },
    },
  },
  {
    method: "POST",
    url: "https://example.com/webhook",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      "user-agent": "esa-Hookshot/v1",
      "x-esa-delivery": "1",
    },
    body: {
      kind: "post_restore",
      team: {
        name: "esa",
      },
      post: {
        name: "たいとる",
        body_md: "ほんぶん",
        body_html: "<p>ほんぶん</p>\n",
        message: "Create post.",
        wip: false,
        number: 1253,
        url: "https://example.esa.io/posts/1253",
      },
      user: {
        icon: {
          url: "https://img.esa.io/uploads/production/users/1/icon/402685a258cf2a33c1d6c13a89adec92.png",
          thumb_s: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_s_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_ms: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_ms_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_m: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_m_402685a258cf2a33c1d6c13a89adec92.png",
          },
          thumb_l: {
            url: "https://img.esa.io/uploads/production/users/1/icon/thumb_l_402685a258cf2a33c1d6c13a89adec92.png",
          },
        },
        name: "Atsuo Fukaya",
        screen_name: "fukayatsu",
      },
    },
  },
] as const;

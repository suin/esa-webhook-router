import { test, vi, afterAll, expect, assertType, describe } from "vitest";
import { createRouter, RequestLike, RoutingError } from ".";

test("基本的な使い方", async () => {
  // `createRouter`には、イベントの種類ごとに実行するハンドラー関数を渡します。
  const route = createRouter({
    post_create: ({ event }) => console.log("投稿が作成されました。", event),
    post_update: ({ event }) => console.log("投稿が更新されました。", event),
    post_archive: ({ event }) =>
      console.log("投稿がアーカイブされました。", event),
    post_delete: ({ event }) => console.log("投稿が削除されました。", event),
    post_restore: ({ event }) => console.log("投稿が復旧されました。", event),
  });
  // `createRouter`の戻り値は関数なので、それにHTTPリクエストを渡すと、ハンドラーが実行されます。
  await route(
    new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({
        kind: "post_create",
        post: { name: "記事のタイトル" },
      }),
    }),
  );
  // この例では、ハンドラーが実行され、コンソールに次の出力が表示されます。
  output("投稿が作成されました。", {
    kind: "post_create",
    post: { name: "記事のタイトル" },
  });
});

describe("ハンドラー", () => {
  test("ハンドラーの戻り値はroute関数の戻り値になります。", async () => {
    // numberを返すハンドラーを登録します。
    const route = createRouter({
      post_create: ({ event }): number => event.post.number,
    });
    // Webhookで送られてくるHTTPリクエスト
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({
        kind: "post_create",
        post: { number: 123 },
      }),
    });
    // ハンドラーの戻り値であるnumberが`route`関数から返されます。
    const number: number | void = await route(request);
    // `route`の戻り値を後続の処理で扱うことができます
    console.log(`作成された投稿番号は${number}です。`);
    output("作成された投稿番号は123です。");
  });

  test("なぜ`void`が戻り値に含まれる？", async () => {
    // 上の例では、`post_create`にだけハンドラーをセットしていました。
    // そのため、`post_update`など他のイベントを処理したときの戻り値である`void`を含めた
    // `number | void`が`route`関数の戻り値となっていました。
    //
    // すべてのイベントに対してハンドラーをセットすると、`void`は含まれなくなります。
    const route = createRouter({
      post_create: ({ event }): number => event.post.number,
      post_update: ({ event }): number => event.post.number,
      post_archive: ({ event }): number => event.post.number,
      post_delete: ({ event }): number => event.post.number,
      post_restore: ({ event }): number => event.post.number,
    });
    assertType<
      // `route`関数は、戻り値に`void`を含まず`number`型だけを返す型になります。
      (request: any) => Promise<number>
    >(route);
  });

  test("ハンドラーには非同期関数を用いることができます。", async () => {
    const route = createRouter({
      post_create: async () => "OK", // 非同期関数を渡しています。
    });
    // Webhookで送られてくるHTTPリクエスト
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ kind: "post_create" }),
    });
    // 非同期ハンドラーの戻り値を扱うこともできます。
    const result = await route(request);
    expect(result).toBe("OK");
    assertType<
      // なお、`route`関数は次の型になります。
      (request: RequestLike) => Promise<string | void>
    >(route);
  });

  test("ハンドラーに同期関数と非同期関数を混ぜることもできます。", async () => {
    const route = createRouter({
      post_create: async () => "OK", // 非同期関数を渡しています。
      post_update: () => "OK", // 同期関数を渡しています。
    });
    assertType<
      // この場合の`route`関数は次の型になります。
      (request: RequestLike) => Promise<string | void>
    >(route);
  });
});

describe("署名の検証", () => {
  test("secretを環境変数で指定する。", async () => {
    // 環境変数に`ESA_WEBHOOK_SECRET`をセットします。
    process.env["ESA_WEBHOOK_SECRET"] = "secret_key";
    const route = createRouter({
      /* ... */
    });
    // 署名されていない不正なリクエスト
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({
        /* ... */
      }),
    });
    // `route`関数を実行すると、署名が検証され、署名が正しくない場合はエラーが発生します。
    expect(route(request)).rejects.toThrowError("Signature is missing");
  });
  afterAll(() => {
    delete process.env["ESA_WEBHOOK_SECRET"];
  });
  test("secretをオプションで指定する。", () => {
    // secretオプションを指定することで、リクエストの署名を検証できます。
    const route = createRouter({ secret: "secret_key" });
    // 署名されていない不正なリクエスト
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({
        /* ... */
      }),
    });
    // `route`関数を実行すると、署名が検証され、署名が正しくない場合はエラーが発生します。
    expect(route(request)).rejects.toThrowError("Signature is missing");
  });
});

describe("エラーハンドリング", () => {
  test("RoutingErrorを用いてエラー時の処理を実装することができます。", async () => {
    const route = createRouter({
      post_create: () => {
        /* ... */
      },
    });
    // 不正なJSONを持ったリクエスト
    const request = new Request("https://example.com", {
      method: "POST",
      body: "invalid JSON body",
    });
    try {
      await route(request);
    } catch (e: unknown) {
      // RoutingError型に絞り込みます
      if (e instanceof RoutingError) {
        expect(e.message).toMatch(/^Cannot read body as JSON: SyntaxError/);
        // RoutingErrorはいくつかの文脈情報を持っているのでそれを利用してなにかすることもできます。
        // `type`プロパティで絞り込むことでエラー種別ごとのエラー処理もできます。
        switch (e.type) {
          case "cannotReadBody":
            /* ...任意の処理... */
            break;
          case "cannotReadJson":
            /* ...任意の処理... */
            break;
          // 他にどのような`type`があるかは、RoutingErrorクラスの宣言をご確認ください。
        }
        // エラーの種別をHTTPステータスで表現した値も提供してあります。
        // これは、エラーを元にレスポンスを返すときに利用されることを想定しています。
        expect(e.httpStatus).toBe(400);
        // エラーが発生した際のHTTPリクエストも持っています。
        expect(e.request).toBe(request);
        // エラーを発生させた原因が他の例外である場合は、その例外も持っています。
        expect(e.cause).toMatch(/SyntaxError/);
      } else {
        throw e;
      }
    }
  });
});

const consoleMock = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);
const output = <E extends any[]>(...args: E) => {
  expect(consoleMock).toHaveBeenLastCalledWith(...args);
};

afterAll(() => {
  consoleMock.mockReset();
});

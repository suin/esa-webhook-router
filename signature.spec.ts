import { expect, test } from "vitest";
import { createRouter, RoutingError } from ".";
import { importKey, useCrypto } from "./verifySignature";

const secret = "secret_key";

test("署名が正しいときは、ハンドラーを実行する", async () => {
  const route = createRouter({ secret, post_create: () => true });
  const body = JSON.stringify({ kind: "post_create" });
  const request = new Request("https://example.com", {
    method: "POST",
    headers: { "x-esa-signature": `sha256=${await sign(body)}` },
    body,
  });
  const isCalled = await route(request);
  expect(isCalled).toBe(true);
});
test("署名が不正なときは、ハンドラーは実行しない", async () => {
  const route = createRouter({
    secret,
    post_create: () => {
      throw new Error("This handler should not be called");
    },
  });
  const body = JSON.stringify({ kind: "post_create" });
  const request = new Request("https://example.com", {
    method: "POST",
    headers: { "x-esa-signature": `sha256=${await sign("invalid")}` },
    body,
  });
  expect(route(request)).rejects.toThrowError(RoutingError);
});
test("署名のヘッダーがないときは、RoutingErrorが発生する", async () => {
  const route = createRouter({ secret });
  const request = new Request("https://example.com", { method: "POST" });
  expect(route(request)).rejects.toMatchInlineSnapshot(
    "[RoutingError: Signature is missing]",
  );
});
test("署名のヘッダーをパースできないときは、RoutingErrorが発生する", async () => {
  const route = createRouter({ secret });
  const request = new Request("https://example.com", {
    method: "POST",
    headers: { "x-esa-signature": "invalid" },
  });
  expect(route(request)).rejects.toMatchInlineSnapshot(
    "[RoutingError: Cannot parse signature: invalid]",
  );
});
test("署名が不正なときは、RoutingErrorが発生する", async () => {
  const route = createRouter({ secret });
  const body = JSON.stringify({ kind: "post_create" });
  const request = new Request("https://example.com", {
    method: "POST",
    headers: { "x-esa-signature": `sha256=${await sign("異なるコンテンツ")}` },
    body,
  });
  expect(route(request)).rejects.toMatchInlineSnapshot(
    "[RoutingError: Invalid signature provided: 63a4454817d5a29c5655c83d0fa0fa5fd93c281e8e4dff259d3de913e5d7648c]",
  );
});

const sign = async (value: string): Promise<string> => {
  const crypto = await useCrypto();
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    { name: "HMAC" },
    key,
    new TextEncoder().encode(value),
  );
  return bufferToHex(signature);
};

const bufferToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

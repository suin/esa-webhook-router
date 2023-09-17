import { isObject } from "@suin/is-object";
import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import type { Readable } from "node:stream";

export const isIncomingMessage = (
  request: unknown,
): request is IncomingMessage =>
  isObject<IncomingMessage>(request) &&
  typeof request.method === "string" &&
  isObject<IncomingMessage["headers"]>(request.headers) &&
  typeof request.setEncoding === "function" &&
  typeof request.on === "function";

export const incomingMessageToRequest = (request: IncomingMessage): Request => {
  const init: RequestInit = {
    headers: toHeaders(request.headers),
    body:
      request.method == "GET" || request.method == "HEAD"
        ? null
        : toStream(request),
    duplex: "half",
  };
  if (request.method) {
    init.method = request.method;
  }
  return new Request(toUrl(request), init);
};

const toUrl = (request: IncomingMessage): URL => {
  const protocol = request.headers["x-forwarded-proto"] ?? "http";
  const host = request.headers.host ?? "127.0.0.1";
  return new URL(request.url || "/", `${protocol}://${host}`);
};

const toHeaders = (nodeHeaders: IncomingHttpHeaders): Headers => {
  const headers = new Headers();
  for (const [key, values] of Object.entries(nodeHeaders)) {
    if (Array.isArray(values)) {
      for (const value of values) {
        headers.append(key, value);
      }
    } else if (typeof values === "string") {
      headers.append(key, values);
    }
  }
  return headers;
};

const toStream = (stream: Readable): ReadableStream =>
  new ReadableStream({
    start: (controller) => {
      stream.on("data", (chunk) =>
        controller.enqueue(new Uint8Array([...new Uint8Array(chunk)])),
      );
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

declare module "node:http" {
  interface IncomingMessage {
    /**
     * Express extension http://expressjs.com/en/api.html#req.secure
     */
    secure?: boolean;
  }
}

declare global {
  interface RequestInit {
    duplex?: "full" | "half";
  }
}

import type { IncomingMessage } from "node:http";
import { describe, test, expect } from "vitest";
import { incomingMessageToRequest } from "./incomingMessage";
import mock from "mock-http";

describe("IncomingMessageをRequestに変換できます。", () => {
  test("methodをマッピングします。", () => {
    const incomingMessage: IncomingMessage = new mock.Request({
      method: "POST",
    });
    const request = incomingMessageToRequest(incomingMessage);
    expect(request.method).toBe("POST");
  });
  test("headersをマッピングします。", () => {
    const incomingMessage: IncomingMessage = new mock.Request({
      headers: {
        "content-type": "application/json",
      },
    });
    const request = incomingMessageToRequest(incomingMessage);
    expect(request.headers.get("content-type")).toBe("application/json");
  });
  test("bodyをマッピングします。", async () => {
    const incomingMessage: IncomingMessage = new mock.Request({
      method: "POST",
      buffer: Buffer.from("body"),
    });
    const request = incomingMessageToRequest(incomingMessage);
    expect(await request.text()).toBe("body");
  });
});

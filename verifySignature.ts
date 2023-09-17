import { webcrypto as crypto } from "node:crypto";

export const verifySignature = async (
  secret: string,
  signature: string,
  value: ArrayBuffer,
): Promise<boolean> =>
  await (
    await useCrypto()
  ).subtle.verify(
    algo.name,
    await importKey(secret),
    toBuffer(signature),
    value,
  );

const algo = { name: "HMAC", hash: "SHA-256" } as const;

export const importKey = async (secret: string): Promise<CryptoKey> =>
  await (
    await useCrypto()
  ).subtle.importKey("raw", encoder.encode(secret), algo, false, [
    "sign",
    "verify",
  ]);

const toBuffer = (hexString: string) =>
  new Uint8Array(
    (hexString.match(/../g) ?? []).map((hex) => parseInt(hex, 16)),
  );

const encoder = new TextEncoder();

export const useCrypto = async () =>
  typeof crypto === "undefined"
    ? (await import("node:crypto")).default.webcrypto
    : crypto;

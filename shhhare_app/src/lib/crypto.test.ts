import bs58 from "bs58";
import { describe, expect, it } from "vitest";
import { fromBase64, toBase64 } from "@/lib/base64";
import { CryptoError, ENVELOPE_OVERHEAD, KEY_BYTES, VERSION, decrypt, encrypt, isValidKey } from "@/lib/crypto";

const plaintext = new TextEncoder().encode("correct horse battery staple");

async function expectCryptoError(promise: Promise<unknown>, code: CryptoError["code"]) {
    const err = await promise.then(
        () => null,
        (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(CryptoError);
    expect((err as CryptoError).code).toBe(code);
}

describe("encrypt / decrypt", () => {
    it("round-trips", async () => {
        const { val, key } = await encrypt(plaintext);
        expect(await decrypt(val, key)).toEqual(plaintext);
    });

    it("produces a versioned envelope and a 32-byte base58 key", async () => {
        const { val, key } = await encrypt(plaintext);
        const envelope = fromBase64(val);
        expect(envelope[0]).toBe(VERSION);
        expect(envelope.length).toBe(plaintext.length + ENVELOPE_OVERHEAD);
        expect(bs58.decode(key)).toHaveLength(KEY_BYTES);
    });

    it("uses a fresh key and IV every time", async () => {
        const a = await encrypt(plaintext);
        const b = await encrypt(plaintext);
        expect(a.key).not.toBe(b.key);
        expect(a.val).not.toBe(b.val);
    });

    it("fails with the wrong key", async () => {
        const { val } = await encrypt(plaintext);
        const other = await encrypt(plaintext);
        await expectCryptoError(decrypt(val, other.key), "decrypt");
    });

    it("fails when the ciphertext is altered", async () => {
        const { val, key } = await encrypt(plaintext);
        const envelope = fromBase64(val);
        envelope[envelope.length - 1] ^= 1;
        await expectCryptoError(decrypt(toBase64(envelope), key), "decrypt");
    });

    it("fails when the version byte is altered", async () => {
        const { val, key } = await encrypt(plaintext);
        const envelope = fromBase64(val);
        envelope[0] = VERSION + 1;
        await expectCryptoError(decrypt(toBase64(envelope), key), "format");
    });

    it("rejects malformed keys before decrypting", async () => {
        const { val } = await encrypt(plaintext);
        await expectCryptoError(decrypt(val, "not-a-key"), "key");
    });

    it("rejects truncated envelopes", async () => {
        const { key } = await encrypt(plaintext);
        await expectCryptoError(decrypt(toBase64(new Uint8Array([VERSION, 1, 2])), key), "format");
        await expectCryptoError(decrypt("%%%", key), "format");
    });
});

describe("isValidKey", () => {
    it("accepts generated keys, with surrounding whitespace", async () => {
        const { key } = await encrypt(plaintext);
        expect(isValidKey(key)).toBe(true);
        expect(isValidKey(`  ${key}\n`)).toBe(true);
    });

    it("rejects keys with typos or the wrong length", async () => {
        const { key } = await encrypt(plaintext);
        expect(isValidKey("")).toBe(false);
        expect(isValidKey(key.slice(0, -2))).toBe(false);
        expect(isValidKey(`${key}zz`)).toBe(false);
        expect(isValidKey(key.replace(/.$/, "0"))).toBe(false); // "0" is not in the base58 alphabet
        expect(isValidKey(bs58.encode(new Uint8Array(44)))).toBe(false);
    });
});

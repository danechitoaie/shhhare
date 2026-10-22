import { describe, expect, it } from "vitest";
import { base64Length, fromBase64, fromBase64Fallback, toBase64, toBase64Fallback } from "@/lib/base64";

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i += 65536) {
        crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
    }

    return out;
}

describe("base64", () => {
    it.each([0, 1, 2, 3, 4, 255, 0x8000, 0x8001, 200_000])("round-trips %i bytes", (n) => {
        const bytes = randomBytes(n);
        const encoded = toBase64(bytes);
        expect(encoded.length).toBe(base64Length(n));
        expect(fromBase64(encoded)).toEqual(bytes);
    });

    it.each([
        ["", ""],
        ["f", "Zg=="],
        ["fo", "Zm8="],
        ["foo", "Zm9v"],
        ["foob", "Zm9vYg=="],
        ["fooba", "Zm9vYmE="],
        ["foobar", "Zm9vYmFy"],
    ])("matches the RFC 4648 vector for %j", (input, expected) => {
        const bytes = new TextEncoder().encode(input);
        expect(toBase64(bytes)).toBe(expected);
        expect(toBase64Fallback(bytes)).toBe(expected);
        expect(fromBase64Fallback(expected)).toEqual(bytes);
    });

    it("fallback agrees with the default implementation", () => {
        const bytes = randomBytes(100_003);
        expect(toBase64Fallback(bytes)).toBe(toBase64(bytes));
        expect(fromBase64Fallback(toBase64(bytes))).toEqual(bytes);
    });

    it("rejects invalid input", () => {
        expect(() => fromBase64("not base64!")).toThrow();
    });
});

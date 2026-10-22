import bs58 from "bs58";
import { describe, expect, it } from "vitest";
import { isValidSecretId } from "@/lib/api";

describe("isValidSecretId", () => {
    it("accepts base58-encoded 32-byte ids", () => {
        for (let i = 0; i < 20; i++) {
            expect(isValidSecretId(bs58.encode(crypto.getRandomValues(new Uint8Array(32))))).toBe(true);
        }
    });

    it("rejects anything else", () => {
        expect(isValidSecretId("")).toBe(false);
        expect(isValidSecretId("hello")).toBe(false);
        expect(isValidSecretId("../../etc/passwd")).toBe(false);
        expect(isValidSecretId(bs58.encode(new Uint8Array(31).fill(9)))).toBe(false);
        expect(isValidSecretId("O0Il".repeat(11))).toBe(false);
    });
});

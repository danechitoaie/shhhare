import { describe, expect, it } from "vitest";
import { encrypt } from "@/lib/crypto";
import {
    PAD_BLOCK,
    PayloadError,
    decodePayload,
    encodePayload,
    maxPlaintextLength,
    payloadSize,
    type Payload,
} from "@/lib/payload";

const enc = new TextEncoder();

function file(name: string, content: string | Uint8Array, type = "text/plain") {
    return { name, type, bytes: typeof content === "string" ? enc.encode(content) : content };
}

function metas(payload: Payload) {
    return payload.files.map((f) => ({ name: f.name, type: f.type, size: f.bytes.length }));
}

const samples: Payload[] = [
    { text: "", files: [] },
    { text: "hunter2", files: [] },
    { text: "multi\nline\ttext with \"quotes\" and \\ backslashes", files: [] },
    { text: "ünïcödé 🔐 秘密  ", files: [] },
    { text: "", files: [file("a.txt", "hello")] },
    { text: "see attached", files: [file("Résumé 📄.pdf", new Uint8Array(1000).fill(7), "application/pdf")] },
    { text: "empty file", files: [file("empty", new Uint8Array(0), "")] },
    {
        text: "x".repeat(5000),
        files: [file("one.bin", new Uint8Array(3333).fill(1)), file("two.bin", new Uint8Array(1).fill(2))],
    },
];

describe("encodePayload / decodePayload", () => {
    it.each(samples.map((s, i) => [i, s] as const))("round-trips sample %i", (_, payload) => {
        const decoded = decodePayload(encodePayload(payload));
        expect(decoded.text).toBe(payload.text);
        expect(decoded.files).toHaveLength(payload.files.length);
        decoded.files.forEach((f, i) => {
            expect(f.name).toBe(payload.files[i].name);
            expect(f.type).toBe(payload.files[i].type);
            expect(f.bytes).toEqual(payload.files[i].bytes);
        });
    });

    it("pads to a multiple of the block size", () => {
        for (const payload of samples) {
            expect(encodePayload(payload).length % PAD_BLOCK).toBe(0);
        }
    });

    it("hides the length of short secrets", () => {
        const a = encodePayload({ text: "a", files: [] });
        const b = encodePayload({ text: "a much longer password!!", files: [] });
        expect(a.length).toBe(b.length);
    });

    it("never pads a fitting payload past the limit", () => {
        const maxSize = 4000;
        const limit = maxPlaintextLength(maxSize);
        const text = "y".repeat(limit - 20);
        const encoded = encodePayload({ text, files: [] }, maxSize);
        expect(encoded.length).toBe(limit);
        expect(decodePayload(encoded).text).toBe(text);
    });

    it("leaves an oversized payload unpadded", () => {
        const maxSize = 1000;
        const text = "z".repeat(2000);
        const unpadded = 4 + enc.encode(JSON.stringify({ t: text, f: [] })).length;
        expect(encodePayload({ text, files: [] }, maxSize).length).toBe(unpadded);
    });
});

describe("decodePayload rejects malformed input", () => {
    function withHeader(header: string, extra: Uint8Array = new Uint8Array(0)) {
        const h = enc.encode(header);
        const out = new Uint8Array(4 + h.length + extra.length);
        new DataView(out.buffer).setUint32(0, h.length);
        out.set(h, 4);
        out.set(extra, 4 + h.length);
        return out;
    }

    it.each([
        ["too short", new Uint8Array(3)],
        ["header length past the end", (() => {
            const out = new Uint8Array(8);
            new DataView(out.buffer).setUint32(0, 100);
            return out;
        })()],
        ["invalid JSON", withHeader("{nope")],
        ["invalid UTF-8", (() => {
            const out = new Uint8Array(6);
            new DataView(out.buffer).setUint32(0, 2);
            out.set([0xff, 0xfe], 4);
            return out;
        })()],
        ["wrong shape", withHeader('{"t":1,"f":[]}')],
        ["files not an array", withHeader('{"t":"","f":{}}')],
        ["bad file entry", withHeader('{"t":"","f":[{"n":"a","t":"","s":-1}]}')],
        ["fractional size", withHeader('{"t":"","f":[{"n":"a","t":"","s":1.5}]}')],
        ["file past the end", withHeader('{"t":"","f":[{"n":"a","t":"","s":10}]}', new Uint8Array(5))],
        ["non-zero padding", withHeader('{"t":"","f":[]}', new Uint8Array([0, 0, 1]))],
    ])("%s", (_, bytes) => {
        expect(() => decodePayload(bytes)).toThrow(PayloadError);
    });
});

describe("payloadSize", () => {
    it.each(samples.map((s, i) => [i, s] as const))(
        "matches the real encrypted length for sample %i",
        async (_, payload) => {
            for (const maxSize of [undefined, 256_000, 6000]) {
                const sealed = await encrypt(encodePayload(payload, maxSize));
                expect(payloadSize(payload.text, metas(payload), maxSize)).toBe(sealed.val.length);
            }
        },
    );

    it("matches the real length at and around the limit", async () => {
        const maxSize = 2048;
        const limit = maxPlaintextLength(maxSize);
        const base = 4 + enc.encode(JSON.stringify({ t: "", f: [] })).length;
        for (const delta of [-300, -1, 0, 1, 2, 3, 300]) {
            const text = "q".repeat(Math.max(0, limit - base + delta));
            const sealed = await encrypt(encodePayload({ text, files: [] }, maxSize));
            const size = payloadSize(text, [], maxSize);
            expect(size).toBe(sealed.val.length);
            expect(size <= maxSize).toBe(delta <= 0);
        }
    });
});

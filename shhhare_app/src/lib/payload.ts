import { base64Length } from "@/lib/base64";
import { ENVELOPE_OVERHEAD } from "@/lib/crypto";

/**
 * Plaintext container that gets encrypted:
 *
 *     headerLength (u32 BE) ‖ header (UTF-8 JSON) ‖ file bytes… ‖ zero padding
 *
 * where the header is `{"t": text, "f": [{"n": name, "t": mime, "s": size}]}` and the
 * file bytes follow in header order. Zero padding rounds the container up to a multiple
 * of PAD_BLOCK bytes so the server can't tell the exact length of short secrets.
 */
export const PAD_BLOCK = 256;
const LENGTH_BYTES = 4;

export type PayloadFile = { name: string; type: string; bytes: Uint8Array };
export type Payload = { text: string; files: PayloadFile[] };

/** File metadata needed to size a payload without reading the file contents. */
export type FileMeta = { name: string; type: string; size: number };

type Header = { t: string; f: { n: string; t: string; s: number }[] };

export class PayloadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PayloadError";
    }
}

function encodeHeader(text: string, files: FileMeta[]): Uint8Array<ArrayBuffer> {
    const header: Header = { t: text, f: files.map((f) => ({ n: f.name, t: f.type, s: f.size })) };
    return new TextEncoder().encode(JSON.stringify(header));
}

/** Largest plaintext whose envelope still fits in `maxSize` base64 characters. */
export function maxPlaintextLength(maxSize: number): number {
    return Math.floor(maxSize / 4) * 3 - ENVELOPE_OVERHEAD;
}

/**
 * Rounds `length` up to the next PAD_BLOCK, but never past what fits in `maxSize`.
 * A payload that is already too large is left as is.
 */
export function paddedLength(length: number, maxSize?: number): number {
    const padded = Math.ceil(length / PAD_BLOCK) * PAD_BLOCK;
    if (maxSize === undefined) {
        return padded;
    }

    const limit = maxPlaintextLength(maxSize);
    return length > limit ? length : Math.min(padded, limit);
}

/**
 * Exact length of the base64 value the server receives (and checks against MAX_SIZE)
 * for this text and these files, computed without encrypting anything.
 */
export function payloadSize(text: string, files: FileMeta[], maxSize?: number): number {
    const fileBytes = files.reduce((sum, f) => sum + f.size, 0);
    const length = LENGTH_BYTES + encodeHeader(text, files).length + fileBytes;
    return base64Length(ENVELOPE_OVERHEAD + paddedLength(length, maxSize));
}

export function encodePayload(payload: Payload, maxSize?: number): Uint8Array<ArrayBuffer> {
    const metas = payload.files.map((f) => ({ name: f.name, type: f.type, size: f.bytes.length }));
    const header = encodeHeader(payload.text, metas);
    const fileBytes = metas.reduce((sum, f) => sum + f.size, 0);
    const length = LENGTH_BYTES + header.length + fileBytes;

    const out = new Uint8Array(paddedLength(length, maxSize));
    new DataView(out.buffer).setUint32(0, header.length);
    out.set(header, LENGTH_BYTES);

    let offset = LENGTH_BYTES + header.length;
    for (const file of payload.files) {
        out.set(file.bytes, offset);
        offset += file.bytes.length;
    }

    return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseHeader(bytes: Uint8Array): Header {
    let header: unknown;
    try {
        header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
        throw new PayloadError("The secret header is not valid JSON.");
    }

    if (!isRecord(header) || typeof header.t !== "string" || !Array.isArray(header.f)) {
        throw new PayloadError("The secret header has an unexpected shape.");
    }

    const files = header.f.map((f: unknown) => {
        if (
            !isRecord(f) ||
            typeof f.n !== "string" ||
            typeof f.t !== "string" ||
            typeof f.s !== "number" ||
            !Number.isSafeInteger(f.s) ||
            f.s < 0
        ) {
            throw new PayloadError("The secret header lists an invalid file.");
        }

        return { n: f.n, t: f.t, s: f.s };
    });

    return { t: header.t, f: files };
}

export function decodePayload(bytes: Uint8Array): Payload {
    if (bytes.length < LENGTH_BYTES) {
        throw new PayloadError("The secret is truncated.");
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const headerLength = view.getUint32(0);
    if (headerLength > bytes.length - LENGTH_BYTES) {
        throw new PayloadError("The secret header is truncated.");
    }

    const header = parseHeader(bytes.subarray(LENGTH_BYTES, LENGTH_BYTES + headerLength));

    let offset = LENGTH_BYTES + headerLength;
    const files: PayloadFile[] = header.f.map((f) => {
        if (f.s > bytes.length - offset) {
            throw new PayloadError("A file in the secret is truncated.");
        }

        const file = { name: f.n, type: f.t, bytes: bytes.subarray(offset, offset + f.s) };
        offset += f.s;
        return file;
    });

    for (let i = offset; i < bytes.length; i++) {
        if (bytes[i] !== 0) {
            throw new PayloadError("The secret has unexpected trailing data.");
        }
    }

    return { text: header.t, files };
}

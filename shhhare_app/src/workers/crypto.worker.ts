import { CryptoError, decrypt, encrypt, type Sealed } from "@/lib/crypto";
import { PayloadError, decodePayload, encodePayload } from "@/lib/payload";

export type WorkerRequest =
    { op: "encrypt"; text: string; files: File[]; maxSize?: number } | { op: "decrypt"; val: string; key: string };

export type RevealedFile = { name: string; type: string; blob: Blob };
export type Revealed = { text: string; files: RevealedFile[] };

export type WorkerErrorCode = "key" | "format" | "decrypt" | "read" | "unknown";

export type WorkerResponse =
    { ok: true; result: Sealed | Revealed } | { ok: false; code: WorkerErrorCode; message: string };

const MIME_TYPE = /^[\w.+-]+\/[\w.+-]+$/;

class ReadError extends Error {}

async function onEncrypt(text: string, files: File[], maxSize?: number): Promise<Sealed> {
    let contents: { name: string; type: string; bytes: Uint8Array }[];
    try {
        contents = await Promise.all(
            files.map(async (f) => ({ name: f.name, type: f.type, bytes: new Uint8Array(await f.arrayBuffer()) })),
        );
    } catch (err) {
        throw new ReadError("Could not read one of the attached files.", { cause: err });
    }

    return encrypt(encodePayload({ text, files: contents }, maxSize));
}

async function onDecrypt(val: string, key: string): Promise<Revealed> {
    const payload = decodePayload(await decrypt(val, key));
    return {
        text: payload.text,
        files: payload.files.map((f) => {
            const type = MIME_TYPE.test(f.type) ? f.type : "application/octet-stream";
            return { name: f.name, type, blob: new Blob([f.bytes.slice()], { type }) };
        }),
    };
}

function toErrorResponse(err: unknown): WorkerResponse {
    if (err instanceof CryptoError) {
        return { ok: false, code: err.code, message: err.message };
    }

    if (err instanceof PayloadError) {
        return { ok: false, code: "format", message: err.message };
    }

    if (err instanceof ReadError) {
        return { ok: false, code: "read", message: err.message };
    }

    return { ok: false, code: "unknown", message: err instanceof Error ? err.message : String(err) };
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    let response: WorkerResponse;
    try {
        const req = e.data;
        const result =
            req.op === "encrypt"
                ? await onEncrypt(req.text, req.files, req.maxSize)
                : await onDecrypt(req.val, req.key);
        response = { ok: true, result };
    } catch (err) {
        response = toErrorResponse(err);
    }

    self.postMessage(response);
};

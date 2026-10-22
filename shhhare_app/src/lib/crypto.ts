import bs58 from "bs58";
import { fromBase64, toBase64 } from "@/lib/base64";

/**
 * Envelope stored on the server (as base64):
 *
 *     version (1) ‖ iv (12) ‖ AES-256-GCM ciphertext ‖ tag (16)
 *
 * The version byte is authenticated as additional data. The 256-bit key is
 * shared as base58 in the URL fragment and never reaches the server.
 */
export const VERSION = 0x01;
export const KEY_BYTES = 32;
export const IV_BYTES = 12;
export const TAG_BYTES = 16;
export const ENVELOPE_OVERHEAD = 1 + IV_BYTES + TAG_BYTES;

const ALGORITHM = "AES-GCM";

export type CryptoErrorCode = "key" | "format" | "decrypt";

export class CryptoError extends Error {
    readonly code: CryptoErrorCode;

    constructor(code: CryptoErrorCode, message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "CryptoError";
        this.code = code;
    }
}

export type Sealed = {
    /** Base64 envelope, sent to the server. */
    val: string;
    /** Base58 key, shared only through the link fragment. */
    key: string;
};

/** Decodes a base58 string into exactly `length` bytes, or returns `null`. */
export function decodeBase58(input: string, length: number): Uint8Array<ArrayBuffer> | null {
    let decoded: Uint8Array;
    try {
        decoded = bs58.decode(input.trim());
    } catch {
        return null;
    }

    return decoded.length === length ? new Uint8Array(decoded) : null;
}

export function parseKey(key: string): Uint8Array<ArrayBuffer> | null {
    return decodeBase58(key, KEY_BYTES);
}

export function isValidKey(key: string): boolean {
    return parseKey(key) !== null;
}

export async function encrypt(plaintext: Uint8Array<ArrayBuffer>): Promise<Sealed> {
    const cryptoKey = await crypto.subtle.generateKey({ name: ALGORITHM, length: KEY_BYTES * 8 }, true, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const header = new Uint8Array([VERSION]);

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv, additionalData: header, tagLength: TAG_BYTES * 8 },
        cryptoKey,
        plaintext,
    );
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", cryptoKey));

    const envelope = new Uint8Array(1 + IV_BYTES + ciphertext.byteLength);
    envelope.set(header, 0);
    envelope.set(iv, 1);
    envelope.set(new Uint8Array(ciphertext), 1 + IV_BYTES);

    return { val: toBase64(envelope), key: bs58.encode(rawKey) };
}

export async function decrypt(val: string, key: string): Promise<Uint8Array<ArrayBuffer>> {
    const rawKey = parseKey(key);
    if (!rawKey) {
        throw new CryptoError("key", "The decryption key is not valid.");
    }

    let envelope: Uint8Array<ArrayBuffer>;
    try {
        envelope = fromBase64(val);
    } catch (err) {
        throw new CryptoError("format", "The encrypted data is malformed.", { cause: err });
    }

    if (envelope.length < ENVELOPE_OVERHEAD || envelope[0] !== VERSION) {
        throw new CryptoError("format", "The encrypted data uses an unsupported format.");
    }

    const header = envelope.subarray(0, 1);
    const iv = envelope.subarray(1, 1 + IV_BYTES);
    const ciphertext = envelope.subarray(1 + IV_BYTES);

    const cryptoKey = await crypto.subtle.importKey("raw", rawKey, { name: ALGORITHM }, false, ["decrypt"]);
    try {
        const plaintext = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv, additionalData: header, tagLength: TAG_BYTES * 8 },
            cryptoKey,
            ciphertext,
        );
        return new Uint8Array(plaintext);
    } catch (err) {
        throw new CryptoError("decrypt", "Decryption failed. The key is wrong or the data was altered.", {
            cause: err,
        });
    }
}

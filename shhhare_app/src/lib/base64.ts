const CHUNK_SIZE = 0x8000;

const hasNative = typeof Uint8Array.fromBase64 === "function" && typeof Uint8Array.prototype.toBase64 === "function";

export function toBase64Fallback(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }

    return btoa(binary);
}

export function fromBase64Fallback(input: string): Uint8Array<ArrayBuffer> {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

export function toBase64(bytes: Uint8Array): string {
    return hasNative ? bytes.toBase64() : toBase64Fallback(bytes);
}

export function fromBase64(input: string): Uint8Array<ArrayBuffer> {
    return hasNative ? Uint8Array.fromBase64(input) : fromBase64Fallback(input);
}

/** Length of the standard (padded) base64 encoding of `n` bytes. */
export function base64Length(n: number): number {
    return 4 * Math.ceil(n / 3);
}

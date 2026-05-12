import { bytesToBase64Url, base64UrlToBytes } from "@/lib/base64";

export interface EncryptResult {
    v: string;
    k: string;
}

export async function encrypt(plaintext: string): Promise<EncryptResult> {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));

    const secret = new Uint8Array(rawKey.byteLength + iv.byteLength);
    secret.set(rawKey, 0);
    secret.set(iv, rawKey.byteLength);

    return {
        v: bytesToBase64Url(new Uint8Array(ciphertext)),
        k: bytesToBase64Url(secret),
    };
}

export async function decrypt(ciphertext: string, secret: string): Promise<string> {
    const secretBytes = base64UrlToBytes(secret);
    const rawKey = secretBytes.slice(0, 32);
    const iv = secretBytes.slice(32);
    const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, base64UrlToBytes(ciphertext).buffer as ArrayBuffer);
    return new TextDecoder().decode(plaintext);
}

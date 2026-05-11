export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const comma = result.indexOf(",");
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function base64UrlToBytes(input: string): Uint8Array {
    const b64 = input.replaceAll("-", "+").replaceAll("_", "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export interface EncryptResult {
    secret: string;
    ciphertext: string;
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
        ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
        secret: bytesToBase64Url(secret),
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

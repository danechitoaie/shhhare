import bs58 from "bs58";

export type EncryptResult = {
    val: string;
    key: string;
};

export async function encrypt(plaintext: string): Promise<EncryptResult> {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));

    const secret = new Uint8Array(rawKey.byteLength + iv.byteLength);
    secret.set(rawKey, 0);
    secret.set(iv, rawKey.byteLength);

    return {
        val: bs58.encode(new Uint8Array(ciphertext)),
        key: bs58.encode(secret),
    };
}

export async function decrypt(ciphertext: string, secret: string): Promise<string> {
    const secretBytes = bs58.decode(secret);
    const rawKey = secretBytes.slice(0, 32);
    const iv = secretBytes.slice(32);
    const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bs58.decode(ciphertext).buffer as ArrayBuffer);
    return new TextDecoder().decode(plaintext);
}

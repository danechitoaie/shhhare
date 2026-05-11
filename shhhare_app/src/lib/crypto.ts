export interface EncryptResult {
    key: CryptoKey;
    iv: Uint8Array<ArrayBuffer>;
    ciphertext: ArrayBuffer;
}

export async function encrypt(plaintext: string): Promise<EncryptResult> {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
    return { key, iv, ciphertext };
}

export async function decrypt(ciphertext: ArrayBuffer, iv: Uint8Array<ArrayBuffer>, key: CryptoKey): Promise<string> {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
}

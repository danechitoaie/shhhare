import bs58 from "bs58";
import { bytesToBase64 } from "@/lib/base64";

export type EncryptResult = {
    val: string;
    key: string;
};

async function encrypt(plaintext: string): Promise<EncryptResult> {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));

    const secret = new Uint8Array(rawKey.byteLength + iv.byteLength);
    secret.set(rawKey, 0);
    secret.set(iv, rawKey.byteLength);

    return {
        val: bytesToBase64(new Uint8Array(ciphertext)),
        key: bs58.encode(secret),
    };
}

self.onmessage = async (e: MessageEvent<string>) => {
    try {
        const result: EncryptResult = await encrypt(e.data);
        self.postMessage({ result });
    } catch (err) {
        self.postMessage({ error: String(err) });
    }
};

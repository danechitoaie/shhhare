import bs58 from "bs58";
import { base64ToBytes } from "@/lib/base64";

export type DecryptRequest = {
    ciphertext: string;
    secret: string;
};

async function decrypt(ciphertext: string, secret: string): Promise<string> {
    const secretBytes = bs58.decode(secret);
    const rawKey = secretBytes.slice(0, 32);
    const iv = secretBytes.slice(32);
    const data = base64ToBytes(ciphertext).buffer as ArrayBuffer;
    const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plaintext);
}

self.onmessage = async (e: MessageEvent<DecryptRequest>) => {
    try {
        const plaintext = await decrypt(e.data.ciphertext, e.data.secret);
        self.postMessage({ result: plaintext });
    } catch (err) {
        self.postMessage({ error: String(err) });
    }
};

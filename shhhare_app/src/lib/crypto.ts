import EncryptWorker from "@/workers/encrypt?worker";
import type { EncryptResult } from "@/workers/encrypt";
import DecryptWorker from "@/workers/decrypt?worker";
import type { DecryptRequest } from "@/workers/decrypt";

export function encryptInWorker(plaintext: string): Promise<EncryptResult> {
    return new Promise((resolve, reject) => {
        const worker = new EncryptWorker();

        worker.onmessage = (e: MessageEvent<{ result?: EncryptResult; error?: string }>) => {
            worker.terminate();
            if (e.data.error) {
                reject(new Error(e.data.error));
            } else {
                resolve(e.data.result!);
            }
        };

        worker.onerror = (e) => {
            worker.terminate();
            reject(e);
        };

        worker.postMessage(plaintext);
    });
}

export function decryptInWorker(ciphertext: string, secret: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const worker = new DecryptWorker();

        worker.onmessage = (e: MessageEvent<{ result?: string; error?: string }>) => {
            worker.terminate();
            if (e.data.error) {
                reject(new Error(e.data.error));
            } else {
                resolve(e.data.result!);
            }
        };

        worker.onerror = (e) => {
            worker.terminate();
            reject(e);
        };

        worker.postMessage({ ciphertext, secret } satisfies DecryptRequest);
    });
}

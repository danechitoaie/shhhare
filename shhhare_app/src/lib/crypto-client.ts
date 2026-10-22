import type { Sealed } from "@/lib/crypto";
import type { Revealed, WorkerErrorCode, WorkerRequest, WorkerResponse } from "@/workers/crypto.worker";

export type { Revealed, RevealedFile } from "@/workers/crypto.worker";

export class WorkerError extends Error {
    readonly code: WorkerErrorCode;

    constructor(code: WorkerErrorCode, message: string) {
        super(message);
        this.name = "WorkerError";
        this.code = code;
    }
}

/**
 * Runs one operation in a fresh worker and terminates it afterwards, so neither
 * plaintext nor key material outlives the operation in a background thread.
 */
function run(request: WorkerRequest): Promise<Sealed | Revealed> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("../workers/crypto.worker.ts", import.meta.url), {
            type: "module",
            name: "shhhare-crypto",
        });

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            worker.terminate();
            if (e.data.ok) {
                resolve(e.data.result);
            } else {
                reject(new WorkerError(e.data.code, e.data.message));
            }
        };

        worker.onerror = (e) => {
            e.preventDefault();
            worker.terminate();
            reject(new WorkerError("unknown", e.message || "The encryption worker failed to start."));
        };

        worker.onmessageerror = () => {
            worker.terminate();
            reject(new WorkerError("unknown", "The encryption worker sent an unreadable message."));
        };

        worker.postMessage(request);
    });
}

export async function encryptSecret(text: string, files: File[], maxSize?: number): Promise<Sealed> {
    return (await run({ op: "encrypt", text, files, maxSize })) as Sealed;
}

export async function decryptSecret(val: string, key: string): Promise<Revealed> {
    return (await run({ op: "decrypt", val, key })) as Revealed;
}

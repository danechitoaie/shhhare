import { decodeBase58 } from "@/lib/crypto";

export type Ttl = "H" | "D" | "W";

export type SecretStatus = { ttl: number; bar: boolean };
export type SecretValue = { val: string; ttl: number };

const TIMEOUT_MS = 30_000;
const SECRET_ID_BYTES = 32;

export class ApiError extends Error {
    /** HTTP status, or 0 when the server could not be reached. */
    readonly status: number;
    /** Extra detail sent by the server, if any. */
    readonly details?: string;

    constructor(status: number, message: string, details?: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

/** Storage keys are 32 random bytes, base58-encoded by the server. */
export function isValidSecretId(id: string): boolean {
    return decodeBase58(id, SECRET_ID_BYTES) !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function statusMessage(status: number): string {
    switch (status) {
        case 400:
            return "The server rejected the secret.";
        case 404:
            return "Secret not found.";
        case 409:
            return "The server could not store the secret. Please try again.";
        case 413:
            return "The secret is too large.";
        case 429:
            return "Too many requests. Please wait a moment and try again.";
        default:
            return status >= 500 ? "The server ran into a problem. Please try again." : `Request failed (${status}).`;
    }
}

type RequestOptions = { method: "GET" | "POST"; body?: unknown; signal?: AbortSignal };

async function request(path: string, { method, body, signal }: RequestOptions): Promise<unknown> {
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    let res: Response;
    try {
        res = await fetch(path, {
            method,
            headers: body === undefined ? undefined : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: "no-store",
            credentials: "same-origin",
            referrerPolicy: "no-referrer",
            signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        });
    } catch (err) {
        if (signal?.aborted) {
            throw err;
        }

        const message = timeout.aborted
            ? "The server took too long to respond."
            : "Could not reach the server. Check your connection.";
        throw new ApiError(0, message, undefined, { cause: err });
    }

    let data: unknown = null;
    try {
        data = await res.json();
    } catch {
        // Handled below: an error status keeps its generic message, a 2xx is invalid.
    }

    if (!res.ok) {
        const details = isRecord(data) && typeof data.details === "string" ? data.details : undefined;
        throw new ApiError(res.status, statusMessage(res.status), details);
    }

    return data;
}

function invalidResponse(): ApiError {
    return new ApiError(200, "The server sent an unexpected response.");
}

export async function createSecret(input: { val: string; ttl: Ttl; bar: boolean }, signal?: AbortSignal) {
    const data = await request("/api/secret", { method: "POST", body: input, signal });
    if (!isRecord(data) || typeof data.key !== "string" || !isValidSecretId(data.key)) {
        throw invalidResponse();
    }

    return data.key;
}

export async function getSecretStatus(id: string, signal?: AbortSignal): Promise<SecretStatus> {
    const data = await request(`/api/secret/${encodeURIComponent(id)}`, { method: "GET", signal });
    if (!isRecord(data) || typeof data.ttl !== "number" || typeof data.bar !== "boolean") {
        throw invalidResponse();
    }

    return { ttl: data.ttl, bar: data.bar };
}

/** Fetches the ciphertext. For burn-after-read secrets this deletes it on the server. */
export async function readSecret(id: string, signal?: AbortSignal): Promise<SecretValue> {
    const data = await request(`/api/secret/${encodeURIComponent(id)}`, { method: "POST", signal });
    if (!isRecord(data) || typeof data.val !== "string" || typeof data.ttl !== "number") {
        throw invalidResponse();
    }

    return { val: data.val, ttl: data.ttl };
}

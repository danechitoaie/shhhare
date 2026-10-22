export type AppData = {
    /** HTTP status the server rendered this page with. */
    c: number;
    /** Reason phrase for `c`. */
    r: string;
    /** App version. */
    v: string;
    /** Git revision. */
    h: string;
    /** MAX_SIZE in bytes. Missing on server-rendered error pages. */
    b?: number;
};

/** Server default for MAX_SIZE (256KB), used if the page doesn't provide one. */
const DEFAULT_MAX_SIZE = 256_000;

function readAppData(): AppData {
    const el = document.getElementById("__DATA__");
    if (!(el instanceof HTMLScriptElement) || el.type !== "application/json") {
        throw new Error("Missing #__DATA__ script tag!");
    }

    let raw: unknown;
    try {
        raw = JSON.parse(el.textContent ?? "");
    } catch (err) {
        throw new Error("Failed to parse #__DATA__ script tag!", { cause: err });
    }

    const data = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    return {
        c: typeof data.c === "number" ? data.c : 200,
        r: typeof data.r === "string" ? data.r : "OK",
        v: typeof data.v === "string" ? data.v : "",
        h: typeof data.h === "string" ? data.h : "",
        b: typeof data.b === "number" && data.b > 0 ? data.b : undefined,
    };
}

export const APP_DATA = readAppData();

export const MAX_SIZE = APP_DATA.b ?? DEFAULT_MAX_SIZE;

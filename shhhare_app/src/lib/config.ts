export interface AppData {
    b: number;
}

function readAppData(): AppData {
    const el = document.getElementById("__DATA__");
    if (!(el instanceof HTMLScriptElement) || el.type !== "application/json") {
        throw new Error("Missing #__DATA__ script tag!");
    }

    try {
        return JSON.parse(el.textContent ?? "") as AppData;
    } catch (err) {
        throw new Error("Failed to parse #__DATA__ script tag!", { cause: err });
    }
}

export const APP_DATA = readAppData();

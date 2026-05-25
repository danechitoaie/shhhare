import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function fmtBytes(n: number): string {
    if (n < 1000) {
        return `${n} B`;
    }

    const units = ["KB", "MB", "GB", "TB"];
    let v = n / 1000;
    let i = 0;
    while (v >= 1000 && i < units.length - 1) {
        v /= 1000;
        i++;
    }

    return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

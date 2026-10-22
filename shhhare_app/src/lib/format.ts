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

export function fmtRemaining(ms: number): string {
    const totalMinutes = Math.floor(ms / 60_000);
    if (totalMinutes < 1) {
        return "less than a minute";
    }

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) {
        parts.push(`${days}d`);
    }

    if (hours > 0 || days > 0) {
        parts.push(`${hours}h`);
    }

    parts.push(`${minutes}m`);
    return parts.join(" ");
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function fmtDateTime(ms: number): string {
    return dateTimeFormat.format(ms);
}

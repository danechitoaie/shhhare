import { useEffect, useState } from "react";

/** Current time in ms, refreshed every `intervalMs`. */
export function useNow(intervalMs = 1000): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const handle = window.setInterval(() => setNow(Date.now()), intervalMs);
        return () => window.clearInterval(handle);
    }, [intervalMs]);

    return now;
}

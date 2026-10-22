import { useEffect, useRef, useState } from "react";

/** Copies text to the clipboard and exposes a short-lived `copied` flag. */
export function useClipboard(resetMs = 2000) {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    async function copy(text: string): Promise<boolean> {
        window.clearTimeout(timer.current);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            setCopied(false);
            setFailed(true);
            return false;
        }

        setFailed(false);
        setCopied(true);
        timer.current = window.setTimeout(() => setCopied(false), resetMs);
        return true;
    }

    return { copied, failed, copy };
}

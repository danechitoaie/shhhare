import { useEffect, useState } from "react";
import { ClockIcon, FlameIcon, KeyIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { decryptInWorker } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { RevealedPanel } from "./revealed";

function formatRemaining(ms: number): string {
    const totalMinutes = Math.floor(ms / 60_000);
    if (totalMinutes < 1) {
        return "less than a minute!";
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

type ReadyPanelProps = {
    bar: boolean;
    exp: number;
    secretKey: string;
    decryptionKey: string | null;
    onExpired: () => void;
};

type GetSecretResponse = { val: string; ttl: number };
type RevealedFile = { n: string; t: string; c: string };
type RevealedPayload = { t: string; f: RevealedFile[] };

type Reveal =
    | { kind: "idle" }
    | { kind: "revealing" }
    | { kind: "revealed"; payload: RevealedPayload }
    | { kind: "failed"; message: string };

export function ReadyPanel({ bar, exp, secretKey, decryptionKey, onExpired }: ReadyPanelProps) {
    const [now, setNow] = useState<number>(() => Date.now());
    const [manualKey, setManualKey] = useState<string>("");
    const [reveal, setReveal] = useState<Reveal>({ kind: "idle" });

    useEffect(() => {
        const handle = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(handle);
    }, []);

    const remainingMs = exp - now;
    useEffect(() => {
        if (reveal.kind === "revealed") {
            return;
        }

        if (remainingMs <= 0) {
            onExpired();
        }
    }, [remainingMs, onExpired, reveal.kind]);

    const trimmedManualKey = manualKey.trim();
    const effectiveKey = decryptionKey ?? (trimmedManualKey === "" ? null : trimmedManualKey);

    if (reveal.kind === "revealed") {
        return <RevealedPanel payload={reveal.payload} bar={bar} />;
    }

    const revealing = reveal.kind === "revealing";

    const onReveal = async () => {
        if (!effectiveKey || revealing) {
            return;
        }

        setReveal({ kind: "revealing" });

        let res: Response;
        try {
            res = await fetch(`/api/secret/${encodeURIComponent(secretKey)}`, {
                method: "POST",
            });
        } catch (err) {
            console.error(err);
            setReveal({ kind: "failed", message: "Could not reach the server!" });
            return;
        }

        if (res.status === 404) {
            onExpired();
            return;
        }

        if (!res.ok) {
            setReveal({ kind: "failed", message: "Failed to reveal the secret!" });
            return;
        }

        let data: GetSecretResponse;
        try {
            data = (await res.json()) as GetSecretResponse;
        } catch (err) {
            console.error(err);
            setReveal({ kind: "failed", message: "Failed to parse the server response!" });
            return;
        }

        let plaintext: string;
        try {
            plaintext = await decryptInWorker(data.val, effectiveKey);
        } catch (err) {
            console.error(err);
            setReveal({
                kind: "failed",
                message: "Decryption failed. The key may be incorrect.",
            });
            return;
        }

        let payload: RevealedPayload;
        try {
            payload = JSON.parse(plaintext) as RevealedPayload;
        } catch (err) {
            console.error(err);
            setReveal({ kind: "failed", message: "Failed to parse the decrypted payload!" });
            return;
        }

        setReveal({ kind: "revealed", payload });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h1 className="text-lg font-semibold">An encrypted secret is waiting for you</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    The contents are end-to-end encrypted. Only your link can decrypt it.
                </p>
            </div>

            {bar && (
                <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <FlameIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <div className="font-semibold text-destructive">Burn after reading</div>
                        <div className="text-muted-foreground">
                            This secret will be permanently destroyed the moment it is revealed. You can only view it
                            once.
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-center gap-2 rounded-md border bg-muted/30 px-4 py-3">
                <ClockIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-sm text-muted-foreground text-center">
                    {remainingMs <= 0 ? (
                        <span className="font-semibold">Expired!</span>
                    ) : (
                        <>
                            Expires in <span className="font-semibold">{formatRemaining(remainingMs)}</span>
                        </>
                    )}
                </div>
            </div>

            {!decryptionKey && (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="decryption-key">Decryption key</Label>
                    <input
                        id="decryption-key"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        placeholder="Paste the decryption key"
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-sm transition-colors outline-none placeholder:text-muted-foreground placeholder:font-sans",
                            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                            "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                            "dark:bg-input/30 dark:disabled:bg-input/80",
                        )}
                    />
                    <p className="text-xs text-muted-foreground">
                        The decryption key is normally included in the link after <span className="font-mono">#</span>.
                        If you received it separately, paste it here.
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center gap-2">
                <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 cursor-pointer"
                    disabled={!effectiveKey || revealing}
                    onClick={onReveal}
                >
                    {revealing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <KeyIcon className="h-4 w-4" />}
                    {revealing ? "Revealing…" : "Reveal secret"}
                </Button>
                {reveal.kind === "failed" && (
                    <p className="text-xs text-destructive text-center max-w-sm">{reveal.message}</p>
                )}
            </div>
        </div>
    );
}

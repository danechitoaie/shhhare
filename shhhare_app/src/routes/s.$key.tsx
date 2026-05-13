import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangleIcon, ClockIcon, FlameIcon, KeyIcon, Loader2Icon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/s/$key")({
    component: Secret,
});

type GetStatusResponse = { ttl: number; bar: boolean };
type Status =
    | { kind: "loading" }
    | { kind: "not_found" }
    | { kind: "error"; message: string }
    | { kind: "ready"; bar: boolean; exp: number };

function getDecryptionKeyFromHash(hash: string): string | null {
    const h = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(h);
    return params.get("k");
}

function Secret() {
    const [status, setStatus] = useState<Status>({ kind: "loading" });
    const { key } = Route.useParams();
    const [decryptionKey, setDecryptionKey] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return getDecryptionKeyFromHash(window.location.hash);
        }

        return null;
    });

    useEffect(() => {
        const onHashChange = () => setDecryptionKey(getDecryptionKeyFromHash(window.location.hash));
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    useEffect(() => {
        let cancelled = false;
        setStatus({
            kind: "loading",
        });

        (async () => {
            try {
                const url = `/api/secret/${encodeURIComponent(key)}`;
                const res = await fetch(url, {
                    method: "GET",
                });

                if (cancelled) {
                    return;
                }

                if (res.status === 404) {
                    setStatus({
                        kind: "not_found",
                    });
                    return;
                }

                if (!res.ok) {
                    setStatus({ kind: "error", message: `Server returned status ${res.status}.` });
                    return;
                }

                const data = (await res.json()) as GetStatusResponse;
                if (cancelled) {
                    return;
                }

                setStatus({
                    kind: "ready",
                    bar: data.bar,
                    exp: Date.now() + Math.max(0, data.ttl) * 1000,
                });
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setStatus({
                        kind: "error",
                        message: "Could not reach the server. Please check your connection and try again.",
                    });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [key]);

    return (
        <div className="px-4">
            <div className="my-10 px-8 sm:px-12 py-8 max-w-lg lg:max-w-2xl mx-auto bg-background rounded-lg shadow-md border">
                {status.kind === "loading" && <LoadingPanel />}
                {status.kind === "not_found" && <NotFoundPanel />}
                {status.kind === "error" && <ErrorPanel message={status.message} />}
                {status.kind === "ready" && (
                    <ReadyPanel
                        bar={status.bar}
                        exp={status.exp}
                        decryptionKey={decryptionKey}
                        onExpired={() => setStatus({ kind: "not_found" })}
                    />
                )}
            </div>
        </div>
    );
}

function LoadingPanel() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2Icon className="h-6 w-6 animate-spin" />
            <p className="text-sm">Looking up secret…</p>
        </div>
    );
}

function NotFoundPanel() {
    return (
        <div className="flex flex-col items-center text-center py-6">
            <div className="rounded-full bg-muted p-3 mb-4">
                <SearchXIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="text-lg font-semibold mb-2">Secret not found</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
                This secret no longer exists. It may have expired, already been read (burn-after-reading), or the link
                might be incorrect.
            </p>
        </div>
    );
}

function ErrorPanel({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center text-center py-6">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
                <AlertTriangleIcon className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        </div>
    );
}

type ReadyPanelProps = {
    bar: boolean;
    exp: number;
    decryptionKey: string | null;
    onExpired: () => void;
};

function ReadyPanel({ bar, exp, decryptionKey, onExpired }: ReadyPanelProps) {
    const [now, setNow] = useState<number>(() => Date.now());
    const [manualKey, setManualKey] = useState<string>("");

    useEffect(() => {
        const handle = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(handle);
    }, []);

    const remainingMs = exp - now;
    useEffect(() => {
        if (remainingMs <= 0) {
            onExpired();
        }
    }, [remainingMs, onExpired]);

    const trimmedManualKey = manualKey.trim();
    const effectiveKey = decryptionKey ?? (trimmedManualKey === "" ? null : trimmedManualKey);

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

            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-3">
                <ClockIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-sm">
                    <div className="text-muted-foreground">
                        {remainingMs <= 0 ? (
                            <span className="font-semibold">Expired!</span>
                        ) : (
                            <>
                                Expires in <span className="font-semibold">{formatRemaining(remainingMs)}</span>
                            </>
                        )}
                    </div>
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
                    disabled={!effectiveKey}
                    onClick={() => {
                        // TODO: Wire up destructive read: POST /api/secret/:key, then
                        // decrypt(val, effectiveKey) from @/lib/crypto and render the
                        // { t, f } payload (text + files).
                    }}
                >
                    <KeyIcon className="h-4 w-4" />
                    Reveal secret
                </Button>
            </div>
        </div>
    );
}

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

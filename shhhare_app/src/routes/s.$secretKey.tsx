import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoadingPanel } from "@/components/secret/loading";
import { NotFoundPanel } from "@/components/secret/not-found";
import { ErrorPanel } from "@/components/secret/error";
import { ReadyPanel } from "@/components/secret/ready";

export const Route = createFileRoute("/s/$secretKey")({
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
    const { secretKey } = Route.useParams();
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
                const url = `/api/secret/${encodeURIComponent(secretKey)}`;
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
                    setStatus({
                        kind: "error",
                        message: "Failed to fetch secret status!",
                    });
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
                        message: "Could not reach the server!",
                    });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [secretKey]);

    return (
        <div className="px-4">
            <div className="my-10 px-12 py-8 max-w-lg lg:max-w-4xl mx-auto bg-background rounded-lg shadow-md border">
                {status.kind === "loading" && <LoadingPanel />}
                {status.kind === "not_found" && <NotFoundPanel />}
                {status.kind === "error" && <ErrorPanel message={status.message} />}
                {status.kind === "ready" && (
                    <ReadyPanel
                        bar={status.bar}
                        exp={status.exp}
                        secretKey={secretKey}
                        decryptionKey={decryptionKey}
                        onExpired={() => setStatus({ kind: "not_found" })}
                    />
                )}
            </div>
        </div>
    );
}

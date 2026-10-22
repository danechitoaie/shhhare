import { useState } from "react";
import { createFileRoute, notFound, useLocation } from "@tanstack/react-router";
import { RevealPanel } from "@/components/secret/reveal";
import { RevealedPanel } from "@/components/secret/revealed";
import { BurnedPanel, ErrorPanel, LoadingPanel, NotFoundPanel } from "@/components/secret/status";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { ApiError, getSecretStatus, isValidSecretId } from "@/lib/api";
import type { Revealed } from "@/lib/crypto-client";

export const Route = createFileRoute("/s/$secretKey")({
    loader: async ({ params, abortController }) => {
        if (!isValidSecretId(params.secretKey)) {
            throw notFound();
        }

        try {
            const status = await getSecretStatus(params.secretKey, abortController.signal);
            return {
                bar: status.bar,
                expiresAt: status.ttl > 0 ? Date.now() + status.ttl * 1000 : null,
            };
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                throw notFound();
            }

            throw err;
        }
    },
    // Always ask the server: the secret may have been read or expired since.
    staleTime: 0,
    gcTime: 0,
    pendingComponent: LoadingPanel,
    errorComponent: ErrorPanel,
    notFoundComponent: NotFoundPanel,
    component: Secret,
});

/** Reads the key from `#<key>`, also accepting the older `#k=<key>` form. */
function keyFromHash(hash: string): string {
    const raw = hash.replace(/^#/, "");
    return raw.includes("=") ? (new URLSearchParams(raw).get("k") ?? "") : raw;
}

type View = { kind: "ready" } | { kind: "revealed"; revealed: Revealed } | { kind: "gone" } | { kind: "burned" };

function Secret() {
    const { bar, expiresAt } = Route.useLoaderData();
    const { secretKey } = Route.useParams();
    const linkKey = keyFromHash(useLocation({ select: (location) => location.hash }));
    const now = useNow();
    const [view, setView] = useState<View>({ kind: "ready" });

    if (view.kind === "burned") {
        return <BurnedPanel />;
    }

    if (view.kind === "revealed") {
        return (
            <Card>
                <RevealedPanel revealed={view.revealed} bar={bar} expiresAt={expiresAt} now={now} />
            </Card>
        );
    }

    if (view.kind === "gone" || (expiresAt !== null && now >= expiresAt)) {
        return <NotFoundPanel />;
    }

    return (
        <Card>
            <RevealPanel
                secretKey={secretKey}
                linkKey={linkKey}
                bar={bar}
                expiresAt={expiresAt}
                now={now}
                onRevealed={(revealed) => setView({ kind: "revealed", revealed })}
                onGone={() => setView({ kind: "gone" })}
                onBurned={() => setView({ kind: "burned" })}
            />
        </Card>
    );
}

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/s/$key")({
    component: Secret,
});

function getDecryptionKeyFromHash(hash: string): string | null {
    const h = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(h);
    return params.get("k");
}

function Secret() {
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

    return (
        <div className="p-2">
            {decryptionKey ? (
                <>
                    Key: <span className="font-bold">{decryptionKey}</span>
                </>
            ) : (
                "No key in URL"
            )}
        </div>
    );
}

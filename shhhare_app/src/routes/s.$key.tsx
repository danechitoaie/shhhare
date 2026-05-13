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
        <div className="px-4">
            <div className="my-10 px-12 py-8 max-w-lg lg:max-w-4xl mx-auto bg-background rounded-lg shadow-md border">
                {decryptionKey ? (
                    <>
                        Key: <span className="font-bold">{decryptionKey}</span>
                    </>
                ) : (
                    "No key in URL"
                )}
            </div>
        </div>
    );
}

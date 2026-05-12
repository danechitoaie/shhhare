import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Encrypt } from "@/components/encrypt";
import { Shhhare } from "@/components/shhhare";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const [storedSecret, setStoredSecret] = useState<{ secretKey: string; decryptionKey: string } | null>(null);

    return (
        <div className="px-4">
            <div className="my-10 px-12 py-8 max-w-lg lg:max-w-4xl mx-auto bg-background rounded-lg shadow-md border">
                {storedSecret ? <Shhhare storedSecret={storedSecret} onSetStoredSecret={setStoredSecret} /> : <Encrypt onSetStoredSecret={setStoredSecret} />}
            </div>
        </div>
    );
}

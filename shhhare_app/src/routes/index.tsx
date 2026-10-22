import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ComposePanel, type Created } from "@/components/index/compose";
import { SharePanel } from "@/components/index/share";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const [created, setCreated] = useState<Created | null>(null);

    return (
        <Card>
            {created ? (
                <SharePanel created={created} onReset={() => setCreated(null)} />
            ) : (
                <ComposePanel onCreated={setCreated} />
            )}
        </Card>
    );
}

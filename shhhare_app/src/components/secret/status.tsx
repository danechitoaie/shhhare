import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { FlameIcon, Loader2Icon, RefreshCwIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react";
import { StatusPanel } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

export function LoadingPanel() {
    return (
        <Card>
            <CardBody>
                <div role="status" className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
                    <Loader2Icon className="size-6 animate-spin" aria-hidden="true" />
                    <p className="text-sm">Looking up secret…</p>
                </div>
            </CardBody>
        </Card>
    );
}

export function NotFoundPanel() {
    return (
        <Card>
            <CardBody>
                <StatusPanel icon={SearchXIcon} title="Secret not found">
                    This secret no longer exists. It may have expired, already been read (burn after reading), or the
                    link might be incorrect.
                </StatusPanel>
            </CardBody>
        </Card>
    );
}

export function BurnedPanel() {
    return (
        <Card>
            <CardBody>
                <StatusPanel icon={FlameIcon} tone="destructive" title="The secret was destroyed but couldn't be decrypted">
                    This was a burn-after-reading secret, so the server deleted it when it was fetched. The key didn&rsquo;t
                    match it, so its contents are lost. Ask the sender to share it again.
                </StatusPanel>
            </CardBody>
        </Card>
    );
}

export function ErrorPanel({ error }: ErrorComponentProps) {
    const router = useRouter();
    const message = error instanceof ApiError ? error.message : "Something went wrong while loading this secret.";

    return (
        <Card>
            <CardBody>
                <StatusPanel
                    icon={TriangleAlertIcon}
                    tone="destructive"
                    title="Something went wrong"
                    action={
                        <Button variant="outline" onClick={() => router.invalidate()}>
                            <RefreshCwIcon />
                            Try again
                        </Button>
                    }
                >
                    {message}
                </StatusPanel>
            </CardBody>
        </Card>
    );
}

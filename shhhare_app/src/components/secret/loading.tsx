import { Loader2Icon } from "lucide-react";

export function LoadingPanel() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2Icon className="h-6 w-6 animate-spin" />
            <p className="text-sm">Looking up secret…</p>
        </div>
    );
}

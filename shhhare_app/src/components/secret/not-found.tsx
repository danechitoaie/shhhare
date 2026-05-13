import { SearchXIcon } from "lucide-react";

export function NotFoundPanel() {
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

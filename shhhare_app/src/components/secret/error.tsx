import { AlertTriangleIcon } from "lucide-react";

export function ErrorPanel({ message }: { message: string }) {
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

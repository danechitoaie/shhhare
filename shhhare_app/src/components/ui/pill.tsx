import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Pill({ className, ...props }: ComponentProps<"span">) {
    return (
        <span
            data-slot="pill"
            aria-hidden="true"
            className={cn(
                "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center rounded-sm bg-muted px-1 font-mono text-xs font-medium text-muted-foreground select-none",
                className,
            )}
            {...props}
        />
    );
}

export { Pill };

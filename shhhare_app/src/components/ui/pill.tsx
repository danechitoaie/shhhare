import { cn } from "@/lib/utils";

function Pill({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="num"
            className={cn(
                "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-mono text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
                className,
            )}
            {...props}
        />
    );
}

export { Pill };

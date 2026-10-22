import { fmtBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PayloadMeter({ size, max }: { size: number; max: number }) {
    const over = size > max;
    const percentage = Math.min(100, (size / max) * 100);

    return (
        <div>
            <div className="flex items-center justify-between gap-3 text-[13px]">
                <span id="payload-label" className="text-muted-foreground">
                    Payload
                    <span className="ml-2 hidden text-[11px] text-muted-foreground/80 sm:inline">
                        (size of the data after encryption)
                    </span>
                </span>
                <span className={cn("font-mono", over ? "text-destructive" : "text-foreground")}>
                    {fmtBytes(size)} <span className="text-muted-foreground">/ {fmtBytes(max)}</span>
                </span>
            </div>
            <div
                role="meter"
                aria-labelledby="payload-label"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={Math.min(size, max)}
                aria-valuetext={`${fmtBytes(size)} of ${fmtBytes(max)}${over ? ", over the limit" : ""}`}
                className={cn("mt-2 h-1.5 w-full overflow-hidden rounded-full", over ? "bg-destructive/20" : "bg-muted")}
            >
                <div
                    className={cn(
                        "h-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
                        over ? "bg-destructive" : "bg-foreground",
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {over && (
                <p className="mt-1.5 text-[12px] text-destructive">
                    <span className="font-mono">over by {fmtBytes(size - max)}</span>. Remove some text or attachments.
                </p>
            )}
        </div>
    );
}

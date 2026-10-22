import { useEffect, useId, useRef, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    /** Extra actions rendered after the Close button. */
    actions?: ReactNode;
    closeLabel?: string;
    className?: string;
};

/**
 * Modal built on the native <dialog> element: the browser handles focus trapping,
 * Esc, inertness of the page and focus restore, without injecting any styles.
 */
export function Dialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    actions,
    closeLabel = "Close",
    className,
}: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onClose={() => onOpenChange(false)}
            onClick={(e) => {
                // A click on the <dialog> element itself (not its content) is a click on the backdrop.
                if (e.target === e.currentTarget) {
                    e.currentTarget.close();
                }
            }}
            className={cn(
                "dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-popover p-0 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10",
                className,
            )}
        >
            <div className="grid gap-4 p-4">
                <div className="flex flex-col gap-2 pr-8">
                    <h2 id={titleId} className="text-base leading-none font-medium">
                        {title}
                    </h2>
                    {description && (
                        <p id={descriptionId} className="text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {children}
            </div>
            <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => ref.current?.close()}>
                    {closeLabel}
                </Button>
                {actions}
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2"
                aria-label="Close"
                tabIndex={-1}
                onClick={() => ref.current?.close()}
            >
                <XIcon />
            </Button>
        </dialog>
    );
}

import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const calloutVariants = cva("flex items-start gap-3 rounded-md border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-muted/30 [&>svg]:text-muted-foreground",
            destructive: "border-destructive/30 bg-destructive/5 [&>svg]:text-destructive",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

type CalloutProps = Omit<ComponentProps<"div">, "title"> &
    VariantProps<typeof calloutVariants> & {
        icon: ReactNode;
        title?: ReactNode;
    };

function Callout({ className, variant = "default", icon, title, children, ...props }: CalloutProps) {
    return (
        <div data-slot="callout" className={cn(calloutVariants({ variant, className }))} {...props}>
            {icon}
            <div className="min-w-0 flex-1">
                {title && (
                    <div className={cn("font-semibold", variant === "destructive" && "text-destructive")}>{title}</div>
                )}
                <div className="text-muted-foreground">{children}</div>
            </div>
        </div>
    );
}

export { Callout };

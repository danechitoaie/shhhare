import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 motion-reduce:transition-none dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/80",
                outline:
                    "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
                destructive:
                    "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 gap-1.5 px-2.5",
                xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
                sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
                lg: "h-10 gap-1.5 px-6",
                icon: "size-9",
                "icon-sm": "size-8 rounded-[min(var(--radius-md),10px)]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

function Button({ className, variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };

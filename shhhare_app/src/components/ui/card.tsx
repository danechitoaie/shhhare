import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn("mx-auto mb-10 max-w-lg rounded-lg border bg-background shadow-md lg:max-w-4xl", className)}
            {...props}
        />
    );
}

function CardBody({ className, ...props }: ComponentProps<"div">) {
    return <div data-slot="card-body" className={cn("px-5 py-6 sm:px-12 sm:py-8", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                "flex flex-col-reverse items-stretch justify-between gap-3 rounded-b-lg border-t bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] px-5 py-4 text-[13px] sm:flex-row sm:items-center sm:px-12",
                className,
            )}
            {...props}
        />
    );
}

export { Card, CardBody, CardFooter };

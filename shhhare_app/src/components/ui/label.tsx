import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const labelClassName = "flex items-center gap-2 text-sm leading-none font-medium select-none [&_svg]:size-3.5";

function Label({ className, ...props }: ComponentProps<"label">) {
    return <label data-slot="label" className={cn(labelClassName, className)} {...props} />;
}

export { Label, labelClassName };

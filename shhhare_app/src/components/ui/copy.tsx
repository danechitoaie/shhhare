import { useState } from "react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { CheckIcon, CopyIcon } from "lucide-react";

type CopyProps = {
    label: string;
    value: string;
    display: ReactNode;
    icon: ReactNode;
    hint: string;
};

export function Copy({ label, value, display, icon, hint }: CopyProps) {
    const [copied, setCopied] = useState(false);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="mt-4">
            <Label>
                {icon}
                {label}
            </Label>
            <div className="mt-2 flex items-stretch gap-2">
                <div className="flex-1 min-w-0 px-3 py-2 rounded-md border bg-muted/30 font-mono text-[13px] truncate" title={value}>
                    {display}
                </div>
                <button
                    type="button"
                    onClick={onCopy}
                    aria-label={`Copy ${label}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 rounded-md border bg-background text-[13px] text-foreground hover:bg-muted cursor-pointer shrink-0"
                >
                    {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                </button>
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>
        </div>
    );
}

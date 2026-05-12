import { useState } from "react";
import type { ReactNode } from "react";
import { QRCode } from "react-qr-code";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CheckIcon, CopyIcon, QrCodeIcon } from "lucide-react";

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
                <div
                    className="flex-1 min-w-0 px-3 py-2 rounded-md border bg-muted/30 font-mono text-[13px] truncate"
                    title={value}
                >
                    {display}
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            aria-label={`Show QR for ${label}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 rounded-md border bg-background text-[13px] text-foreground hover:bg-muted cursor-pointer shrink-0"
                        >
                            <QrCodeIcon className="w-3.5 h-3.5" />
                            <span>Show QR</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{label}</DialogTitle>
                            <DialogDescription>Scan this QR code to copy the value.</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center rounded-md bg-white p-4">
                            <QRCode value={value} size={256} className="h-auto w-full max-w-[256px]" />
                        </div>
                        <p className="px-3 py-2 rounded-md border bg-muted/30 break-all text-center font-mono text-[12px] text-muted-foreground">
                            {value}
                        </p>
                        <DialogFooter showCloseButton />
                    </DialogContent>
                </Dialog>
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

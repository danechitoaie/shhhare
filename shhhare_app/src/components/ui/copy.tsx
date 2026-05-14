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
    copy: string;
    qr: string;
    display: ReactNode;
    icon: ReactNode;
    hint: string;
};

export function Copy({ label, copy, qr, display, icon, hint }: CopyProps) {
    const [copied, setCopied] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(copy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error(err);
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to copy to clipboard.",
            );
            setErrorOpen(true);
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
                    title={copy}
                >
                    {display}
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            title={`Show QR for ${label}`}
                            aria-label={`Show QR for ${label}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 rounded-md border bg-background text-[13px] text-foreground hover:bg-muted cursor-pointer shrink-0"
                        >
                            <QrCodeIcon className="w-3.5 h-3.5" />
                            <span>QR</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="top-14 translate-y-0">
                        <DialogHeader>
                            <DialogTitle>{label}</DialogTitle>
                            <DialogDescription>Scan this QR code to copy the value.</DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center rounded-md bg-white p-4">
                            <QRCode value={qr} size={256} className="h-auto w-full max-w-[256px]" />
                        </div>
                        <p className="px-3 py-2 rounded-md border bg-muted/30 break-all text-center font-mono text-[12px] text-muted-foreground">
                            {display}
                        </p>
                        <DialogFooter showCloseButton className="sm:justify-center [&_button]:cursor-pointer" />
                    </DialogContent>
                </Dialog>
                <button
                    type="button"
                    title={`Copy ${label}`}
                    onClick={onCopy}
                    aria-label={`Copy ${label}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 rounded-md border bg-background text-[13px] text-foreground hover:bg-muted cursor-pointer shrink-0"
                >
                    {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                </button>
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>
            <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
                <DialogContent className="top-14 translate-y-0">
                    <DialogHeader>
                        <DialogTitle>Copy failed</DialogTitle>
                        <DialogDescription>
                            Unable to copy {label.toLowerCase()} to the clipboard.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="px-3 py-2 rounded-md border bg-muted/30 break-all font-mono text-[12px] text-muted-foreground">
                        {errorMessage}
                    </p>
                    <DialogFooter showCloseButton className="sm:justify-center [&_button]:cursor-pointer" />
                </DialogContent>
            </Dialog>
        </div>
    );
}

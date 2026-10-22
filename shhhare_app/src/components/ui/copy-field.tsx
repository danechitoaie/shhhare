import { Suspense, lazy, useId, useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon, QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { labelClassName } from "@/components/ui/label";
import { useClipboard } from "@/hooks/use-clipboard";

// Only senders ever need QR codes, so keep the encoder out of the main bundle.
const QRCode = lazy(() => import("react-qr-code").then((m) => ({ default: m.QRCode })));

type CopyFieldProps = {
    label: string;
    icon: ReactNode;
    /** Exact value that gets copied to the clipboard. */
    value: string;
    /** Value encoded in the QR code. */
    qr: string;
    /** Styled rendering of `value`. */
    display: ReactNode;
    hint: string;
    /** Called once the value was copied or its QR code shown. */
    onShared?: () => void;
};

export function CopyField({ label, icon, value, qr, display, hint, onShared }: CopyFieldProps) {
    const id = useId();
    const { copied, failed, copy } = useClipboard();
    const [qrOpen, setQrOpen] = useState(false);
    const [qrRequested, setQrRequested] = useState(false);

    async function onCopy() {
        if (await copy(value)) {
            onShared?.();
        }
    }

    function onShowQr() {
        setQrRequested(true);
        setQrOpen(true);
        onShared?.();
    }

    return (
        <div>
            <span id={`${id}-label`} className={labelClassName}>
                {icon}
                {label}
            </span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div
                    role="textbox"
                    aria-readonly="true"
                    aria-labelledby={`${id}-label`}
                    tabIndex={0}
                    title={value}
                    className="min-w-0 flex-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-[13px] break-all outline-none select-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:truncate sm:break-normal"
                >
                    {display}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-auto min-h-9 flex-1 px-3 sm:flex-none" onClick={onShowQr}>
                        <QrCodeIcon className="size-3.5" />
                        <span>QR</span>
                        <span className="sr-only">{` code for ${label.toLowerCase()}`}</span>
                    </Button>
                    <Button variant="outline" className="h-auto min-h-9 flex-1 px-3 sm:flex-none" onClick={onCopy}>
                        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                        <span className="sm:w-12 sm:text-left">{copied ? "Copied" : "Copy"}</span>
                        <span className="sr-only">{` ${label.toLowerCase()}`}</span>
                    </Button>
                </div>
            </div>
            {failed ? (
                <p role="alert" className="mt-1.5 text-[12px] text-destructive">
                    Couldn&rsquo;t access the clipboard. Select the value above and copy it manually.
                </p>
            ) : (
                <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>
            )}
            <span aria-live="polite" className="sr-only">
                {copied ? `${label} copied to the clipboard.` : ""}
            </span>
            <Dialog
                open={qrOpen}
                onOpenChange={setQrOpen}
                title={label}
                description="Scan this QR code with a phone camera to get the value."
            >
                <div className="flex items-center justify-center rounded-md bg-white p-4">
                    <Suspense fallback={<div className="aspect-square w-full max-w-64" />}>
                        {qrRequested && (
                            <QRCode value={qr} size={256} level="M" className="h-auto w-full max-w-64" />
                        )}
                    </Suspense>
                </div>
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-center font-mono text-[12px] break-all text-muted-foreground">
                    {display}
                </p>
            </Dialog>
        </div>
    );
}

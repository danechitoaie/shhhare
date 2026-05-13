import { useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, FileIcon, FlameIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { base64ToFile } from "@/lib/base64";
import { fmtBytes } from "@/lib/utils";

type RevealedFile = { n: string; t: string; c: string };
type RevealedPayload = { t: string; f: RevealedFile[] };

type RevealedPanelProps = {
    payload: RevealedPayload;
    bar: boolean;
};

export function RevealedPanel({ payload, bar }: RevealedPanelProps) {
    const [copied, setCopied] = useState<boolean>(false);

    const onCopyText = async () => {
        try {
            await navigator.clipboard.writeText(payload.t);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error(err);
        }
    };

    const onDownload = (file: RevealedFile) => {
        const blob = base64ToFile(file.c, file.n, file.t || "application/octet-stream");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.n;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasText = payload.t.length > 0;
    const hasFiles = payload.f.length > 0;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-lg font-semibold mb-2">Secret revealed</h1>
                {!bar ? (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
                        <FlameIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <div className="font-semibold text-destructive">Burn after reading</div>
                            <div className="text-muted-foreground">
                                This secret has been permanently destroyed. Save anything you need now.
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Save or copy what you need. The link will keep working until it expires.
                    </p>
                )}
            </div>

            {hasText && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Message</Label>
                        <button
                            type="button"
                            onClick={onCopyText}
                            aria-label="Copy message"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                            {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            <span>{copied ? "Copied" : "Copy"}</span>
                        </button>
                    </div>
                    <pre className="rounded-md border bg-muted/30 px-4 py-3 font-mono text-sm whitespace-pre-wrap wrap-break-word">
                        {payload.t}
                    </pre>
                </div>
            )}

            {hasFiles && (
                <div className="flex flex-col gap-2">
                    <Label>Attachments</Label>
                    <div className="flex flex-col gap-1.5">
                        {payload.f.map((f, i) => {
                            const size = Math.floor((f.c.length * 3) / 4);
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-background border text-[13px]"
                                >
                                    <FileIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-mono truncate flex-1" title={f.n}>
                                        {f.n}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                                        {fmtBytes(size)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onDownload(f)}
                                        aria-label={`Download ${f.n}`}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                    >
                                        <DownloadIcon className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!hasText && !hasFiles && (
                <p className="text-sm text-muted-foreground text-center">This secret was empty.</p>
            )}
        </div>
    );
}

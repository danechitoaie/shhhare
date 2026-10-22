import { useEffect, useRef } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, FileIcon, FlameIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { CardBody } from "@/components/ui/card";
import { labelClassName } from "@/components/ui/label";
import { useClipboard } from "@/hooks/use-clipboard";
import type { Revealed, RevealedFile } from "@/lib/crypto-client";
import { fmtBytes, fmtRemaining } from "@/lib/format";

/** Revoking right after click() can cancel the download in some browsers, so wait a while. */
const REVOKE_DELAY_MS = 60_000;

function download(file: RevealedFile) {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.rel = "noopener";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

type RevealedPanelProps = {
    revealed: Revealed;
    bar: boolean;
    expiresAt: number | null;
    now: number;
};

export function RevealedPanel({ revealed, bar, expiresAt, now }: RevealedPanelProps) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    const { copied, failed, copy } = useClipboard();

    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    const hasText = revealed.text.length > 0;
    const hasFiles = revealed.files.length > 0;

    return (
        <CardBody className="flex flex-col gap-6">
            <div>
                <h1 ref={headingRef} tabIndex={-1} className="mb-2 text-lg font-semibold outline-none">
                    Secret revealed
                </h1>
                {bar ? (
                    <Callout variant="destructive" icon={<FlameIcon aria-hidden="true" />} title="Burn after reading">
                        This secret has been permanently destroyed. Save anything you need now.
                    </Callout>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Save or copy what you need. The link keeps working
                        {expiresAt !== null && expiresAt > now ? ` for another ${fmtRemaining(expiresAt - now)}` : " until it expires"}.
                    </p>
                )}
            </div>

            {hasText && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span id="message-label" className={labelClassName}>
                            Message
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => copy(revealed.text)}>
                            {copied ? <CheckIcon /> : <CopyIcon />}
                            {copied ? "Copied" : "Copy"}
                            <span className="sr-only"> message</span>
                        </Button>
                    </div>
                    <pre
                        aria-labelledby="message-label"
                        tabIndex={0}
                        className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 px-4 py-3 font-mono text-sm wrap-break-word whitespace-pre-wrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                        {revealed.text}
                    </pre>
                    {failed && (
                        <p role="alert" className="text-[12px] text-destructive">
                            Couldn&rsquo;t access the clipboard. Select the text above and copy it manually.
                        </p>
                    )}
                    <span aria-live="polite" className="sr-only">
                        {copied ? "Message copied to the clipboard." : ""}
                    </span>
                </div>
            )}

            {hasFiles && (
                <div className="flex flex-col gap-2">
                    <span id="attachments-label" className={labelClassName}>
                        Attachments
                    </span>
                    <ul aria-labelledby="attachments-label" className="flex flex-col gap-1.5">
                        {revealed.files.map((file, i) => (
                            <li
                                key={i}
                                className="flex items-center gap-2 rounded-sm border bg-background py-1 pr-1 pl-2 text-[13px]"
                            >
                                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="flex-1 truncate font-mono" title={file.name}>
                                    {file.name}
                                </span>
                                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                    {fmtBytes(file.blob.size)}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => download(file)}>
                                    <DownloadIcon />
                                    <span className="hidden sm:inline">Download</span>
                                    <span className="sr-only">{` ${file.name}`}</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!hasText && !hasFiles && (
                <p className="text-center text-sm text-muted-foreground">This secret was empty.</p>
            )}
        </CardBody>
    );
}

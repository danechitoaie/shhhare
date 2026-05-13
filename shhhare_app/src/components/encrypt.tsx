import { useEffect, useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import {
    FlameIcon,
    EyeIcon,
    ClockIcon,
    CalendarIcon,
    CalendarDaysIcon,
    ShieldCheckIcon,
    SendIcon,
    FileIcon,
    PaperclipIcon,
    PlusIcon,
    XIcon,
    Loader2Icon,
} from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { fmtBytes } from "@/lib/utils";
import { fileToBase64 } from "@/lib/base64";
import { encrypt, type EncryptResult } from "@/lib/crypto";
import { APP_DATA } from "@/lib/config";

type EncryptProps = {
    onSetStoredSecret: (storedSecret: { secretKey: string; decryptionKey: string } | null) => void;
};

export function Encrypt({ onSetStoredSecret }: EncryptProps) {
    const [text, setText] = useState<string>("");
    const [dragging, setDragging] = useState<boolean>(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const [ttl, setTtl] = useState<"H" | "D" | "W">("H");
    const [bar, setBar] = useState<boolean>(true);
    const [payload, setPayload] = useState<EncryptResult | null>(null);
    const [encrypting, setEncrypting] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorOpen, setErrorOpen] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const maxBytes = APP_DATA.b;
    const totalBytes = payload?.val.length ?? 0;
    const over = totalBytes > maxBytes;
    const percentage = Math.min(100, (totalBytes / maxBytes) * 100);

    useEffect(() => {
        if (text === "" && files.length === 0) {
            setPayload(null);
            setEncrypting(false);
            return;
        }

        let cancelled = false;
        setEncrypting(true);
        const handle = setTimeout(async () => {
            try {
                const f = await Promise.all(
                    files.map(async (file) => ({
                        n: file.name,
                        t: file.type,
                        c: await fileToBase64(file),
                    })),
                );

                if (cancelled) {
                    return;
                }

                const json = JSON.stringify({ t: text, f });
                const result = await encrypt(json);

                if (cancelled) {
                    return;
                }

                setPayload(result);
                setEncrypting(false);
            } catch {
                if (!cancelled) {
                    setPayload(null);
                    setEncrypting(false);
                }
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [text, files]);

    const addFiles = (incoming: FileList | File[]) => {
        const arr = Array.from(incoming);
        if (arr.length === 0) {
            return;
        }

        setFiles((prev) => [...prev, ...arr]);
    };

    const onDropFiles = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);

        if (e.dataTransfer?.files) {
            addFiles(e.dataTransfer.files);
        }
    };

    const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }

        e.target.value = "";
    };

    const removeFile = (i: number) => {
        setFiles((prev) => prev.filter((_, idx) => idx !== i));
    };

    const onSubmit = async () => {
        if (!payload || submitting) {
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/secret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ val: payload.val, ttl, bar }),
            });

            if (!res.ok) {
                throw new Error("Failed to store the secret!");
            }

            const obj = (await res.json()) as { key: string };
            if (!obj.key) {
                throw new Error("Invalid response from the server!");
            }

            setText("");
            setFiles([]);
            setSubmitting(false);

            onSetStoredSecret({
                secretKey: obj.key,
                decryptionKey: payload.key,
            });
        } catch (err) {
            console.error(err);
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to store the secret.",
            );
            setErrorOpen(true);
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="pt-4 pb-6">
                <Label htmlFor="secret">
                    <Pill>01</Pill>Your secret
                </Label>
                <Textarea
                    id="secret"
                    className="mt-2 py-3.5 px-4 min-h-58 resize-y font-mono placeholder:text-muted-foreground"
                    placeholder="Type the thing only they should see..."
                    spellCheck={false}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>

            <div className="pt-6 pb-6">
                <Label htmlFor="file">
                    <Pill>02</Pill>Attachments
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                        (optional · drag &amp; drop)
                    </span>
                </Label>
                <div
                    className={
                        "mt-2 rounded-md border border-dashed bg-muted/30 p-3 transition-colors " +
                        (dragging ? "border-foreground bg-muted/60" : "border-border")
                    }
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDropFiles}
                >
                    {files.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {files.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-background border text-[13px]"
                                >
                                    <FileIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-mono truncate flex-1" title={f.name}>
                                        {f.name}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                                        {fmtBytes(f.size)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        aria-label="Remove"
                                        className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 p-1 text-[13px] text-muted-foreground">
                            <PaperclipIcon className="w-3.5 h-3.5" />
                            <span>
                                Drop files here, or{" "}
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="bg-transparent border-0 p-0 text-foreground underline hover:no-underline cursor-pointer font-inherit"
                                >
                                    browse
                                </button>
                            </span>
                        </div>
                    )}
                    {files.length > 0 && (
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                            <PlusIcon className="w-3.5 h-3.5" /> add more
                        </button>
                    )}
                    <input ref={fileRef} id="file" type="file" multiple className="sr-only" onChange={onPickFiles} />
                </div>
            </div>

            <div className="pt-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <Label id="expiration-label">
                        <Pill>03</Pill>Expires after
                    </Label>
                    <div
                        role="tablist"
                        aria-labelledby="expiration-label"
                        className="mt-2 p-0.75 relative inline-flex items-center w-full bg-muted rounded-md"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute top-0.75 bottom-0.75 left-0.75 rounded-[6px] bg-background shadow-xs transition-transform duration-200 ease-out"
                            style={{
                                width: "calc((100% - 0.375rem) / 3)",
                                transform: `translateX(${ttl === "H" ? 0 : ttl === "D" ? 100 : 200}%)`,
                            }}
                        />
                        <button
                            role="tab"
                            aria-selected={ttl === "H"}
                            className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                            onClick={() => setTtl("H")}
                        >
                            <ClockIcon className="w-3.25 h-3.25" />1 hour
                        </button>

                        <button
                            role="tab"
                            aria-selected={ttl === "D"}
                            className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                            onClick={() => setTtl("D")}
                        >
                            <CalendarIcon className="w-3.25 h-3.25" />1 day
                        </button>

                        <button
                            role="tab"
                            aria-selected={ttl === "W"}
                            className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                            onClick={() => setTtl("W")}
                        >
                            <CalendarDaysIcon className="w-3.25 h-3.25" />1 week
                        </button>
                    </div>
                </div>
                <div>
                    <Label id="access-label">
                        <Pill>04</Pill>Access
                    </Label>
                    <div
                        role="tablist"
                        aria-labelledby="access-label"
                        className="mt-2 p-0.75 relative inline-flex items-center w-full bg-muted rounded-md"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute top-0.75 bottom-0.75 left-0.75 rounded-[6px] bg-background shadow-xs transition-transform duration-200 ease-out"
                            style={{
                                width: "calc((100% - 0.375rem) / 2)",
                                transform: `translateX(${bar ? 0 : 100}%)`,
                            }}
                        />
                        <button
                            role="tab"
                            aria-selected={bar}
                            className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                            onClick={() => setBar(true)}
                        >
                            <FlameIcon className="w-3.25 h-3.25" />
                            Burn after read
                        </button>

                        <button
                            role="tab"
                            aria-selected={!bar}
                            className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                            onClick={() => setBar(false)}
                        >
                            <EyeIcon className="w-3.25 h-3.25" />
                            Multiple reads
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-6 pb-2">
                <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">
                        Payload
                        <span className="ml-2 text-[11px] text-muted-foreground/80">
                            (size of the data after encryption)
                        </span>
                    </span>
                    <span className={"font-mono " + (over ? "text-destructive" : "text-foreground")}>
                        {fmtBytes(totalBytes)} <span className="text-muted-foreground">/ {fmtBytes(maxBytes)}</span>
                    </span>
                </div>
                <div
                    className={
                        "mt-2 h-1.5 w-full rounded-full overflow-hidden " + (over ? "bg-destructive/20" : "bg-muted")
                    }
                >
                    <div
                        className={
                            "h-full transition-[width] duration-200 ease-out " +
                            (over ? "bg-destructive" : "bg-foreground")
                        }
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {over && (
                    <div className="mt-1.5 text-[12px] text-destructive font-mono">
                        over by {fmtBytes(totalBytes - maxBytes)}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 py-4 px-12 mt-6 -mx-12 -mb-8 border-t border-border bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] text-[13px] rounded-b-lg">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>AES-256-GCM end-to-end encryption. Key in URL fragment.</span>
                </span>

                <Button
                    type="button"
                    size="lg"
                    className="cursor-pointer px-6"
                    disabled={encrypting || submitting || !payload || over}
                    onClick={onSubmit}
                >
                    {encrypting || submitting ? (
                        <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <SendIcon className="w-3.5 h-3.5" />
                    )}{" "}
                    Shhhare it!
                </Button>
            </div>

            <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submission failed</DialogTitle>
                        <DialogDescription>
                            Unable to store your secret on the server.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="px-3 py-2 rounded-md border bg-muted/30 break-all font-mono text-[12px] text-muted-foreground">
                        {errorMessage}
                    </p>
                    <DialogFooter showCloseButton className="sm:justify-center [&_button]:cursor-pointer" />
                </DialogContent>
            </Dialog>
        </>
    );
}

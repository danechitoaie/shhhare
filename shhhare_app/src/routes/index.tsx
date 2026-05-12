import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { Flame, Eye, Clock, Calendar, CalendarDays, ShieldCheck, Send, File as FileIcon, Paperclip, Plus, X, Loader2 } from "lucide-react";
import { Num } from "@/components/ui/num";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fmtBytes } from "@/lib/utils";
import { fileToBase64 } from "@/lib/base64";
import { encrypt, type EncryptResult } from "@/lib/crypto";
import { APP_DATA } from "@/lib/config";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const [text, setText] = useState<string>("");
    const [dragging, setDragging] = useState<boolean>(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const [ttl, setTtl] = useState<"HOUR" | "DAY" | "WEEK">("HOUR");
    const [bar, setBar] = useState<boolean>(true);
    const [payload, setPayload] = useState<EncryptResult | null>(null);
    const [encrypting, setEncrypting] = useState<boolean>(false);

    const maxBytes = APP_DATA.b;
    const totalBytes = payload?.ciphertext.length ?? 0;
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
                console.log(result);
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

    return (
        <div className="px-4">
            <div className="my-10 px-12 py-8 max-w-lg lg:max-w-4xl mx-auto bg-background rounded-lg shadow-md border">
                <div className="pt-4 pb-6">
                    <Label htmlFor="secret">
                        <Num>01</Num>Your secret
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
                        <Num>02</Num>Attachments
                        <span className="ml-auto font-mono text-xs text-muted-foreground">(optional · drag &amp; drop)</span>
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
                                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-background border text-[13px]">
                                        <FileIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="font-mono truncate flex-1" title={f.name}>
                                            {f.name}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground shrink-0">{fmtBytes(f.size)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            aria-label="Remove"
                                            className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 p-1 text-[13px] text-muted-foreground">
                                <Paperclip className="w-3.5 h-3.5" />
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
                                <Plus className="w-3.5 h-3.5" /> add more
                            </button>
                        )}
                        <input ref={fileRef} id="file" type="file" multiple className="sr-only" onChange={onPickFiles} />
                    </div>
                </div>

                <div className="pt-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <Label id="expiration-label">
                            <Num>03</Num>Expires after
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
                                    transform: `translateX(${ttl === "HOUR" ? 0 : ttl === "DAY" ? 100 : 200}%)`,
                                }}
                            />
                            <button
                                role="tab"
                                aria-selected={ttl === "HOUR"}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                                onClick={() => setTtl("HOUR")}
                            >
                                <Clock className="w-3.25 h-3.25" />1 hour
                            </button>

                            <button
                                role="tab"
                                aria-selected={ttl === "DAY"}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                                onClick={() => setTtl("DAY")}
                            >
                                <Calendar className="w-3.25 h-3.25" />1 day
                            </button>

                            <button
                                role="tab"
                                aria-selected={ttl === "WEEK"}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                                onClick={() => setTtl("WEEK")}
                            >
                                <CalendarDays className="w-3.25 h-3.25" />1 week
                            </button>
                        </div>
                    </div>
                    <div>
                        <Label id="access-label">
                            <Num>04</Num>Access
                        </Label>
                        <div role="tablist" aria-labelledby="access-label" className="mt-2 p-0.75 relative inline-flex items-center w-full bg-muted rounded-md">
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
                                <Flame className="w-3.25 h-3.25" />
                                Burn after read
                            </button>

                            <button
                                role="tab"
                                aria-selected={!bar}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-foreground aria-selected:text-foreground"
                                onClick={() => setBar(false)}
                            >
                                <Eye className="w-3.25 h-3.25" />
                                Multiple reads
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6 pb-2">
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted-foreground">
                            Payload
                            <span className="ml-2 text-[11px] text-muted-foreground/80">(size of the data after encryption)</span>
                        </span>
                        <span className={"font-mono " + (over ? "text-destructive" : "text-foreground")}>
                            {fmtBytes(totalBytes)} <span className="text-muted-foreground">/ {fmtBytes(maxBytes)}</span>
                        </span>
                    </div>
                    <div className={"mt-2 h-1.5 w-full rounded-full overflow-hidden " + (over ? "bg-destructive/20" : "bg-muted")}>
                        <div
                            className={"h-full transition-[width] duration-200 ease-out " + (over ? "bg-destructive" : "bg-foreground")}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    {over && <div className="mt-1.5 text-[12px] text-destructive font-mono">over by {fmtBytes(totalBytes - maxBytes)}</div>}
                </div>

                <div className="flex items-center justify-between gap-3 py-4 px-12 mt-6 -mx-12 -mb-8 border-t border-border bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] text-[13px] rounded-b-lg">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>AES-256-GCM end-to-end encryption · key in URL fragment</span>
                    </span>

                    <Button type="button" size="lg" className="cursor-pointer px-6" disabled={encrypting || over || !payload}>
                        {encrypting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Shhhare it!
                    </Button>
                </div>
            </div>
        </div>
    );
}

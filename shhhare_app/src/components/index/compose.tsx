import { useEffect, useEffectEvent, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import {
    CalendarDaysIcon,
    CalendarIcon,
    ClockIcon,
    EyeIcon,
    FlameIcon,
    Loader2Icon,
    SendIcon,
    ShieldCheckIcon,
    TriangleAlertIcon,
} from "lucide-react";
import { Attachments, type Attachment } from "@/components/index/attachments";
import { PayloadMeter } from "@/components/index/payload-meter";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { CardBody, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/ui/pill";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import { MAX_SIZE } from "@/config";
import { ApiError, createSecret, type Ttl } from "@/lib/api";
import { WorkerError, encryptSecret } from "@/lib/crypto-client";
import { fmtBytes } from "@/lib/format";
import { payloadSize } from "@/lib/payload";

export type Created = { id: string; key: string; ttl: Ttl; bar: boolean };

type Access = "burn" | "multi";
type Phase = "idle" | "encrypting" | "uploading";
type Failure = { title: string; message: string; details?: string };

const TTL_OPTIONS = [
    { value: "H" as const, label: "1 hour", icon: ClockIcon },
    { value: "D" as const, label: "1 day", icon: CalendarIcon },
    { value: "W" as const, label: "1 week", icon: CalendarDaysIcon },
];

const ACCESS_OPTIONS = [
    { value: "burn" as const, label: "Burn after read", icon: FlameIcon },
    { value: "multi" as const, label: "Multiple reads", icon: EyeIcon },
];

function describeFailure(err: unknown): Failure {
    if (err instanceof ApiError) {
        return { title: "Couldn't store your secret", message: err.message, details: err.details };
    }

    if (err instanceof WorkerError && err.code === "read") {
        return {
            title: "Couldn't read an attachment",
            message: "One of the files may have been moved or changed. Remove it and attach it again.",
        };
    }

    return {
        title: "Encryption failed",
        message: "Something went wrong while encrypting your secret.",
        details: err instanceof Error ? err.message : undefined,
    };
}

function hasFiles(e: DragEvent): boolean {
    return e.dataTransfer?.types.includes("Files") ?? false;
}

export function ComposePanel({ onCreated }: { onCreated: (created: Created) => void }) {
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [ttl, setTtl] = useState<Ttl>("H");
    const [access, setAccess] = useState<Access>("burn");
    const [phase, setPhase] = useState<Phase>("idle");
    const [failure, setFailure] = useState<Failure | null>(null);
    const [skipped, setSkipped] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const files = attachments.map((a) => a.file);
    const empty = text === "" && attachments.length === 0;
    const size = empty ? 0 : payloadSize(text, files, MAX_SIZE);
    const over = size > MAX_SIZE;
    const busy = phase !== "idle";

    function addFiles(incoming: FileList | File[]) {
        const accepted: Attachment[] = [];
        const rejected: string[] = [];
        for (const file of Array.from(incoming)) {
            if (file.size > MAX_SIZE) {
                rejected.push(`${file.name} (${fmtBytes(file.size)})`);
            } else {
                accepted.push({ id: crypto.randomUUID(), file });
            }
        }

        setSkipped(
            rejected.length > 0
                ? `Skipped ${rejected.join(", ")}: larger than the ${fmtBytes(MAX_SIZE)} limit.`
                : null,
        );
        if (accepted.length > 0) {
            setAttachments((prev) => [...prev, ...accepted]);
        }
    }

    function removeFile(id: string) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
        setSkipped(null);
    }

    const onDropFiles = useEffectEvent((files: FileList) => {
        if (!busy) {
            addFiles(files);
        }
    });

    // Accept files dropped anywhere on the page, and stop the browser from
    // navigating away to a file that misses the form.
    useEffect(() => {
        let depth = 0;

        const onDragEnter = (e: DragEvent) => {
            if (hasFiles(e)) {
                e.preventDefault();
                depth++;
                setDragging(true);
            }
        };

        const onDragOver = (e: DragEvent) => {
            if (hasFiles(e) && e.dataTransfer) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
            }
        };

        const onDragLeave = (e: DragEvent) => {
            if (hasFiles(e)) {
                depth = Math.max(0, depth - 1);
                if (depth === 0) {
                    setDragging(false);
                }
            }
        };

        const onDrop = (e: DragEvent) => {
            if (hasFiles(e)) {
                e.preventDefault();
                depth = 0;
                setDragging(false);
                if (e.dataTransfer?.files.length) {
                    onDropFiles(e.dataTransfer.files);
                }
            }
        };

        window.addEventListener("dragenter", onDragEnter);
        window.addEventListener("dragover", onDragOver);
        window.addEventListener("dragleave", onDragLeave);
        window.addEventListener("drop", onDrop);
        return () => {
            window.removeEventListener("dragenter", onDragEnter);
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("dragleave", onDragLeave);
            window.removeEventListener("drop", onDrop);
        };
    }, []);

    function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
        // Only take over pastes that are just files (e.g. a screenshot), not rich text that carries an image too.
        if (e.clipboardData.files.length > 0 && !e.clipboardData.types.includes("text/plain")) {
            e.preventDefault();
            addFiles(e.clipboardData.files);
        }
    }

    function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    }

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (empty || over || busy) {
            return;
        }

        setFailure(null);
        setPhase("encrypting");
        try {
            const sealed = await encryptSecret(text, files, MAX_SIZE);
            if (sealed.val.length > MAX_SIZE) {
                setFailure({
                    title: "Payload too large",
                    message: "An attachment changed after you added it and no longer fits. Remove it and try again.",
                });
                setPhase("idle");
                return;
            }

            setPhase("uploading");
            const bar = access === "burn";
            const id = await createSecret({ val: sealed.val, ttl, bar });
            onCreated({ id, key: sealed.key, ttl, bar });
        } catch (err) {
            console.error(err);
            setFailure(describeFailure(err));
            setPhase("idle");
        }
    }

    return (
        <form onSubmit={onSubmit} noValidate aria-busy={busy}>
            <CardBody className="flex flex-col gap-8 sm:gap-12 sm:pt-12">
                <div>
                    <Label htmlFor="secret">
                        <Pill>01</Pill>
                        Your secret
                        <span className="ml-auto hidden font-mono text-xs font-normal text-muted-foreground sm:inline">
                            Ctrl/⌘ + Enter to send
                        </span>
                    </Label>
                    <Textarea
                        id="secret"
                        className="mt-2 max-h-[70vh] min-h-58 resize-y px-4 py-3.5 font-mono placeholder:text-muted-foreground"
                        placeholder="Type the thing only they should see…"
                        value={text}
                        readOnly={busy}
                        onChange={(e) => setText(e.target.value)}
                        onPaste={onPaste}
                        onKeyDown={onKeyDown}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        data-gramm="false"
                        data-gramm_editor="false"
                        data-enable-grammarly="false"
                        data-1p-ignore=""
                        data-lpignore="true"
                    />
                </div>

                <div>
                    <Attachments
                        attachments={attachments}
                        dragging={dragging}
                        disabled={busy}
                        onAdd={addFiles}
                        onRemove={removeFile}
                    />
                    {skipped && (
                        <p role="status" className="mt-1.5 text-[12px] text-destructive">
                            {skipped}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6">
                    <Segmented
                        name="ttl"
                        label={
                            <>
                                <Pill>03</Pill>Expires after
                            </>
                        }
                        value={ttl}
                        options={TTL_OPTIONS}
                        onChange={setTtl}
                        disabled={busy}
                    />
                    <Segmented
                        name="access"
                        label={
                            <>
                                <Pill>04</Pill>Access
                            </>
                        }
                        value={access}
                        options={ACCESS_OPTIONS}
                        onChange={setAccess}
                        disabled={busy}
                    />
                </div>

                <PayloadMeter size={size} max={MAX_SIZE} />

                {failure && (
                    <Callout variant="destructive" role="alert" icon={<TriangleAlertIcon />} title={failure.title}>
                        <p>{failure.message}</p>
                        {failure.details && (
                            <p className="mt-2 font-mono text-[12px] break-all">{failure.details}</p>
                        )}
                    </Callout>
                )}
            </CardBody>

            <CardFooter>
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>AES-256-GCM end-to-end encryption. Key in URL fragment.</span>
                </span>
                <Button type="submit" size="lg" disabled={empty || over || busy}>
                    {busy ? <Loader2Icon className="size-3.5 animate-spin" /> : <SendIcon className="size-3.5" />}
                    {phase === "encrypting" ? "Encrypting…" : phase === "uploading" ? "Sending…" : "Shhhare it!"}
                </Button>
            </CardFooter>
        </form>
    );
}

import { useId, type ChangeEvent } from "react";
import { FileIcon, PaperclipIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import { labelClassName } from "@/components/ui/label";
import { Pill } from "@/components/ui/pill";
import { fmtBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Attachment = { id: string; file: File };

type AttachmentsProps = {
    attachments: Attachment[];
    dragging: boolean;
    disabled: boolean;
    onAdd: (files: FileList) => void;
    onRemove: (id: string) => void;
};

export function Attachments({ attachments, dragging, disabled, onAdd, onRemove }: AttachmentsProps) {
    const inputId = useId();

    function onPick(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            onAdd(e.target.files);
        }

        e.target.value = "";
    }

    return (
        <div>
            <div className={labelClassName}>
                <Pill>02</Pill>
                <span id={`${inputId}-label`}>Attachments</span>
                <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
                    (optional<span className="hidden sm:inline"> · drag, drop or paste</span>)
                </span>
            </div>
            <div
                className={cn(
                    "mt-2 rounded-md border border-dashed bg-muted/30 p-3 transition-colors motion-reduce:transition-none",
                    dragging ? "border-foreground bg-muted/60" : "border-border",
                )}
            >
                {attachments.length > 0 && (
                    <ul className="mb-2 flex flex-col gap-1.5" aria-labelledby={`${inputId}-label`}>
                        {attachments.map(({ id, file }) => (
                            <li
                                key={id}
                                className="flex items-center gap-2 rounded-sm border bg-background px-2 py-1.5 text-[13px]"
                            >
                                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="flex-1 truncate font-mono" title={file.name}>
                                    {file.name}
                                </span>
                                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                    {fmtBytes(file.size)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(id)}
                                    disabled={disabled}
                                    aria-label={`Remove ${file.name}`}
                                    className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <label
                    htmlFor={inputId}
                    className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-sm p-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50",
                        attachments.length > 0 && "w-fit px-2",
                    )}
                >
                    <input
                        id={inputId}
                        type="file"
                        multiple
                        disabled={disabled}
                        className="sr-only"
                        onChange={onPick}
                    />
                    {dragging ? (
                        <>
                            <UploadIcon className="size-3.5" aria-hidden="true" />
                            <span className="text-foreground">Drop to attach</span>
                        </>
                    ) : attachments.length > 0 ? (
                        <>
                            <PlusIcon className="size-3.5" aria-hidden="true" />
                            <span>Add more files</span>
                        </>
                    ) : (
                        <>
                            <PaperclipIcon className="size-3.5" aria-hidden="true" />
                            <span>
                                Drop files here, or <span className="text-foreground underline">browse</span>
                            </span>
                        </>
                    )}
                </label>
            </div>
        </div>
    );
}

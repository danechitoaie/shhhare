import { useId, useState, type FormEvent } from "react";
import { ClockIcon, FlameIcon, KeyIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, readSecret } from "@/lib/api";
import { WorkerError, decryptSecret, type Revealed } from "@/lib/crypto-client";
import { isValidKey } from "@/lib/crypto";
import { fmtDateTime, fmtRemaining } from "@/lib/format";

type Phase = "idle" | "fetching" | "decrypting";

type RevealPanelProps = {
    secretKey: string;
    /** Key from the URL fragment, or "" when the link doesn't carry one. */
    linkKey: string;
    bar: boolean;
    expiresAt: number | null;
    now: number;
    onRevealed: (revealed: Revealed) => void;
    /** The secret no longer exists on the server. */
    onGone: () => void;
    /** A burn-after-read secret was consumed but couldn't be decrypted. */
    onBurned: () => void;
};

function describeFetchFailure(err: unknown): string {
    if (err instanceof ApiError) {
        return err.message;
    }

    return "Something went wrong while fetching the secret.";
}

export function RevealPanel({
    secretKey,
    linkKey,
    bar,
    expiresAt,
    now,
    onRevealed,
    onGone,
    onBurned,
}: RevealPanelProps) {
    const inputId = useId();
    const [manualKey, setManualKey] = useState("");
    const [showKeyError, setShowKeyError] = useState(false);
    const [phase, setPhase] = useState<Phase>("idle");
    const [failure, setFailure] = useState<string | null>(null);
    /** Set once the key from the link failed to decrypt, so another one can be pasted. */
    const [linkKeyRejected, setLinkKeyRejected] = useState(false);

    const linkKeyValid = linkKey !== "" && isValidKey(linkKey) && !linkKeyRejected;
    const key = linkKeyValid ? linkKey : manualKey.trim();
    const keyValid = isValidKey(key);
    const busy = phase !== "idle";

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (busy) {
            return;
        }

        // Check the key before asking the server: fetching a burn-after-read secret destroys it,
        // so a typo must never get that far.
        if (!keyValid) {
            setShowKeyError(true);
            return;
        }

        setFailure(null);
        setPhase("fetching");

        let val: string;
        try {
            val = (await readSecret(secretKey)).val;
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                onGone();
                return;
            }

            console.error(err);
            setFailure(describeFetchFailure(err));
            setPhase("idle");
            return;
        }

        setPhase("decrypting");
        try {
            onRevealed(await decryptSecret(val, key));
        } catch (err) {
            console.error(err);
            if (bar) {
                onBurned();
                return;
            }

            const wrongKey = err instanceof WorkerError && err.code === "decrypt";
            setFailure(
                wrongKey
                    ? "This key can't decrypt the secret. Check that you have the right key and try again."
                    : "The secret couldn't be decrypted. It may be damaged or in an unsupported format.",
            );
            if (wrongKey && linkKeyValid) {
                setLinkKeyRejected(true);
            }
            setPhase("idle");
        }
    }

    const keyError = showKeyError && !keyValid;

    return (
        <CardBody>
            <form onSubmit={onSubmit} noValidate aria-busy={busy} className="flex flex-col gap-6">
                <div className="text-center">
                    <h1 className="text-lg font-semibold">An encrypted secret is waiting for you</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The contents are end-to-end encrypted. Only your link can decrypt them.
                    </p>
                </div>

                {bar && (
                    <Callout variant="destructive" icon={<FlameIcon aria-hidden="true" />} title="Burn after reading">
                        This secret will be permanently destroyed the moment it is revealed. You can only view it once.
                    </Callout>
                )}

                {expiresAt !== null && (
                    <div className="flex items-center justify-center gap-2 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        <ClockIcon className="size-5 shrink-0" aria-hidden="true" />
                        <span>
                            Expires in{" "}
                            <time
                                dateTime={new Date(expiresAt).toISOString()}
                                title={fmtDateTime(expiresAt)}
                                className="font-semibold"
                            >
                                {fmtRemaining(expiresAt - now)}
                            </time>
                        </span>
                    </div>
                )}

                {!linkKeyValid && (
                    <div className="flex flex-col gap-2">
                        {linkKey !== "" && !linkKeyRejected && (
                            <Callout icon={<TriangleAlertIcon aria-hidden="true" />} title="Incomplete link">
                                The key in this link is damaged or cut off. Paste the full decryption key below, or ask
                                the sender for the link again.
                            </Callout>
                        )}
                        <Label htmlFor={inputId} className="mt-2">
                            Decryption key
                        </Label>
                        <Input
                            id={inputId}
                            type="text"
                            className="font-mono placeholder:font-sans"
                            placeholder="Paste the decryption key"
                            value={manualKey}
                            readOnly={busy}
                            onChange={(e) => {
                                setManualKey(e.target.value);
                                setShowKeyError(false);
                            }}
                            onBlur={() => setShowKeyError(manualKey.trim() !== "")}
                            aria-invalid={keyError || undefined}
                            aria-describedby={`${inputId}-hint`}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            data-1p-ignore=""
                            data-lpignore="true"
                        />
                        <p id={`${inputId}-hint`} className={keyError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                            {keyError ? (
                                "That doesn't look like a valid decryption key. Check that you copied all of it (about 44 characters)."
                            ) : (
                                <>
                                    The key is normally part of the link, after the <span className="font-mono">#</span>.
                                    If you received it separately, paste it here.
                                </>
                            )}
                        </p>
                    </div>
                )}

                <div className="flex flex-col items-center gap-2">
                    <Button type="submit" size="lg" className="w-full px-8 sm:w-auto" disabled={busy || key === ""}>
                        {busy ? <Loader2Icon className="size-4 animate-spin" /> : <KeyIcon className="size-4" />}
                        {phase === "fetching" ? "Fetching…" : phase === "decrypting" ? "Decrypting…" : "Reveal secret"}
                    </Button>
                    {failure && (
                        <p role="alert" className="max-w-sm text-center text-xs text-destructive">
                            {failure}
                        </p>
                    )}
                </div>
            </form>
        </CardBody>
    );
}

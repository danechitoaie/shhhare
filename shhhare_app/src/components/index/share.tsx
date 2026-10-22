import { useEffect, useRef, useState } from "react";
import { KeyRoundIcon, Link2Icon, LinkIcon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react";
import type { Created } from "@/components/index/compose";
import { Button } from "@/components/ui/button";
import { CardBody, CardFooter } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog } from "@/components/ui/dialog";
import { Pill } from "@/components/ui/pill";

const TTL_LABELS = { H: "1 hour", D: "1 day", W: "1 week" } as const;

export function SharePanel({ created, onReset }: { created: Created; onReset: () => void }) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    const [shared, setShared] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        headingRef.current?.focus();
        // Warm up the QR code chunk so the first QR dialog opens instantly.
        void import("react-qr-code");
    }, []);

    // The key exists only in this tab until it has been copied somewhere.
    useEffect(() => {
        if (shared) {
            return;
        }

        const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [shared]);

    const origin = window.location.origin;
    const [, proto = "", host = origin] = /^(https?:\/\/)(.*)$/.exec(origin) ?? [];
    const shortLink = `${origin}/s/${created.id}`;
    const fullLink = `${shortLink}#${created.key}`;

    function onShared() {
        setShared(true);
    }

    function onAnother() {
        if (shared) {
            onReset();
        } else {
            setConfirmOpen(true);
        }
    }

    return (
        <>
            <CardBody className="flex flex-col gap-8 sm:pt-12">
                <div>
                    <h1
                        ref={headingRef}
                        tabIndex={-1}
                        className="flex items-center gap-2 text-sm leading-none font-medium outline-none"
                    >
                        <Pill>OK</Pill>Your secret is ready
                    </h1>
                    <p className="mt-3 text-[13px] text-muted-foreground">
                        Copy the link below and share it. The key never reaches the server. It expires after{" "}
                        <span className="text-foreground">{TTL_LABELS[created.ttl]}</span>
                        {created.bar ? (
                            <>
                                {" "}
                                or <span className="text-foreground">after it&rsquo;s read once</span>, whichever comes
                                first.
                            </>
                        ) : (
                            " and can be read any number of times until then."
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <CopyField
                        label="One-click link"
                        icon={<LinkIcon aria-hidden="true" />}
                        value={fullLink}
                        qr={`🔗 ${fullLink}`}
                        display={
                            <>
                                <span className="text-muted-foreground">{proto}</span>
                                {host}/s/{created.id}#<span className="font-bold">{created.key}</span>
                            </>
                        }
                        hint="Opens and decrypts in one step (the key is in the URL fragment)."
                        onShared={onShared}
                    />
                    <CopyField
                        label="Short link"
                        icon={<Link2Icon aria-hidden="true" />}
                        value={shortLink}
                        qr={`🔗 ${shortLink}`}
                        display={
                            <>
                                <span className="text-muted-foreground">{proto}</span>
                                {host}/s/{created.id}
                            </>
                        }
                        hint="Share it separately from the key for extra safety."
                        onShared={onShared}
                    />
                    <CopyField
                        label="Decryption key"
                        icon={<KeyRoundIcon aria-hidden="true" />}
                        value={created.key}
                        qr={`🔑 ${created.key}`}
                        display={<span className="font-bold">{created.key}</span>}
                        hint="Send it through a different channel than the short link."
                        onShared={onShared}
                    />
                </div>
            </CardBody>

            <CardFooter>
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>We can&rsquo;t recover this key. Save it before leaving.</span>
                </span>
                <Button size="lg" onClick={onAnother}>
                    <RotateCcwIcon className="size-3.5" />
                    Shhhare another!
                </Button>
            </CardFooter>

            <Dialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Start over without saving the link?"
                description="You haven't copied the link or the key yet. Nobody can recover them once you leave this page, so the secret would be lost."
                closeLabel="Keep it"
                actions={
                    <Button variant="destructive" onClick={onReset}>
                        Discard and start over
                    </Button>
                }
            />
        </>
    );
}

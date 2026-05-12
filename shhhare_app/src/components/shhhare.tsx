import type { ReactNode } from "react";
import { LinkIcon, Link2Icon, KeyRoundIcon, ShieldCheckIcon, RotateCcwIcon } from "lucide-react";
import { Num } from "@/components/ui/num";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "./ui/copy";

type ShhhareProps = {
    storedSecret: { secretKey: string; decryptionKey: string };
    onSetStoredSecret: (storedSecret: { secretKey: string; decryptionKey: string } | null) => void;
};

export function Shhhare({ storedSecret, onSetStoredSecret }: ShhhareProps) {
    const origin = window.location.origin;
    const protoMatch = origin.match(/^(https?:\/\/)(.*)$/);
    const proto = protoMatch?.[1] ?? "";
    const host = protoMatch?.[2] ?? origin;

    const oneClickLinkValueCopy = `${origin}/s/${storedSecret.secretKey}#k=${storedSecret.decryptionKey}`;
    const oneClickLinkValueQr = `🔗 ${oneClickLinkValueCopy}`;
    const oneClickLinkDisplay = (
        <>
            <span className="text-muted-foreground">{proto}</span>
            {host}/s/{storedSecret.secretKey}#k=<span className="font-bold">{storedSecret.decryptionKey}</span>
        </>
    );

    const shortLinkValueCopy = `${origin}/s/${storedSecret.secretKey}`;
    const shortLinkValueQr = `🔗 ${shortLinkValueCopy}`;
    const shortLinkDisplay = (
        <>
            <span className="text-muted-foreground">{proto}</span>
            {host}/s/{storedSecret.secretKey}
        </>
    );

    const decryptionKeyValueCopy = storedSecret.decryptionKey;
    const decryptionKeyValueQr = `🔑 ${decryptionKeyValueCopy}`;
    const decryptionKeyDisplay = (
        <>
            <span className="font-bold">{storedSecret.decryptionKey}</span>
        </>
    );

    const items: {
        id: string;
        label: string;
        copy: string;
        qr: string;
        display: ReactNode;
        icon: ReactNode;
        hint: string;
    }[] = [
        {
            id: "one-click-link",
            label: "One-click link",
            copy: oneClickLinkValueCopy,
            qr: oneClickLinkValueQr,
            display: oneClickLinkDisplay,
            icon: <LinkIcon className="w-3.5 h-3.5" />,
            hint: "Opens and decrypts in one step (key in URL fragment)",
        },
        {
            id: "short-link",
            label: "Short link",
            copy: shortLinkValueCopy,
            qr: shortLinkValueQr,
            display: shortLinkDisplay,
            icon: <Link2Icon className="w-3.5 h-3.5" />,
            hint: "Share separately from the key for extra safety",
        },
        {
            id: "decryption-key",
            label: "Decryption key",
            copy: decryptionKeyValueCopy,
            qr: decryptionKeyValueQr,
            display: decryptionKeyDisplay,
            icon: <KeyRoundIcon className="w-3.5 h-3.5" />,
            hint: "Send through a different channel than the short link",
        },
    ];

    return (
        <>
            <div className="pt-4 pb-2">
                <Label>
                    <Num>OK</Num>Your secret is ready
                </Label>
                <p className="mt-2 text-[13px] text-muted-foreground">
                    Copy the link below and share it. The key never reaches the server.
                </p>
            </div>

            <div className="pt-4 pb-2 flex flex-col gap-4">
                {items.map((it) => (
                    <Copy
                        key={it.id}
                        label={it.label}
                        copy={it.copy}
                        qr={it.qr}
                        display={it.display}
                        icon={it.icon}
                        hint={it.hint}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 py-4 px-12 mt-6 -mx-12 -mb-8 border-t border-border bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] text-[13px] rounded-b-lg">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    <span>We can&rsquo;t recover this key. Save it before leaving.</span>
                </span>
                <Button type="button" size="lg" className="cursor-pointer px-6" onClick={() => onSetStoredSecret(null)}>
                    <RotateCcwIcon className="w-3.5 h-3.5" /> Shhhare another!
                </Button>
            </div>
        </>
    );
}

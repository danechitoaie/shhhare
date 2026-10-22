import type { ReactNode } from "react";

function isCryptoSupported(): boolean {
    return (
        window.isSecureContext &&
        typeof window.crypto?.subtle?.encrypt === "function" &&
        typeof window.crypto.subtle.decrypt === "function" &&
        typeof window.crypto.subtle.generateKey === "function" &&
        typeof window.crypto.getRandomValues === "function" &&
        typeof Worker === "function"
    );
}

export function CryptoGuard({ children }: { children: ReactNode }) {
    if (isCryptoSupported()) {
        return children;
    }

    return (
        <div className="flex min-h-dvh items-start justify-center px-4 pt-[30vh]">
            <div className="w-full max-w-md rounded-lg border bg-background p-8 text-center shadow-md">
                <h1 className="mb-3 text-xl font-semibold">Browser not supported</h1>
                <p className="text-sm text-muted-foreground">
                    This app needs the Web Crypto API (<code className="font-mono">crypto.subtle</code>) and Web
                    Workers to encrypt and decrypt your secrets in the browser. They aren&rsquo;t available here.
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                    Please use an up-to-date browser over a secure (HTTPS) connection and try again.
                </p>
            </div>
        </div>
    );
}

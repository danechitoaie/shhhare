import { type ReactNode } from "react";

function isCryptoSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.crypto !== "undefined" &&
        typeof window.crypto.subtle !== "undefined" &&
        typeof window.crypto.subtle.encrypt === "function" &&
        typeof window.crypto.subtle.decrypt === "function" &&
        typeof window.crypto.subtle.generateKey === "function" &&
        typeof window.crypto.getRandomValues === "function"
    );
}

interface CryptoGuardProps {
    children: ReactNode;
}

export function CryptoGuard({ children }: CryptoGuardProps) {
    if (isCryptoSupported()) {
        return children;
    }

    return (
        <div className="min-h-screen flex items-start justify-center px-4 pt-[30vh]">
            <div className="max-w-md w-full p-8 bg-background border rounded-lg shadow-md text-center">
                <h1 className="text-xl font-semibold mb-3">Browser not supported!</h1>
                <p className="text-sm text-muted-foreground">
                    This app requires the Web Crypto API (<code className="font-mono">crypto.subtle</code>) to encrypt/decrypt your secrets in the browser. Your
                    current browser does not support this feature.
                </p>
                <p className="mt-4 text-sm text-muted-foreground">Please use a modern browser over a secure (HTTPS) connection and try again.</p>
            </div>
        </div>
    );
}

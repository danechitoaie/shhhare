import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyholeIcon } from "lucide-react";
import { APP_DATA } from "@/config";

const version = /^\d/.test(APP_DATA.v) ? `v${APP_DATA.v}` : APP_DATA.v;

export function Shell({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-dvh flex-col">
            <header className="px-4">
                <div className="mx-auto flex max-w-lg items-center justify-between gap-4 py-6 lg:max-w-4xl">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2.5 rounded-md text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                        <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                            <LockKeyholeIcon className="size-4" aria-hidden="true" />
                        </span>
                        Shhhare!
                    </Link>
                    <p className="text-[13px] text-muted-foreground text-shadow-2xs text-shadow-black/10">Share secrets, not regrets!</p>
                </div>
            </header>
            <main className="flex-1 px-4">{children}</main>
            <footer className="px-4 pb-8">
                <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground lg:max-w-4xl">
                    {version && <span>{version}</span>}
                    {APP_DATA.h && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span>{APP_DATA.h}</span>
                        </>
                    )}
                    <span aria-hidden="true">·</span>
                    <a href="/doc/" className="underline-offset-4 hover:text-foreground hover:underline">
                        API docs
                    </a>
                </div>
            </footer>
        </div>
    );
}

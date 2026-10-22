import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, FileQuestionMarkIcon, ServerCrashIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatusPanelProps = {
    icon: LucideIcon;
    tone?: "muted" | "destructive";
    /** Large text above the title, e.g. an HTTP status code. */
    headline?: string;
    title: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
};

export function StatusPanel({ icon: Icon, tone = "muted", headline, title, children, action }: StatusPanelProps) {
    return (
        <div className="flex flex-col items-center py-6 text-center">
            <div
                className={cn(
                    "mb-4 rounded-full p-3",
                    tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                )}
            >
                <Icon className="size-6" aria-hidden="true" />
            </div>
            {headline && <p className="mb-2 text-5xl font-bold tracking-tight">{headline}</p>}
            <h1 className="mb-2 text-lg font-semibold">{title}</h1>
            {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

function describeStatus(code: number): { icon: LucideIcon; message: string } {
    if (code === 404) {
        return { icon: FileQuestionMarkIcon, message: "The page you're looking for doesn't exist or has been moved." };
    }

    if (code >= 500) {
        return { icon: ServerCrashIcon, message: "Something went wrong on our side. Please try again in a moment." };
    }

    return { icon: TriangleAlertIcon, message: "The server couldn't complete this request." };
}

/** Full page for an HTTP error status (404s and server-rendered error pages). */
export function StatusPage({ code, reason }: { code: number; reason: string }) {
    const { icon, message } = describeStatus(code);

    return (
        <Card>
            <CardBody>
                <StatusPanel
                    icon={icon}
                    tone={code >= 500 ? "destructive" : "muted"}
                    headline={String(code)}
                    title={reason}
                    action={
                        <Link to="/" className={buttonVariants()}>
                            <ArrowLeftIcon />
                            Back to home
                        </Link>
                    }
                >
                    {message}
                </StatusPanel>
            </CardBody>
        </Card>
    );
}

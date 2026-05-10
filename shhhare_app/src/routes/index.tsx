import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Eye, Clock, Calendar, CalendarDays, ShieldCheck, ArrowRight } from "lucide-react";
import { Num } from "@/components/ui/num";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const [ttl, setTtl] = useState<"HOUR" | "DAY" | "WEEK">("HOUR");
    const [bar, setBar] = useState<boolean>(true);

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
                    />
                </div>

                <div className="pt-6 pb-6">
                    <Label htmlFor="file">
                        <Num>02</Num>Attachments
                        <span className="ml-auto font-mono text-muted-foreground">optional · drag &amp; drop</span>
                    </Label>
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
                            <button
                                role="tab"
                                aria-selected={ttl === "HOUR"}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs"
                                onClick={() => setTtl("HOUR")}
                            >
                                <Clock className="w-3.25 h-3.25" />1 hour
                            </button>

                            <button
                                role="tab"
                                aria-selected={ttl === "DAY"}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs"
                                onClick={() => setTtl("DAY")}
                            >
                                <Calendar className="w-3.25 h-3.25" />1 day
                            </button>

                            <button
                                role="tab"
                                aria-selected={ttl === "WEEK"}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs"
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
                            <button
                                role="tab"
                                aria-selected={bar}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs"
                                onClick={() => setBar(true)}
                            >
                                <Flame className="w-3.25 h-3.25" />
                                Burn after read
                            </button>

                            <button
                                role="tab"
                                aria-selected={!bar}
                                className="flex-1 h-8 border-0 bg-transparent text-muted-foreground text-[13px] font-medium rounded-[6px] cursor-pointer z-1 inline-flex items-center justify-center gap-1.5 transition-colors duration-150 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs"
                                onClick={() => setBar(false)}
                            >
                                <Eye className="w-3.25 h-3.25" />
                                Multiple reads
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 py-4 px-12 mt-6 -mx-12 -mb-8 border-t border-border bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] text-[13px] rounded-b-lg">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>End-to-end encrypted · key in URL fragment</span>
                    </span>

                    <Button type="button" size="lg" className="cursor-pointer px-6">
                        <ShieldCheck className="w-3.5 h-3.5" /> Encrypt &amp; create link
                    </Button>
                </div>
            </div>
        </div>
    );
}

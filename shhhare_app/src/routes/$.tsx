import { createFileRoute } from "@tanstack/react-router";
import { StatusPage } from "@/components/status";

export const Route = createFileRoute("/$")({
    component: () => <StatusPage code={404} reason="Not Found" />,
});

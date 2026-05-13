import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$")({
    component: NotFound,
});

function NotFound() {
    return (
        <div className="px-4">
            <div className="my-10 px-12 py-12 max-w-lg lg:max-w-2xl mx-auto bg-background rounded-lg shadow-md border text-center">
                <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-muted p-4">
                        <FileQuestionIcon className="size-10 text-muted-foreground" />
                    </div>
                </div>
                <h1 className="text-5xl font-bold tracking-tight mb-2">404</h1>
                <h2 className="text-xl font-semibold mb-3">Page not found</h2>
                <p className="text-muted-foreground mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Button asChild>
                    <Link to="/">
                        <ArrowLeftIcon />
                        Back to home
                    </Link>
                </Button>
            </div>
        </div>
    );
}

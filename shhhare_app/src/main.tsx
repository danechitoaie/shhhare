import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { CryptoGuard } from "@/guards/crypto";
import { ThemeProvider } from "./components/ui/theme-provider";
import { routeTree } from "./routeTree.gen";
import "./main.css";

const router = createRouter({ routeTree });
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <CryptoGuard>
                <RouterProvider router={router} />
            </CryptoGuard>
        </ThemeProvider>
    </StrictMode>,
);

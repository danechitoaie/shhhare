import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Shell } from "@/components/layout/shell";
import { StatusPage } from "@/components/status";
import { APP_DATA } from "@/config";

export const Route = createRootRoute({
    component: RootLayout,
    notFoundComponent: () => <StatusPage code={404} reason="Not Found" />,
});

// The server renders every page through this app and reports its HTTP status in
// #__DATA__. A non-200 status applies to the URL the document was served for.
const initialPathname = window.location.pathname;
const serverStatus = APP_DATA.c === 200 ? null : { code: APP_DATA.c, reason: APP_DATA.r };

function RootLayout() {
    const pathname = useLocation({ select: (location) => location.pathname });
    const status = serverStatus && pathname === initialPathname ? serverStatus : null;

    return (
        <Shell>
            {status ? <StatusPage code={status.code} reason={status.reason} /> : <Outlet />}
            <TanStackRouterDevtools position="bottom-right" />
        </Shell>
    );
}

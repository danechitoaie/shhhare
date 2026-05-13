import { useEffect } from "react";
import type { ReactNode } from "react";

type ThemeProviderProps = {
    children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
    useEffect(() => {
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = (isDark: boolean) => {
            const theme = isDark ? "dark" : "light";
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(theme);
        };

        applyTheme(mql.matches);

        const listener = (e: MediaQueryListEvent) => {
            applyTheme(e.matches);
        };

        mql.addEventListener("change", listener);

        return () => {
            mql.removeEventListener("change", listener);
        };
    }, []);

    return children;
}

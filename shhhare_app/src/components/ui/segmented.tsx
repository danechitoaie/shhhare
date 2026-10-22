import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { labelClassName } from "@/components/ui/label";

type SegmentedOption<T extends string> = {
    value: T;
    label: string;
    icon: LucideIcon;
};

type SegmentedProps<T extends string> = {
    label: ReactNode;
    name: string;
    value: T;
    options: SegmentedOption<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
};

/** A radio group styled as a segmented control. Arrow keys move between options natively. */
export function Segmented<T extends string>({ label, name, value, options, onChange, disabled }: SegmentedProps<T>) {
    const labelId = useId();
    const index = Math.max(
        0,
        options.findIndex((o) => o.value === value),
    );

    return (
        <div>
            <span id={labelId} className={labelClassName}>
                {label}
            </span>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="relative mt-2 flex w-full items-center rounded-md bg-muted p-0.75 has-disabled:opacity-60"
            >
                <span
                    aria-hidden="true"
                    className="absolute top-0.75 bottom-0.75 left-0.75 rounded-[6px] bg-background shadow-xs transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-input/60"
                    style={{
                        width: `calc((100% - 0.375rem) / ${options.length})`,
                        transform: `translateX(${index * 100}%)`,
                    }}
                />
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="relative z-1 inline-flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-1 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 select-none hover:text-foreground has-checked:text-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={option.value === value}
                            disabled={disabled}
                            onChange={() => onChange(option.value)}
                            className="sr-only"
                        />
                        <option.icon className="size-3.25 shrink-0" aria-hidden="true" />
                        <span className="truncate">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

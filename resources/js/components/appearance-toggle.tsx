import { Monitor, Moon, Sun } from 'lucide-react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const TABS: { value: Appearance; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Oscuro' },
    { value: 'system', icon: Monitor, label: 'Sistema' },
];

type Props = {
    className?: string;
};

/**
 * Compact light/dark/system switcher for the public navbar. Smaller than the
 * admin `AppearanceToggleTab` so it fits next to the rest of the menu items.
 */
export default function AppearanceToggle({ className }: Props) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div
            className={cn(
                'inline-flex items-center gap-0.5 rounded-md border border-border bg-background/60 p-0.5 backdrop-blur',
                className,
            )}
            role="radiogroup"
            aria-label="Tema"
        >
            {TABS.map(({ value, icon: Icon, label }) => {
                const active = appearance === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={label}
                        title={label}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'grid h-7 w-7 place-items-center rounded-sm transition',
                            active
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </button>
                );
            })}
        </div>
    );
}
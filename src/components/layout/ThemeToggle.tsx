import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Switches between light and dark. The first visit follows the device's own setting. */
export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    const dark = resolvedTheme === 'dark';
    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn('relative', className)}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
        >
            <Sun className={cn('h-5 w-5 transition-all duration-300', dark ? 'rotate-90 scale-0' : 'rotate-0 scale-100')} />
            <Moon className={cn('absolute h-5 w-5 transition-all duration-300', dark ? 'rotate-0 scale-100' : '-rotate-90 scale-0')} />
        </Button>
    );
}

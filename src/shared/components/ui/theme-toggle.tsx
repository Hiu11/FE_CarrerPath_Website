import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { getTheme, setTheme, type Theme } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

const themes: Theme[] = ['light', 'dark', 'system'];

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
  system: <Monitor className="size-4" />,
};

const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function ThemeToggle() {
  const [current, setCurrent] = useState<Theme>('system');

  useEffect(() => {
    setCurrent(getTheme());
  }, []);

  const cycle = () => {
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    setTheme(next);
    setCurrent(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycle}
      title={`Theme: ${themeLabels[current]}`}
      aria-label={`Switch theme (current: ${themeLabels[current]})`}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      {themeIcons[current]}
      <span className="hidden sm:inline">{themeLabels[current]}</span>
    </Button>
  );
}

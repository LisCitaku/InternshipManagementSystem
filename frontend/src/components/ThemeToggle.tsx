import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" className="px-3 py-2" onClick={toggleTheme}>
      {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
    </Button>
  );
}


import { Button } from '@social/ui';
import { useTheme } from '../../providers/ThemeProvider';
import { vibboxThemeCSS } from './theme';

interface VIBoxButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'host' | 'team';
  className?: string;
}

export function VIBoxButton({ 
  onClick, 
  size = 'md', 
  variant = 'host',
  className = '' 
}: VIBoxButtonProps) {
  const { isDark } = useTheme();
  const themeColors = isDark ? vibboxThemeCSS.dark : vibboxThemeCSS.light;

  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6', 
    lg: 'h-8'
  };

  const hostClasses = 'flex items-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl';
  const teamClasses = 'flex items-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl';

  const buttonClasses = variant === 'host' ? hostClasses : teamClasses;
  const buttonVariant = variant === 'host' ? 'ghost' : undefined;
  const buttonSize = variant === 'host' ? 'sm' : undefined;

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={onClick}
      className={`${buttonClasses} ${className}`}
      type="button"
      style={{
        color: variant === 'host' ? themeColors['--color-vibox-button-primary'] : themeColors['--color-vibox-button-primary'],
        background: `linear-gradient(to bottom right, ${themeColors['--color-vibox-background-gradient-from']}, ${themeColors['--color-vibox-background-gradient-via']}, ${themeColors['--color-vibox-background-gradient-to']})`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = themeColors['--color-vibox-button-ghost'];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = themeColors['--color-vibox-button-primary'];
      }}
    >
      <img 
        src="/viboxToken.png" 
        alt="VIBox Token" 
        className={`${sizeClasses[size]} w-auto mr-1 scale-150 transition-all duration-300 ease-in-out hover:rotate-12`}
      />
      <img 
        src="/viboxLong2.png" 
        alt="VIBox" 
        className={`${sizeClasses[size]} w-auto -mt-1 transition-all duration-300 ease-in-out hover:scale-110`}
      />
    </Button>
  );
}

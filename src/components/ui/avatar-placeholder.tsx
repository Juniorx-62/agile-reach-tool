import { cn } from '@/lib/utils';

interface AvatarPlaceholderProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const colorPalette = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
];

function getColorFromName(name: string) {
  const charCode = name.charCodeAt(0);
  return colorPalette[charCode % colorPalette.length];
}

export function AvatarPlaceholder({ 
  name, 
  photoUrl, 
  size = 'md',
  className 
}: AvatarPlaceholderProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white',
        sizeClasses[size],
        getColorFromName(name),
        className
      )}
    >
      {initials}
    </div>
  );
}

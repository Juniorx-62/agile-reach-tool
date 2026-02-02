import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AvatarPlaceholderProps {
  name: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[9px]',
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

/**
 * Validates a photo URL for security:
 * - Must be a valid URL
 * - Must use HTTPS protocol (or relative path)
 * - Rejects data: URIs to prevent malicious content
 */
function isValidPhotoUrl(url: string): boolean {
  // Allow relative paths
  if (url.startsWith('/')) {
    return true;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS URLs for security
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    // Block data URIs to prevent malicious content
    if (url.startsWith('data:')) {
      return false;
    }
    
    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

export function AvatarPlaceholder({ 
  name, 
  photoUrl, 
  size = 'md',
  className 
}: AvatarPlaceholderProps) {
  const [imageError, setImageError] = useState(false);
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Only render img if URL is valid and hasn't errored
  const shouldShowImage = photoUrl && isValidPhotoUrl(photoUrl) && !imageError;

  if (shouldShowImage) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
        onError={() => setImageError(true)}
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

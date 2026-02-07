import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle,
  Target,
  BarChart3,
  type LucideIcon
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'gradient-primary text-white',
  success: 'gradient-success text-white',
  warning: 'bg-warning/10 border-warning/20',
};

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle,
  className,
  variant = 'default',
  onClick,
}: StatCardProps) {
  const isPrimary = variant === 'primary' || variant === 'success';

  return (
    <div 
      className={cn(
        'stat-card',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:scale-[1.02] transition-transform',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            isPrimary ? 'text-white/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold mt-2',
            isPrimary ? 'text-white' : 'text-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1',
              isPrimary ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          isPrimary ? 'bg-white/20' : 'bg-muted'
        )}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-destructive" />
          )}
          <span className={cn(
            'text-sm font-medium',
            trend.isPositive ? 'text-success' : 'text-destructive'
          )}>
            {trend.value}%
          </span>
          <span className={cn(
            'text-xs',
            isPrimary ? 'text-white/60' : 'text-muted-foreground'
          )}>
            vs. sprint anterior
          </span>
        </div>
      )}
    </div>
  );
}

// Export icon mapping for consistent usage
export const StatIcons = {
  tasks: CheckSquare,
  clock: Clock,
  users: Users,
  alert: AlertTriangle,
  target: Target,
  chart: BarChart3,
} as const;

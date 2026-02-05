import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sprint } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SprintNavigationProps {
  sprints: Sprint[];
  activeSprintId: string | null;
  onSprintSelect: (sprintId: string) => void;
}

export function SprintNavigation({ 
  sprints, 
  activeSprintId, 
  onSprintSelect 
}: SprintNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkArrows = () => {
    const container = containerRef.current;
    if (!container) return;
    
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, [sprints.length]);

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });

    // Check arrows after scroll animation
    setTimeout(checkArrows, 300);
  };

  if (sprints.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Left Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 transition-opacity",
          !showLeftArrow && "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Sprint Tabs Container */}
      <div 
        ref={containerRef}
        onScroll={checkArrows}
        className="flex-1 overflow-x-auto scrollbar-hidden"
      >
        <div className="inline-flex bg-muted/50 p-1 rounded-lg gap-1 min-w-max">
          {sprints.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => onSprintSelect(sprint.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all",
                activeSprintId === sprint.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {sprint.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 transition-opacity",
          !showRightArrow && "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

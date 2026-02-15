'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Box } from '@/lib/types';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

interface DroppableBoxProps {
  box: Box;
  children: React.ReactNode;
  hasChildren: boolean;
}

export function DroppableBox({ box, children, hasChildren }: DroppableBoxProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `box-${box.id}`,
    data: {
      type: 'box',
      accepts: ['item', 'box'],
    },
  });

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "transition-colors",
        isOver ? "border-primary bg-primary/10" : "bg-card",
        !hasChildren && "min-h-[50px]" // Provide a drop target area for empty boxes
      )}
    >
      {children}
    </Card>
  );
}

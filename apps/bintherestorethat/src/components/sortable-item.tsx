'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  type: 'box' | 'item';
  data?: Record<string, any>;
}

export function SortableItem({ id, children, type, data }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type, ...data } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center gap-2 w-full",
        isDragging && "opacity-50"
      )}
    >
       <span {...attributes} {...listeners} className="cursor-grab touch-none p-2">
         <GripVertical className="h-5 w-5 text-muted-foreground" />
       </span>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}

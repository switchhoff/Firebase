'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Room } from '@/lib/types';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from './ui/card';
import { Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DroppableRoomProps {
  room: Room;
  boxCount: number;
  children: React.ReactNode;
}

export function DroppableRoom({ room, boxCount, children }: DroppableRoomProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `room-${room.id}`,
    data: {
      type: 'room',
      accepts: ['box'],
    },
  });

  return (
    <AccordionItem value={room.id} className="border-b-0">
      <Card 
        ref={setNodeRef} 
        className={cn(
          "overflow-hidden transition-colors", 
          isOver ? "border-primary bg-primary/10" : "bg-card"
        )}
      >
        <AccordionTrigger className="p-6 hover:no-underline">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Warehouse className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-lg">{room.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{boxCount} top-level box(es)</p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {children}
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}

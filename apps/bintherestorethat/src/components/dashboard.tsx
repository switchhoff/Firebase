'use client';

import { useEffect, useState, useMemo } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Box, Item, Room } from '@/lib/types';
import { CreateRoomDialog } from './create-room-dialog';
import { CreateBoxDialog } from './create-box-dialog';
import { BoxItem } from './box-item';
import { Warehouse } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { updateBox, updateItem } from '@/app/actions';
import { DroppableRoom } from './droppable-room';

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const roomsUnsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching rooms: ", error);
      const permissionError = new FirestorePermissionError({ path: 'rooms', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    const boxesUnsubscribe = onSnapshot(collection(db, 'boxes'), (snapshot) => {
      const boxesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Box));
      setBoxes(boxesData);
    }, (error) => {
      console.error("Error fetching boxes: ", error);
      const permissionError = new FirestorePermissionError({ path: 'boxes', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    });

    const itemsUnsubscribe = onSnapshot(collection(db, 'items'), (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(itemsData);
      }, (error) => {
        console.error("Error fetching items: ", error);
        const permissionError = new FirestorePermissionError({ path: 'items', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
      });

    return () => {
      roomsUnsubscribe();
      boxesUnsubscribe();
      itemsUnsubscribe();
    };
  }, []);

  const topLevelBoxIds = useMemo(() => boxes.filter(b => !b.parentId).map(b => `box-${b.id}`), [boxes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    const activeId = active.id.toString().replace(`${activeType}-`, '');
    const overId = over.id.toString().replace(`${overType}-`, '');
    
    // Dragging an Item
    if (activeType === 'item') {
      // to a Box
      if (overType === 'box' && active.data.current?.boxId !== overId) {
        updateItem(activeId, { boxId: overId });
      }
    }
    
    // Dragging a Box
    if (activeType === 'box') {
      const draggedBox = boxes.find(b => b.id === activeId);
      if (!draggedBox) return;

      const isDraggedBoxTopLevel = !draggedBox.parentId;

      // Case 1: Dragging a box to another box (nesting or re-parenting)
      if (overType === 'box' && activeId !== overId) {
        // Prevent top-level boxes from being nested
        if (isDraggedBoxTopLevel) {
          return; 
        }

        // Allow nested boxes to be moved into other boxes.
        const targetParentBox = boxes.find(b => b.id === overId);
        if (targetParentBox) {
            // Update parentId and roomId to match the new parent.
            updateBox(activeId, { parentId: overId, roomId: targetParentBox.roomId });
        }
      }
      
      // Case 2: Dragging a box to a room
      if (overType === 'room') {
        // Only allow top-level boxes to be moved between rooms.
        if (isDraggedBoxTopLevel) {
          if (draggedBox.roomId !== overId) {
            updateBox(activeId, { roomId: overId });
          }
        }
        // Nested boxes cannot be dragged directly into a room so we do nothing.
      }
    }
  };
  
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Your Storage</h1>
            <p className="text-muted-foreground">Manage your rooms and storage boxes.</p>
          </div>
          <div className="flex gap-2">
            <CreateRoomDialog />
            <CreateBoxDialog rooms={rooms} />
          </div>
        </div>

        {rooms.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto bg-secondary p-3 rounded-full mb-4">
                <Warehouse className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No rooms yet</CardTitle>
              <CardDescription>Click &quot;Add Room&quot; to create your first room and start organizing.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4" defaultValue={rooms.map(r => r.id)}>
            {rooms.map((room) => {
              const topLevelBoxesInRoom = boxes
                .filter((box) => box.roomId === room.id && !box.parentId)
                .sort((a, b) => (a.code && b.code) ? a.code.localeCompare(b.code) : a.name.localeCompare(b.name));

              return (
                <DroppableRoom key={room.id} room={room} boxCount={topLevelBoxesInRoom.length}>
                  <div className="p-6 pt-0">
                    <SortableContext items={topLevelBoxIds} strategy={verticalListSortingStrategy}>
                      {topLevelBoxesInRoom.length > 0 ? (
                        <div className="space-y-4">
                          {topLevelBoxesInRoom.map((box) => (
                            <BoxItem
                              key={box.id}
                              box={box}
                              allBoxes={boxes}
                              allItems={items}
                              rooms={rooms}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 border-2 border-dashed rounded-lg">
                          <p className="text-muted-foreground">No boxes in this room yet. Drag a box here or create a new one.</p>
                        </div>
                      )}
                    </SortableContext>
                  </div>
                </DroppableRoom>
              );
            })}
          </Accordion>
        )}
      </div>
    </DndContext>
  );
}

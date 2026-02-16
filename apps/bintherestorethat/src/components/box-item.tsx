'use client';

import { useState, useMemo, useTransition } from 'react';
import type { Box, Item, Room } from '@/lib/types';
import { CardContent } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { addItem, addBox, deleteItem } from '@/app/actions';
import { Badge } from './ui/badge';
import { X, Plus, QrCode, Package, ChevronRight, GripVertical, Box as BoxIcon, Tag } from 'lucide-react';
import { QRCodeDialog } from './qr-code-dialog';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableItem } from './sortable-item';
import { DroppableBox } from './droppable-box';

interface BoxItemProps {
  box: Box;
  allBoxes: Box[];
  allItems: Item[];
  rooms: Room[];
}

export function BoxItem({ box, allBoxes, allItems, rooms }: BoxItemProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newBoxName, setNewBoxName] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [isItemPending, startItemTransition] = useTransition();
  const [isBoxPending, startBoxTransition] = useTransition();

  const [isDeletePending, startDeleteTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `box-${box.id}`, data: { type: 'box', accepts: ['item', 'box'] } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const boxDisplayName = box.parentId ? box.name : (box.code ? `${box.code} - ${box.name}` : box.name);

  const childBoxes = useMemo(() => allBoxes.filter(b => b.parentId === box.id), [allBoxes, box.id]);
  const itemsInBox = useMemo(() => allItems.filter(i => i.boxId === box.id), [allItems, box.id]);

  const childBoxIds = useMemo(() => childBoxes.map(b => `box-${b.id}`), [childBoxes]);
  const itemIds = useMemo(() => itemsInBox.map(i => `item-${i.id}`), [itemsInBox]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      startItemTransition(async () => {
        const result = await addItem(newItemName.trim(), box.id);
        if (result?.error) {
          toast({ title: 'Error adding item', description: result.error, variant: 'destructive' });
        } else {
          setNewItemName('');
        }
      });
    }
  };

  const handleAddBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoxName.trim()) {
      const formData = new FormData();
      formData.set('name', newBoxName.trim());
      formData.set('roomId', box.roomId);
      formData.set('parentId', box.id);
      startBoxTransition(async () => {
        const result = await addBox(formData);
        if (result?.error) {
          toast({ title: 'Error creating box', description: result.error, variant: 'destructive' });
        } else {
          setNewBoxName('');
        }
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    startItemTransition(async () => {
      startDeleteTransition(async () => {
        await deleteItem(itemId);
        toast({ title: 'Item removed' });
      });
    });

    return (
      // eslint-disable-next-line react/style-prop-object
      <div ref={setNodeRef} style={style}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <DroppableBox box={box} hasChildren={childBoxes.length > 0 || itemsInBox.length > 0}>
            <div className="flex items-center p-4 w-full">
              <span {...attributes} {...listeners} className="cursor-grab touch-none p-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </span>
              <CollapsibleTrigger asChild>
                <div className="flex items-center cursor-pointer flex-grow">
                  <ChevronRight className={`h-5 w-5 mr-2 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  {box.parentId ? <BoxIcon className="h-5 w-5 text-muted-foreground mr-3" /> : <Package className="h-5 w-5 text-muted-foreground mr-3" />}
                  <div className="flex-grow">
                    <p className="font-semibold">{boxDisplayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {box.size && !box.parentId ? `${box.size} | ` : ''}
                      {itemsInBox.length} item(s), {childBoxes.length} box(es)
                    </p>
                    {box.tags && box.tags.length > 0 && !box.parentId && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {box.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              {!box.parentId && (
                <Button onClick={() => setShowQrCode(true)} size="icon" variant="ghost" aria-label="Generate QR Code" className="ml-2 flex-shrink-0">
                  <QrCode className="h-5 w-5" />
                </Button>
              )}
            </div>

            <CollapsibleContent>
              <CardContent className="pl-16 pr-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Items in {boxDisplayName}</h4>
                    <div className="mt-2 space-y-2">
                      <form onSubmit={handleAddItem} className="flex gap-2">
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Add a new item..."
                          className="h-9"
                          disabled={isItemPending}
                        />
                        <Button type="submit" size="icon" variant="outline" className="h-9 w-9" disabled={isItemPending}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </form>
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {itemsInBox.length > 0 ? (
                          <div className="space-y-2 pt-2">
                            {itemsInBox.map((item) => (
                              <SortableItem key={item.id} id={`item-${item.id}`} type="item" data={{ boxId: box.id }}>
                                <Badge variant="secondary" className="pl-2 pr-1 py-1 text-sm justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-normal">{item.name}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => handleRemoveItem(item.id)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              </SortableItem>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground pt-2 text-center">No items in this box yet.</p>
                        )}
                      </SortableContext>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="font-semibold mb-2 text-sm">Boxes in {boxDisplayName}</h4>
                    <div className="mt-2 space-y-2">
                      <form onSubmit={handleAddBox} className="flex gap-2">
                        <Input
                          value={newBoxName}
                          onChange={(e) => setNewBoxName(e.target.value)}
                          placeholder="Add a new nested box..."
                          className="h-9"
                          disabled={isBoxPending}
                        />
                        <Button type="submit" size="icon" variant="outline" className="h-9 w-9" disabled={isBoxPending}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </form>
                      <SortableContext items={childBoxIds} strategy={verticalListSortingStrategy}>
                        {childBoxes.length > 0 ? (
                          <div className="space-y-2 pt-2">
                            {childBoxes.map(child => (
                              <BoxItem key={child.id} box={child} allBoxes={allBoxes} allItems={allItems} rooms={rooms} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground pt-2 text-center">No nested boxes.</p>
                        )}
                      </SortableContext>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </DroppableBox>
        </Collapsible>
        {showQrCode && (
          <QRCodeDialog box={box} open={showQrCode} onOpenChange={setShowQrCode} />
        )}
      </div>
    );
  }

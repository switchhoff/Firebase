'use client';

import { useState, useTransition, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { deleteBox, updateBox } from '@/app/actions';
import type { Box, Room } from '@/lib/types';
import { Trash2, Pencil } from 'lucide-react';
import { Badge } from './ui/badge';
import { TagSelect } from './tag-select';
import { OwnerSelect } from './owner-select';
import { Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsFormProps {
  boxes: Box[];
  rooms: Room[];
}

export function SettingsForm({ boxes: initialBoxes, rooms }: SettingsFormProps) {
  const [boxes, setBoxes] = useState(initialBoxes);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [boxToEdit, setBoxToEdit] = useState<Box | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');

  useEffect(() => {
    setBoxes(initialBoxes);
  }, [initialBoxes]);

  const filteredBoxes = boxes.filter(box => {
    const matchesSearch =
      box.name.toLowerCase().includes(search.toLowerCase()) ||
      (box.code && box.code.toLowerCase().includes(search.toLowerCase())) ||
      (box.tags && box.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));

    const matchesRoom = roomFilter === 'all' || box.roomId === roomFilter;

    return matchesSearch && matchesRoom;
  });

  const handleDelete = (boxId: string) => {
    startTransition(async () => {
      await deleteBox(boxId);
      toast({ title: 'Box and its contents deleted' });
    });
  };

  const handleEdit = () => {
    if (!boxToEdit || !editedName.trim()) return;

    startTransition(async () => {
      const updateData: Partial<Omit<Box, 'id'>> = { name: editedName.trim() };
      if (!boxToEdit.parentId) {
        updateData.tags = editedTags;
      }
      await updateBox(boxToEdit.id, updateData);

      toast({ title: 'Box details updated' });
      setBoxToEdit(null);
    });
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setBoxToEdit(null);
      setEditedName('');
      setEditedTags([]);
    }
  }

  const getLocationName = (box: Box): string => {
    if (box.parentId) {
      const parentBox = boxes.find(b => b.id === box.parentId);
      if (!parentBox) return 'Unknown Box';
      const parentDisplayName = parentBox.code ? `${parentBox.code} - ${parentBox.name}` : parentBox.name;
      return `Box: ${parentDisplayName}`;
    }
    const room = rooms.find(r => r.id === box.roomId);
    return room ? `Room: ${room.name}` : 'Unassigned';
  };

  const getDisplayName = (box: Box): string => {
    if (box.parentId) {
      return box.name; // It's a nested box, just show its name
    }
    // It's a top-level box, show owner
    return box.name;
  }


  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/50 p-4 rounded-lg">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boxes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Owner</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBoxes.length > 0 ? filteredBoxes.map(box => (
                <TableRow key={box.id}>
                  <TableCell className="font-medium">{getDisplayName(box)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[12rem]">
                      {box.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{box.code || '—'}</TableCell>
                  <TableCell>{box.size || '—'}</TableCell>
                  <TableCell>{getLocationName(box)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setBoxToEdit(box); setEditedName(box.name); setEditedTags(box.tags || []); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the box &quot;{box.code ? `${box.code} - ${box.name}` : box.name}&quot; and any boxes or items inside it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(box.id)} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No boxes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!boxToEdit} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Box</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="edit-box-name">Name / Owner</Label>
                  <div className='mt-1'>
                    {boxToEdit?.parentId ? (
                      <Input
                        id="edit-box-name"
                        value={editedName}
                        onChange={e => setEditedName(e.target.value)}
                      />
                    ) : (
                      <OwnerSelect selectedOwner={editedName} onChange={setEditedName} />
                    )}
                  </div>
                </div>
                {boxToEdit && !boxToEdit.parentId && (
                  <div>
                    <Label>Tags</Label>
                    <div className="mt-1">
                      <TagSelect selectedTags={editedTags} onChange={setEditedTags} allowCreation={false} />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBoxToEdit(null)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
      );
}

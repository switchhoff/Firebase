'use client';

import { useState, useTransition, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { deleteRoom, updateRoom } from '@/app/actions';
import type { Room } from '@/lib/types';
import { Trash2, Pencil } from 'lucide-react';

interface RoomsSettingsFormProps {
  rooms: Room[];
}

export function RoomsSettingsForm({ rooms: initialRooms }: RoomsSettingsFormProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  const handleDelete = (roomId: string) => {
    startTransition(async () => {
      await deleteRoom(roomId);
      setRooms(rooms.filter(r => r.id !== roomId));
      toast({ title: 'Room deleted' });
    });
  };

  const handleEdit = () => {
    if (!roomToEdit || !editedName.trim()) return;

    startTransition(async () => {
      await updateRoom(roomToEdit.id, editedName.trim());
      setRooms(rooms.map(r => r.id === roomToEdit.id ? { ...r, name: editedName.trim() } : r));
      toast({ title: 'Room name updated' });
      setRoomToEdit(null);
      setEditedName('');
    });
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Name</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length > 0 ? rooms.map(room => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setRoomToEdit(room); setEditedName(room.name); }}>
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
                          This action cannot be undone. This will permanently delete the room &quot;{room.name}&quot; and all boxes inside it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(room.id)} disabled={isPending}>
                           {isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No rooms found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!roomToEdit} onOpenChange={() => setRoomToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Name</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <div className="py-4">
              <Label htmlFor="edit-room-name">Name</Label>
              <Input
                id="edit-room-name"
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoomToEdit(null)}>Cancel</Button>
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

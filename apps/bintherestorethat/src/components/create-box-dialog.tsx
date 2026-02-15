'use client';

import { useState, useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus } from 'lucide-react';
import type { Room } from '@/lib/types';
import { addBox } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { TagSelect } from './tag-select';
import { OwnerSelect } from './owner-select';

interface CreateBoxDialogProps {
  rooms: Room[];
  defaultRoomId?: string;
  parentId?: string | null;
  trigger?: React.ReactNode;
}

export function CreateBoxDialog({ rooms, defaultRoomId, parentId, trigger }: CreateBoxDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const { toast } = useToast();

  const handleAction = (formData: FormData) => {
    if (parentId) {
      formData.set('parentId', parentId);
    } else { // Top-level box
      if (!selectedOwner) {
        toast({ title: 'Error', description: 'An owner is required for top-level boxes.', variant: 'destructive' });
        return;
      }
      formData.set('name', selectedOwner);
    }

    selectedTags.forEach(tag => {
      formData.append('tags', tag);
    });

    startTransition(() => {
      addBox(formData).then((result) => {
        if (result?.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: 'Success', description: 'New box created.' });
          setOpen(false);
        }
      });
    });
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      formRef.current?.reset();
      setSelectedTags([]);
      setSelectedOwner('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Box
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={handleAction}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5"/>
                Create a new box
            </DialogTitle>
            <DialogDescription>
              {parentId ? "Create a new box inside the current box." : "Assign an owner to your new box and place it in a room."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {parentId ? 'Name' : 'Owner'}
              </Label>
              <div className="col-span-3">
                {parentId ? (
                  <Input id="name" name="name" placeholder="e.g. Winter Clothes" required />
                ) : (
                  <OwnerSelect selectedOwner={selectedOwner} onChange={setSelectedOwner} />
                )}
              </div>
            </div>
             {!parentId && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="size" className="text-right">
                    Size
                  </Label>
                  <Select name="size" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Small">Small</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                      <SelectItem value="X-Large">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tags" className="text-right">
                    Tags
                  </Label>
                  <div className="col-span-3">
                    <TagSelect selectedTags={selectedTags} onChange={setSelectedTags} />
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomId" className="text-right">
                Room
              </Label>
              <Select name="roomId" defaultValue={defaultRoomId} required>
                <SelectTrigger className="col-span-3" disabled={!!parentId}>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Box'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

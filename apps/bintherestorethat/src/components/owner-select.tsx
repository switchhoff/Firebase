'use client';

import { useState, useEffect, useTransition } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { getOwners, addOwner } from '@/app/actions';
import type { Owner } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface OwnerSelectProps {
  selectedOwner: string;
  onChange: (owner: string) => void;
  allowCreation?: boolean;
}

export function OwnerSelect({ selectedOwner, onChange, allowCreation = true }: OwnerSelectProps) {
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (popoverOpen) {
      getOwners().then(setAllOwners);
    }
  }, [popoverOpen]);

  const handleSelectOwner = (ownerName: string) => {
    onChange(ownerName);
    setPopoverOpen(false);
  };

  const handleAddOwner = () => {
    const ownerName = newOwnerName.trim();
    if (!ownerName) return;

    // Don't add if it already exists
    if (allOwners.some(o => o.name.toLowerCase() === ownerName.toLowerCase())) {
      onChange(allOwners.find(o => o.name.toLowerCase() === ownerName.toLowerCase())!.name);
      setPopoverOpen(false);
      setNewOwnerName('');
      return;
    }

    startTransition(async () => {
      const result = await addOwner(ownerName);
      if ('id' in result) {
        setAllOwners(prev => [...prev, result]);
        onChange(result.name);
        setNewOwnerName('');
        toast({ title: 'Owner added' });
        setPopoverOpen(false);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {selectedOwner || 'Select an owner...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search or create owner..."
            value={newOwnerName}
            onValueChange={setNewOwnerName}
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm">
              {allowCreation ? (
                !newOwnerName ? (
                  <p className="text-muted-foreground">Type to create a new owner.</p>
                ) : (
                  <Button
                    className="w-full justify-start pl-2"
                    variant="ghost"
                    onClick={handleAddOwner}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create &quot;{newOwnerName}&quot;
                  </Button>
                )
              ) : (
                "No owners found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {allOwners.sort((a, b) => a.name.localeCompare(b.name)).map(owner => (
                <CommandItem
                  key={owner.id}
                  onSelect={() => handleSelectOwner(owner.name)}
                  className="flex justify-between"
                >
                  <span>{owner.name}</span>
                  {selectedOwner === owner.name && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

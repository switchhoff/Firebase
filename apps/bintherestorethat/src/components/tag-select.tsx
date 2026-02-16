'use client';

import { useState, useEffect, useTransition } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check } from 'lucide-react';
import { getTags, addTag } from '@/app/actions';
import type { Tag } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface TagSelectProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allowCreation?: boolean;
}

export function TagSelect({ selectedTags, onChange, allowCreation = true }: TagSelectProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (popoverOpen) {
      getTags().then(setAllTags);
    }
  }, [popoverOpen]);

  const handleToggleTag = (tagName: string) => {
    const newSelectedTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];
    onChange(newSelectedTags);
  };

  const handleAddTag = () => {
    const tagName = search.trim();
    if (!tagName) return;

    // Don't add if it already exists
    if (allTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
      if (!selectedTags.includes(tagName)) {
        onChange([...selectedTags, tagName]);
      }
      setSearch('');
      return;
    }

    if (!allowCreation) {
      toast({ title: 'Cannot create new tags here', description: 'New tags can only be created from the main dashboard.', variant: 'default' });
      return;
    }

    startTransition(async () => {
      const result = await addTag(tagName);
      if ('id' in result) {
        if (!allTags.some(t => t.id === result.id)) {
          setAllTags([...allTags, result]);
        }
        if (!selectedTags.includes(result.name)) {
          onChange([...selectedTags, result.name]);
        }
        setSearch('');
        toast({ title: 'Tag added' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal h-auto min-h-10">
          <div className="flex gap-1 flex-wrap">
            {selectedTags.length > 0 ? (
              selectedTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)
            ) : (
              'Select tags...'
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search or create tags..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm">
              {allowCreation ? (
                !search ? (
                  <p className="text-muted-foreground">Type to create a new tag.</p>
                ) : (
                  <Button
                    className="w-full justify-start pl-2"
                    variant="ghost"
                    onClick={handleAddTag}
                    disabled={isPending}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create &quot;{search}&quot;
                  </Button>
                )
              ) : (
                "No tags found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {allTags.sort((a, b) => a.name.localeCompare(b.name)).map(tag => (
                <CommandItem
                  key={tag.id}
                  onSelect={() => handleToggleTag(tag.name)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedTags.includes(tag.name)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <span>{tag.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

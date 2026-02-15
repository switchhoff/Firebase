
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import type { Box } from '@/lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';

interface QRCodeDialogProps {
  box: Box;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeDialog({ box, open, onOpenChange }: QRCodeDialogProps) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(`${window.location.origin}/box/${box.id}`);
    }
  }, [open, box.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code for Box &quot;{box.code}&quot;</DialogTitle>
          <DialogDescription>
            Print and stick this on your box for easy scanning.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-6 border rounded-lg bg-white flex flex-col items-center gap-4 printable-area">
            <h3 className="text-lg font-semibold text-center text-black">{box.code}</h3>
            {url && <QRCodeCanvas value={url} size={200} level="H" bgColor="#ffffff" fgColor="#000000" />}
          </div>
          <div className="w-full space-y-2">
             <div className="relative w-full">
                <Input value={url} readOnly className="pr-10" />
                <Button size="icon" variant="ghost" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Anyone with this link or QR code can view the box contents.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

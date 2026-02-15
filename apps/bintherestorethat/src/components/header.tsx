
import { PackageSearch, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <PackageSearch className="h-6 w-6 text-primary" />
            <span className="font-headline">Bin There, Store That</span>
          </Link>
          <nav>
            <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

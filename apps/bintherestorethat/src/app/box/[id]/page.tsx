
import { getBoxWithRoom, getBoxes, getItems } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Package, Warehouse, Box as BoxIcon, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function BoxPage({ params }: { params: { id: string } }) {
  const boxDataPromise = getBoxWithRoom(params.id);
  const allBoxesPromise = getBoxes();
  const allItemsPromise = getItems();

  const [data, allBoxes, allItems] = await Promise.all([boxDataPromise, allBoxesPromise, allItemsPromise]);

  if (!data) {
    notFound();
  }

  const { box, roomName } = data;

  const directItems = allItems.filter(item => item.boxId === box.id);
  const childBoxes = allBoxes.filter(b => b.parentId === box.id);

  const countAllItemsRecursive = (startBoxId: string): number => {
    let count = allItems.filter(i => i.boxId === startBoxId).length;
    const childrenOfStartBox = allBoxes.filter(b => b.parentId === startBoxId);
    for (const child of childrenOfStartBox) {
        count += countAllItemsRecursive(child.id);
    }
    return count;
  };
  const totalItems = countAllItemsRecursive(box.id);

  const countAllChildBoxesRecursive = (startBoxId: string): number => {
      const childrenOfStartBox = allBoxes.filter(b => b.parentId === startBoxId);
      let count = childrenOfStartBox.length;
       for (const child of childrenOfStartBox) {
          count += countAllChildBoxesRecursive(child.id);
      }
      return count;
  };
  const totalChildBoxes = countAllChildBoxesRecursive(box.id);

  const descriptionParts = [];
  if (totalItems > 0) {
    descriptionParts.push(totalItems === 1 ? '1 item' : `${totalItems} items`);
  }
  if (totalChildBoxes > 0) {
    descriptionParts.push(totalChildBoxes === 1 ? '1 nested box' : `${totalChildBoxes} nested boxes`);
  }
  
  const description = descriptionParts.length > 0 ? `Contains ${descriptionParts.join(' and ')}` : 'This box is empty.';


  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
                <Warehouse className="h-4 w-4" />
                <span className="text-sm font-medium">{roomName}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-lg">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-headline">{box.code}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            {box.tags && box.tags.length > 0 && !box.parentId && (
              <div className="pt-4 flex flex-wrap gap-2">
                {box.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {directItems.length > 0 && (
                <div className='mb-6'>
                    <h3 className="font-semibold mb-4 text-lg">Items in this box:</h3>
                    <ul className="space-y-3">
                        {directItems.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 p-3 bg-secondary rounded-md">
                            <Tag className="h-5 w-5 text-primary/80" />
                            <span className="font-medium">{item.name}</span>
                        </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {childBoxes.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-4 text-lg">Nested Boxes:</h3>
                    <div className="space-y-4">
                        {childBoxes.map(childBox => {
                            const itemsInChildBox = allItems.filter(item => item.boxId === childBox.id);
                            return (
                                <Card key={childBox.id} className="bg-secondary/50">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <BoxIcon className="h-5 w-5 text-primary"/>
                                            {childBox.name}
                                        </CardTitle>
                                        <CardDescription>{itemsInChildBox.length} item(s)</CardDescription>
                                    </CardHeader>
                                    {itemsInChildBox.length > 0 && (
                                        <CardContent className="p-4 pt-2">
                                            <ul className="space-y-2">
                                                {itemsInChildBox.map(item => (
                                                    <li key={item.id} className="flex items-center gap-2 text-sm pl-1">
                                                        <Tag className="h-4 w-4 text-primary/60" />
                                                        <span>{item.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

             {directItems.length === 0 && childBoxes.length === 0 && (
              <p className="text-muted-foreground text-center py-4">This box is empty.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

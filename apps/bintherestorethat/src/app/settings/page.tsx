
import Header from '@/components/header';
import { SettingsForm } from '@/components/settings-form';
import { RoomsSettingsForm } from '@/components/rooms-settings-form';
import { getBoxes, getRooms } from '@/app/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
  const boxes = await getBoxes();
  const rooms = await getRooms();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight font-headline">Settings</h1>
            <p className="text-muted-foreground">Manage your rooms and boxes.</p>
        </div>
        <Tabs defaultValue="rooms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="boxes">Boxes</TabsTrigger>
            </TabsList>
            <TabsContent value="rooms" className="mt-6">
                <RoomsSettingsForm rooms={rooms} />
            </TabsContent>
            <TabsContent value="boxes" className="mt-6">
                <SettingsForm boxes={boxes} rooms={rooms} />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

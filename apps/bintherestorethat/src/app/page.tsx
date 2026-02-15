import Header from '@/components/header';
import Dashboard from '@/components/dashboard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <Dashboard />
      </main>
    </div>
  );
}

import dynamic from 'next/dynamic';
const MapClient = dynamic(() => import('@/components/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="text-center">
        <p className="text-gray-400 text-sm tracking-wide font-medium">Loading map…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <MapClient />
    </main>
  );
}

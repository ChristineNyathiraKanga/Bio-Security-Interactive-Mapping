import dynamic from 'next/dynamic';
import Image from 'next/image';
const MapClient = dynamic(() => import('@/components/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white">

        </div>
        <p className="text-gray-400 text-sm">Loading map...</p>
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

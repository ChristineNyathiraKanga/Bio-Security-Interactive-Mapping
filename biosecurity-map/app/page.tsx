import dynamic from 'next/dynamic';
import Image from 'next/image';

const MapClient = dynamic(() => import('@/components/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 gap-4">
      <Image
        src="/logo.jpg"
        alt="Victory Farms"
        width={160}
        height={160}
        priority
        className="rounded-full"
      />
      <p className="text-gray-300 text-base tracking-wide font-medium">Loading map…</p>
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

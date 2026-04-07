import dynamic from 'next/dynamic';
import Image from 'next/image';

const MapClient = dynamic(() => import('@/components/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gray-100">
      <div className="absolute top-0 left-0 right-0 z-10 h-16">
        <div className="flex items-center gap-3 px-3 py-2 h-full">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0 bg-white">
              <Image
                src="/logo.jpg"
                alt="Victory Farms"
                width={48}
                height={48}
                priority
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-[18px] text-gray-800 leading-tight tracking-wide">Victory Farms</h1>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] leading-tight mt-0.5">Biosecurity Site Map</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin" />
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

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AnalysisNavigationProps {
  sessionId: string;
}

export default function AnalysisNavigation({ sessionId }: AnalysisNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const analysisTypes = [
    { id: 'lap-comparison', name: 'Lap Comparison', path: '/analysis/lap-comparison' },
    { id: 'racing-line', name: 'Racing Line', path: '/analysis/racing-line' },
    { id: 'braking-points', name: 'Braking Points', path: '/analysis/braking-points' },
    { id: 'tire-performance', name: 'Tire Performance', path: '/analysis/tire-performance' },
    { id: 'sector-analysis', name: 'Sector Analysis', path: '/analysis/sector-analysis' },
  ];
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Analysis Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {analysisTypes.map((type) => {
          const isActive = pathname === type.path;
          return (
            <Link 
              key={type.id}
              href={`${type.path}?sessionId=${sessionId}`}
              className={`block text-center py-2 px-4 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {type.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

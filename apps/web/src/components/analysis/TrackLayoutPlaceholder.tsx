'use client';

export default function TrackLayoutPlaceholder() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-gray-600 absolute">
        <p className="text-center">Track layout will be displayed here</p>
        <p className="text-center text-sm">Upload actual track layouts for a better experience</p>
      </div>
      
      {/* Simple track outline placeholder */}
      <svg
        width="80%"
        height="80%"
        viewBox="0 0 800 500"
        className="opacity-30"
      >
        {/* Simple oval track shape */}
        <path
          d="M200,100 C350,50 450,50 600,100 C700,150 700,250 600,300 C450,350 350,350 200,300 C100,250 100,150 200,100 Z"
          fill="none"
          stroke="white"
          strokeWidth="20"
        />
        
        {/* Start/finish line */}
        <line
          x1="400"
          y1="95"
          x2="400"
          y2="120"
          stroke="white"
          strokeWidth="10"
          strokeDasharray="5,5"
        />
        
        {/* Corner markers */}
        <text x="210" y="120" fill="white" fontSize="24">1</text>
        <text x="590" y="120" fill="white" fontSize="24">2</text>
        <text x="590" y="280" fill="white" fontSize="24">3</text>
        <text x="210" y="280" fill="white" fontSize="24">4</text>
      </svg>
    </div>
  );
}

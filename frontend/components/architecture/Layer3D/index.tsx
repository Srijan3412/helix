'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Architecture3DProps } from './types';
import { Loader2 } from 'lucide-react';

const Architecture3DCanvasLazy = dynamic(
  () => import('./Architecture3DCanvas').then((mod) => mod.Architecture3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full min-h-[580px] bg-[#071115] rounded-xl flex flex-col items-center justify-center border border-[rgba(120,200,210,0.14)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#00D2FF] animate-spin" />
          <span className="text-xs font-mono text-[#9FB0B3]">Initializing 3D Architecture Canvas...</span>
        </div>
      </div>
    ),
  }
);

export const Architecture3DViewer: React.FC<Architecture3DProps> = (props) => {
  return <Architecture3DCanvasLazy {...props} />;
};

export * from './types';
export { LAYERS_3D_CONFIG } from './Architecture3DCanvas';

import type { ReactNode } from 'react';

interface RoomCanvasProps {
  children: ReactNode;
}

export function RoomCanvas({ children }: RoomCanvasProps) {
  return (
    <div className="relative z-10 flex-1 overflow-y-auto p-4 pb-52 space-y-4 max-w-2xl mx-auto w-full">
      {children}
    </div>
  );
}

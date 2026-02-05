import type { ReactNode } from 'react';

interface BaseWidgetProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  showModal?: boolean;
  onModalOpen?: () => void;
  modalContent?: ReactNode;
}

export function BaseWidget({
  title,
  icon,
  children,
  showModal,
  onModalOpen,
  modalContent,
}: BaseWidgetProps) {
  return (
    <>
      <div
        className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors cursor-pointer"
        onClick={onModalOpen}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="text-cyan-400">{icon}</div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {children}
      </div>

      {showModal && modalContent}
    </>
  );
}

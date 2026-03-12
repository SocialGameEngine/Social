interface TabNavigationProps {
  activeTab: 'host' | 'community';
  onTabChange: (tab: 'host' | 'community') => void;
  className?: string;
}

export function TabNavigation({ activeTab, onTabChange, className }: TabNavigationProps) {
  const getTabClasses = (isActive: boolean) => `
    py-4 px-1 border-b-2 font-medium text-sm transition-colors
    ${isActive 
      ? "border-cyan-500 text-cyan-400" 
      : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
    }
  `;

  return (
    <div className={`border-b border-slate-700 ${className || ''}`}>
      <nav className="flex space-x-8 px-4" aria-label="Tabs">
        <button
          onClick={() => onTabChange('host')}
          className={getTabClasses(activeTab === 'host')}
        >
          Host
        </button>
        <button
          onClick={() => onTabChange('community')}
          className={getTabClasses(activeTab === 'community')}
        >
          Community
        </button>
      </nav>
    </div>
  );
}

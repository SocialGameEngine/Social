import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { EmptyState } from '../../../../shared/components/EmptyState';
import type { Interaction } from '../../../../shared/types';

interface AllInteractionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
  onInteractionSelect: (interaction: Interaction) => void;
}

export function AllInteractionsBottomSheet({
  isOpen,
  onClose,
  interactions,
  onInteractionSelect,
}: AllInteractionsBottomSheetProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'polls' | 'topics' | 'prompts' | 'fibbage'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter interactions based on type and search
  const filteredInteractions = useMemo(() => {
    let filtered = interactions;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(interaction => {
        switch (activeFilter) {
          case 'polls': return interaction.type === 'poll';
          case 'topics': return interaction.type === 'topic';
          case 'prompts': return interaction.type === 'prompt';
          case 'fibbage': return interaction.type === 'headline_fibbage';
          default: return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(interaction =>
        interaction.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interaction.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [interactions, activeFilter, searchQuery]);

  const filterOptions = [
    { key: 'all', label: 'All', count: interactions.length },
    { key: 'polls', label: 'Polls', count: interactions.filter(i => i.type === 'poll').length },
    { key: 'topics', label: 'Topics', count: interactions.filter(i => i.type === 'topic').length },
    { key: 'prompts', label: 'Prompts', count: interactions.filter(i => i.type === 'prompt').length },
    { key: 'fibbage', label: 'Fibbage', count: interactions.filter(i => i.type === 'headline_fibbage').length },
  ] as const;

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'poll': return '📊';
      case 'topic': return '💬';
      case 'prompt': return '💡';
      case 'headline_fibbage': return '🎭';
      default: return '❓';
    }
  };

  const getInteractionTypeLabel = (type: string) => {
    switch (type) {
      case 'poll': return 'Poll';
      case 'topic': return 'Topic';
      case 'prompt': return 'Prompt';
      case 'headline_fibbage': return 'Fibbage';
      default: return 'Interaction';
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="All Interactions">
      <div className="px-6 pt-4 pb-6">
        {/* Filter chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filterOptions.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 rounded-full capitalize transition-colors whitespace-nowrap ${
                activeFilter === key
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search interactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredInteractions.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No interactions found"
              description={searchQuery ? 'Try adjusting your search terms or filters' : 'No interactions match the current filter'}
            />
          ) : (
            filteredInteractions.map((interaction) => (
              <motion.button
                key={interaction.id}
                onClick={() => onInteractionSelect(interaction)}
                className="w-full text-left"
                whileTap={{ scale: 0.98 }}
              >
                <div className="chaos-interaction-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                          {getInteractionTypeLabel(interaction.type)}
                        </span>
                        {/* TODO: Add participant count when available in Interaction type */}
                      </div>
                      <div className="font-bold text-lg mb-1">
                        {interaction.question}
                      </div>
                      {interaction.description && (
                        <div className="text-sm text-slate-400 line-clamp-2">
                          {interaction.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

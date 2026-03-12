import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@social/ui';
import { useTheme } from '../../../../shared/providers/ThemeProvider';
import { interactionService } from '../../../../services/interactionService';
import type { Interaction, TopicResponseWithUpvotes, TopicSortBy } from '../../../../domain/types/interaction.types';

interface TopicCardProps {
  interaction: Interaction;
  membershipId: string;
  onClose?: () => void;
}

export function TopicCard({ interaction, membershipId, onClose }: TopicCardProps) {
  const { isDark } = useTheme();
  const [responses, setResponses] = useState<TopicResponseWithUpvotes[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<TopicSortBy>(interaction.sortBy || 'newest');
  const [isLoading, setIsLoading] = useState(true);

  const loadResponses = useCallback(async () => {
    try {
      const data = await interactionService.getTopicResponses(interaction.id, membershipId, sortBy);
      setResponses(data);
    } catch (error) {
      console.error('Failed to load topic responses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [interaction.id, membershipId, sortBy]);

  useEffect(() => {
    loadResponses();
    const interval = setInterval(loadResponses, 3000);
    return () => clearInterval(interval);
  }, [loadResponses]);

  const handleSubmitResponse = async () => {
    if (!newResponse.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await interactionService.submitResponse(interaction.id, membershipId, newResponse.trim());
      setNewResponse('');
      await loadResponses();
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      alert(error.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUpvote = async (responseId: string) => {
    try {
      await interactionService.toggleUpvote(responseId, membershipId);
      await loadResponses();
    } catch (error: any) {
      console.error('Failed to toggle upvote:', error);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('Delete your response?')) return;
    
    try {
      await interactionService.deleteResponse(responseId);
      await loadResponses();
    } catch (error: any) {
      console.error('Failed to delete response:', error);
      alert(error.message || 'Failed to delete response');
    }
  };

  const myResponse = responses.find(r => r.membershipId === membershipId);
  const isClosed = interaction.status === 'closed';

  return (
    <Card className="flex flex-col gap-4" isDark={isDark}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💬</span>
            <h3 className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
              {interaction.question}
            </h3>
          </div>
          {interaction.description && (
            <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {interaction.description}
            </p>
          )}
          <div className={`flex items-center gap-3 mt-2 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>{responses.length} response{responses.length !== 1 ? 's' : ''}</span>
            {isClosed && <span className="font-bold text-red-500">CLOSED</span>}
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Sort Toggle */}
      <div className="flex gap-2">
        <Button
          variant={sortBy === 'newest' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSortBy('newest')}
        >
          Newest
        </Button>
        <Button
          variant={sortBy === 'upvotes' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSortBy('upvotes')}
        >
          Most Upvoted
        </Button>
      </div>

      {/* Responses List */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className={`text-center py-8 text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Loading responses...
          </div>
        ) : responses.length === 0 ? (
          <div className={`text-center py-8 text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            No responses yet. Be the first to share your thoughts!
          </div>
        ) : (
          responses.map((response) => (
            <div
              key={response.id}
              className={`rounded-lg border p-3 ${
                !isDark 
                  ? 'border-slate-200 bg-slate-50' 
                  : 'border-slate-600 bg-slate-700'
              } ${response.membershipId === membershipId ? 'ring-2 ring-cyan-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                      {response.playerName || 'Anonymous'}
                    </span>
                    {response.membershipId === membershipId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-500 text-white font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${!isDark ? 'text-slate-900' : 'text-white'}`}>
                    {response.text}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleUpvote(response.id)}
                    disabled={response.membershipId === membershipId}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      response.hasUpvoted
                        ? 'bg-pink-500 text-white'
                        : !isDark
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    } ${response.membershipId === membershipId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>{response.hasUpvoted ? '❤️' : '🤍'}</span>
                    <span className="text-xs font-bold">{response.upvoteCount}</span>
                  </button>
                  {response.membershipId === membershipId && !isClosed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteResponse(response.id)}
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fixed Response Input */}
      {!isClosed && (
        <div className={`sticky bottom-0 pt-3 border-t ${!isDark ? 'border-slate-200 bg-white' : 'border-slate-600 bg-slate-800'}`}>
          {myResponse ? (
            <div className={`text-sm text-center py-2 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              You've already responded. You can delete your response and submit a new one.
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitResponse()}
                placeholder="Share your thoughts..."
                maxLength={200}
                disabled={isSubmitting}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  !isDark
                    ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                    : 'border-slate-600 bg-slate-700 text-white placeholder-slate-500'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              <Button
                onClick={handleSubmitResponse}
                disabled={!newResponse.trim() || isSubmitting}
                isLoading={isSubmitting}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

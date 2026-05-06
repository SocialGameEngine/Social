import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/providers/AuthContext';
import { 
  useApprovedSocialeBanter, 
  useSubmitBanter, 
  useUpvoteBanter, 
  useRemoveBanterUpvote,
  useBanterUpvoteStatus,
  useCurrentSocialite,
  usePendingSocialeBanter,
  useModerateBanter,
  useUserBanterUpvotes,
} from '../../../features/sociale/hooks';
import type { SocialeBanterStatus } from '../../../features/sociale/hooks';
import { triggerHaptic } from '../../../shared/utils/sessionUtils';
import type { Sociale } from '../../../domain/types/sociale.types';

interface BanterChannelProps {
  sociale: Sociale;
  isHost?: boolean;
  className?: string;
}

const BANTER_LIMIT = 280;

export function BanterChannel({ sociale, isHost = false, className = '' }: BanterChannelProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: currentSocialite } = useCurrentSocialite(sociale.id, user?.id);
  const { data: approvedBanter = [], isLoading } = useApprovedSocialeBanter(sociale.id);
  const { data: pendingBanter = [] } = usePendingSocialeBanter(sociale.id);
  const { data: userUpvotes = [] } = useUserBanterUpvotes(currentSocialite?.id);
  const submitBanterMutation = useSubmitBanter();
  const upvoteBanterMutation = useUpvoteBanter();
  const removeUpvoteMutation = useRemoveBanterUpvote();
  const moderateBanterMutation = useModerateBanter();

  const displayName = currentSocialite?.displayName || user?.user_metadata?.display_name || 'Anonymous';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [approvedBanter]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async () => {
    if (!message.trim() || !currentSocialite || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitBanterMutation.mutateAsync({
        socialeId: sociale.id,
        socialiteId: currentSocialite.id,
        membershipId: currentSocialite.membershipId,
        displayName,
        content: message.trim(),
      });

      setMessage('');
      triggerHaptic('success');
    } catch (error) {
      triggerHaptic('error');
      console.error('Failed to submit banter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (banterId: string) => {
    if (!currentSocialite) return;

    try {
      // Check if user has already upvoted this banter
      const isUpvoted = userUpvotes.some(upvote => upvote.banterId === banterId);
      
      if (isUpvoted) {
        await removeUpvoteMutation.mutateAsync({ banterId, socialiteId: currentSocialite.id });
      } else {
        await upvoteBanterMutation.mutateAsync({ banterId, socialiteId: currentSocialite.id });
      }
      triggerHaptic('light');
    } catch (error) {
      triggerHaptic('error');
      console.error('Failed to toggle upvote:', error);
    }
  };

  const handleModerate = async (banterId: string, status: SocialeBanterStatus) => {
    if (!user?.id) return;

    try {
      await moderateBanterMutation.mutateAsync({
        banterId,
        status,
        moderatedBy: user.id,
      });
      triggerHaptic('success');
    } catch (error) {
      triggerHaptic('error');
      console.error('Failed to moderate banter:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-3">
        <AnimatePresence initial={false}>
          {approvedBanter.map((banter) => (
            <motion.div
              key={banter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">
                      {banter.displayName}
                    </span>
                    <span className="text-white/40 text-xs">
                      {formatTime(banter.createdAt)}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed break-words">
                    {banter.content}
                  </p>
                </div>
                
                {/* Upvote Button */}
                <button
                  onClick={() => handleUpvote(banter.id)}
                  disabled={!currentSocialite}
                  className={`
                    flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all
                    ${currentSocialite 
                      ? 'hover:bg-white/10 active:scale-95' 
                      : 'opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-lg">👍</span>
                  <span className="text-xs text-white/70 font-medium">
                    {banter.upvoteCount}
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Host Moderation Panel */}
        {isHost && pendingBanter.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/30 mt-4"
          >
            <h3 className="text-yellow-100 font-semibold text-sm mb-3">Pending Approval ({pendingBanter.length})</h3>
            <div className="space-y-2">
              {pendingBanter.slice(0, 3).map((banter) => (
                <div key={banter.id} className="bg-black/20 rounded-lg p-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-yellow-100 font-medium text-xs">
                      {banter.displayName}
                    </span>
                    <span className="text-yellow-200/60 text-xs">
                      {formatTime(banter.createdAt)}
                    </span>
                  </div>
                  <p className="text-white/80 text-xs mb-2">{banter.content}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerate(banter.id, 'approved')}
                      className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-100 text-xs rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleModerate(banter.id, 'rejected')}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs rounded transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleModerate(banter.id, 'on_tv')}
                      className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 text-xs rounded transition-colors"
                    >
                      On TV
                    </button>
                  </div>
                </div>
              ))}
              {pendingBanter.length > 3 && (
                <p className="text-yellow-200/60 text-xs text-center">
                  ... and {pendingBanter.length - 3} more
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, BANTER_LIMIT))}
              placeholder="Share your thoughts..."
              disabled={!currentSocialite || isSubmitting}
              className={`
                w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                text-white placeholder-white/50 text-sm resize-none overflow-hidden
                focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all
                ${!currentSocialite ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-white/40">
              {message.length}/{BANTER_LIMIT}
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || !currentSocialite || isSubmitting}
            className={`
              px-4 py-2 rounded-xl font-medium text-sm transition-all
              ${message.trim() && currentSocialite && !isSubmitting
                ? 'bg-white text-black hover:bg-white/90 active:scale-95'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {!currentSocialite && (
          <p className="text-white/40 text-xs mt-2 text-center">
            Join the Sociale to participate in banter
          </p>
        )}
      </div>
    </div>
  );
}

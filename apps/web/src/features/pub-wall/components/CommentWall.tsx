import { useState } from 'react';
import { Card } from '@social/ui';
import { Button } from '@social/ui';
import { TextAreaField } from '@social/ui';
import type { Answer } from '@social/db';

interface CommentWallProps {
  answers: Answer[];
  onSubmit: (content: string) => Promise<void>;
  venueName: string;
}

export function CommentWall({ answers, onSubmit, venueName }: CommentWallProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(commentText);
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Submit Comment Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Share Your Thoughts at {venueName}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextAreaField
            label="Your Comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What's on your mind? Share a funny thought, joke, or observation..."
            maxLength={280}
            rows={4}
            required
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {commentText.length} / 280
            </span>
            <Button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="px-6"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Recent Comments ({answers.length})
        </h3>

        {answers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 text-lg">
              No comments yet. Be the first to share your thoughts!
            </p>
          </Card>
        ) : (
          answers.map((answer) => (
            <Card key={answer.id} className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      ?
                    </span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">Anonymous</span>
                    <span className="text-gray-500 text-sm">
                      {answer.created_at ? formatTime(answer.created_at) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {answer.masked ? '[Content moderated]' : answer.text}
                  </p>
                  {/* Note: answers don't have vote_count in current schema */}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


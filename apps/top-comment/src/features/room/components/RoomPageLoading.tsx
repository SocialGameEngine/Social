import { useEffect } from 'react';
import { useRoomPage } from '../hooks/useRoomPage';
import { useAuth } from '../../../shared/providers/AuthContext';
import { useNavigate } from 'react-router-dom';

export function RoomPageLoading() {
  const { room, memberships } = useRoomPage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check if user has a membership in this room
  const myMembership = user ? memberships?.find(m => m.userId === user.id) : null;
  const isHost = room?.hostUid === user?.id;
  const hasMembership = !!myMembership || isHost;

  // Redirect to join page if user has no membership (after loading completes)
  useEffect(() => {
    if (!authLoading && user && room && !hasMembership) {
      // Don't redirect if memberships haven't been loaded yet
      if (memberships && memberships.length === 0) {
        // Wait a bit for the async fetch to complete
        const timer = setTimeout(() => {}, 2000);
        return () => clearTimeout(timer);
      }
      
      navigate(`/join?code=${room?.code}`, { replace: true });
    }
  }, [authLoading, user, room, hasMembership, navigate, memberships]);

  // Show loading while checking membership
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-pulse">Joining room...</div>
    </div>
  );
}

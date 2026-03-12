interface SubmitQuestionButtonProps {
  onClick: () => void;
  isMember?: boolean;
  onJoinRoom?: () => void;
}

export function SubmitQuestionButton({ onClick, isMember = true, onJoinRoom }: SubmitQuestionButtonProps) {
  const handleClick = () => {
    if (isMember) {
      onClick();
    } else if (onJoinRoom) {
      onJoinRoom();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors
        ${isMember 
          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20' 
          : 'text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
        }
      `}
      title={isMember ? undefined : "Join this room to submit questions"}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {isMember ? 'Submit a Question' : 'Join to Ask'}
    </button>
  );
}

import type { Session, RoomMembership } from '../../../../shared/types';

interface LobbyPhaseProps {
  session: Session | null;
  memberships: RoomMembership[] | null;
  onOpenTopics?: () => void;
  onOpenPolls?: () => void;
}

export function LobbyPhase({ session: _session, memberships: _memberships, onOpenTopics, onOpenPolls }: LobbyPhaseProps) {
  const carouselSections = [
    { label: 'Topics!', targetId: 'lobby-topics' },
    { label: 'Polls', targetId: 'lobby-polls' },
  ];
  const carouselStepSeconds = 7;
  const carouselDuration = `${carouselSections.length * carouselStepSeconds}s`;

  return (
    <div className="w-full mb-8 lobby-enter">
      <div className="pt-2">
        <div className="relative rounded-[28px] p-3 overflow-visible">
          <div className="lobby-carousel-shell">
            <div className="lobby-carousel">
              {carouselSections.map((section, index) => (
                <button
                  key={section.label}
                  type="button"
                  className="lobby-carousel-item lobby-carousel-link"
                  style={{
                    animationDelay: `${index * carouselStepSeconds}s`,
                    animationDuration: carouselDuration,
                  }}
                  onClick={() => {
                    const target = document.getElementById(section.targetId);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">{section.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 space-y-12">
        <section id="lobby-topics" className="scroll-mt-24">
          <button
            type="button"
            className="lobby-section-button lobby-section-button--topics"
            onClick={onOpenTopics}
          >
            <h3
              className="lobby-section-title lobby-section-title--topics text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]"
              data-text="Topics!"
            >
              Topics!
            </h3>
          </button>
          <p className="mt-5 text-base sm:text-lg text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
            Explore each topics to see what others has to say about them! If you have anything interesting takes, this will be the perfect place for you to discuss!
          </p>
          <div className="relative mt-6 h-[2px] w-full overflow-hidden rounded-full bg-slate-800/70">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/70 to-transparent blur-[1px]" />
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-fuchsia-500 via-cyan-300 to-pink-500 opacity-70" />
            
          </div>
        </section>

        <section id="lobby-polls" className="scroll-mt-24">
          <button
            type="button"
            className="lobby-section-button lobby-section-button--polls"
            onClick={onOpenPolls}
          >
            <h3 className="lobby-section-title text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
              Polls
            </h3>
          </button>
          <p className="mt-5 text-base sm:text-lg text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
            We have gathered opinoins from around town to see what the majority thinks about these hot takes. Let us know yours!
          </p>
          
        </section>
      </div>
    </div>
  );
}

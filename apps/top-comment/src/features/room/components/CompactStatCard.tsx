import { motion } from 'framer-motion';

interface CompactStatCardProps {
  type: 'top_answerer' | 'fastest_answer' | 'most_upvotes' | 'perfect_round';
  title: string;
  value: string;
  subtitle: string;
  socialiteName?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  index: number;
  totalCards: number;
}

const cardColors = {
  'top_answerer': 'from-yellow-500 to-orange-500',
  'fastest_answer': 'from-blue-500 to-purple-500',
  'most_upvotes': 'from-green-500 to-teal-500',
  'perfect_round': 'from-pink-500 to-rose-500',
};

const cardIcons = {
  'top_answerer': '🏆',
  'fastest_answer': '⚡',
  'most_upvotes': '👍',
  'perfect_round': '💯',
};

export function CompactStatCard({
  type,
  title,
  value,
  subtitle,
  socialiteName,
  icon,
  color,
  isActive,
  index,
  totalCards,
}: CompactStatCardProps) {
  const gradientColor = color || cardColors[type];
  const cardIcon = icon || cardIcons[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0.3, 
        scale: isActive ? 1 : 0.95,
        y: isActive ? 0 : 10
      }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className={`
        relative bg-black/60 backdrop-blur-md rounded-2xl p-4
        border border-white/20 overflow-hidden
        ${isActive ? 'shadow-lg' : ''}
      `}
    >
      {/* Gradient Background */}
      <div className={`
        absolute inset-0 opacity-20
        bg-gradient-to-br ${gradientColor}
      `} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`
              text-2xl
              ${isActive ? 'animate-bounce' : ''}
            `}>
              {cardIcon}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                {title}
              </p>
              <p className="text-lg font-bold text-white">
                {value}
              </p>
            </div>
          </div>
        </div>

        {/* Socialite Info */}
        {socialiteName && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {socialiteName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium text-white/80">
              {socialiteName}
            </span>
          </div>
        )}

        {/* Subtitle */}
        <p className="text-xs text-white/60">
          {subtitle}
        </p>

        {/* Progress Indicator */}
        <div className="flex gap-1 mt-3">
          {[...Array(totalCards)].map((_, i) => (
            <div
              key={i}
              className={`
                h-1 rounded-full flex-1 transition-all duration-300
                ${i === index && isActive
                  ? 'bg-white shadow-sm'
                  : i < index
                  ? 'bg-white/60'
                  : 'bg-white/20'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"
        />
      )}
    </motion.div>
  );
}

interface CompactStatCardsProps {
  cards: Array<{
    type: 'top_answerer' | 'fastest_answer' | 'most_upvotes' | 'perfect_round';
    title: string;
    value: string;
    subtitle: string;
    socialiteName?: string;
    icon?: string;
    color?: string;
  }>;
  activeIndex: number;
}

export function CompactStatCards({ cards, activeIndex }: CompactStatCardsProps) {
  return (
    <div className="space-y-3 p-4">
      {cards.map((card, index) => (
        <CompactStatCard
          key={`${card.type}-${index}`}
          type={card.type}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          socialiteName={card.socialiteName}
          icon={card.icon}
          color={card.color}
          isActive={index === activeIndex}
          index={index}
          totalCards={cards.length}
        />
      ))}
    </div>
  );
}

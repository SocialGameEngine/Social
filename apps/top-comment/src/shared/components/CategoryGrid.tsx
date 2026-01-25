import { useState, useEffect } from "react";
import type { PromptLibrary } from "../promptLibraries";
import type { CategoryGrid as CategoryGridType } from "../utils/categoryGrid";
import { useTheme } from "../providers/ThemeProvider";
import { getActiveCard, getCardCategories, getCardRemainingPrompts, getPromptBonus } from "../utils/categoryGrid";

interface CategoryGridProps {
  libraries: PromptLibrary[];
  categoryGrid: CategoryGridType;
  selectedCategory?: string;
  onSelect?: (categoryId: string, promptIndex: number) => void;
  disabled?: boolean;
  canSelect?: boolean;
  highlightUsed?: boolean;
  roundIndex?: number;
  totalRounds?: number;
}

export function CategoryGrid({
  libraries,
  categoryGrid,
  selectedCategory,
  onSelect,
  canSelect = true,
  highlightUsed = true,
  roundIndex,
  totalRounds,
}: CategoryGridProps) {
  const { isDark } = useTheme();

  // Determine active card and get categories for that card
  const activeCard = getActiveCard(categoryGrid, roundIndex, totalRounds);
  const [currentCard, setCurrentCard] = useState<1 | 2>(1);
  
  // Auto-switch to Card 2 when Card 1 is mostly complete
  useEffect(() => {
    if (activeCard === 2 && currentCard === 1) {
      setCurrentCard(2);
    }
  }, [activeCard, currentCard]);
  
  const cardCategories = getCardCategories(categoryGrid, currentCard);
  const cardCategoryIds = cardCategories.map(cat => cat.id);
  const displayLibraries = libraries.filter(lib => cardCategoryIds.includes(lib.id));
  
  const card1Remaining = getCardRemainingPrompts(categoryGrid, 1);
  const card2Remaining = getCardRemainingPrompts(categoryGrid, 2);
  const canSwitchToCard2 = activeCard === 2;

  return (
    <div className="space-y-4">
      {/* Card Indicator - Only show Card 2 when unlocked */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrentCard(1)}
          disabled={!canSelect}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            currentCard === 1
              ? 'bg-brand-primary text-white'
              : !isDark ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-slate-700 text-cyan-300 hover:bg-slate-600'
          }`}
        >
          Card 1 ({card1Remaining} left)
        </button>
        {canSwitchToCard2 && (
          <button
            onClick={() => setCurrentCard(2)}
            disabled={!canSelect}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              currentCard === 2
                ? 'bg-brand-primary text-white'
                : !isDark ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-slate-700 text-cyan-300 hover:bg-slate-600'
            }`}
          >
            Card 2 ({card2Remaining} left)
          </button>
        )}
      </div>
      
      {/* 3-Column Bingo Grid - 3 categories per card */}
      <div className="grid grid-cols-3 gap-2">
      {displayLibraries.map((library) => {
        const category = categoryGrid.categories.find(c => c.id === library.id);
        const isSelectedCategory = selectedCategory === library.id;
        
        return (
          <div key={library.id} className="flex flex-col gap-2">
            {/* Category Header - Fixed height for alignment */}
            <div className={`text-center p-2 rounded-lg h-[70px] flex flex-col items-center justify-center ${
              !isDark ? 'bg-slate-100' : 'bg-slate-800'
            }`}>
              <div className="text-xl mb-1">{library.emoji}</div>
              <div className={`text-xs font-semibold leading-tight ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                {library.name}
              </div>
            </div>
            
            {/* Dynamic Prompt Cards in Column */}
            {(() => {
              // Calculate unlockedPerCard from session settings (not available here, so calculate from locked tiles)
              // For now, we'll infer it from the grid structure
              const lockedTilesCount = categoryGrid.lockedTiles?.length || 0;
              // If we have locked tiles, we can infer unlockedPerCard from the pattern
              // This is a temporary solution - ideally unlockedPerCard should be passed as a prop
              let unlockedPerCard = 1; // Default fallback
              if (lockedTilesCount === 2) unlockedPerCard = 1; // 1 group, 1 round
              else if (lockedTilesCount === 1) unlockedPerCard = 2; // 1 group, 2 rounds or 2 groups, 1 round
              else if (lockedTilesCount === 0) unlockedPerCard = 3; // 1 group, 3 rounds or 3 groups, 1 round
              
              const tilesPerCategory = Math.ceil(unlockedPerCard / 3);
              
              // Log category selection (throttled by parent component)
              
              return Array.from({ length: tilesPerCategory }, (_, i) => i);
            })().map((promptIndex) => {
              const isUsed = category?.usedPrompts.includes(promptIndex) ?? false;
              const isLocked = categoryGrid.lockedTiles?.some(
                tile => tile.categoryId === library.id && tile.promptIndex === promptIndex
              ) || false;
              const isClickable = canSelect && !isUsed && !isLocked;
              const bonus = getPromptBonus(categoryGrid, library.id, promptIndex);
              const isMultiplier = bonus?.bonusType === 'multiplier';
              
              return (
                <button
                  key={promptIndex}
                  onClick={() => isClickable && onSelect?.(library.id, promptIndex)}
                  disabled={!isClickable}
                  className={`
                    relative rounded-lg p-3 text-center transition-all min-h-[60px] flex flex-col items-center justify-center
                    ${isUsed && highlightUsed ? 'opacity-40 cursor-not-allowed' : ''}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSelectedCategory && !isUsed && !isLocked ? 'ring-2 ring-brand-primary shadow-lg' : ''}
                    ${isClickable ? 'hover:scale-105 hover:shadow-md cursor-pointer' : ''}
                    ${!isDark ? 'bg-white shadow-md' : 'bg-slate-800 shadow-lg'}
                    ${!isClickable && !isUsed && !isLocked ? 'cursor-not-allowed opacity-60' : ''}
                    ${bonus?.revealed && isMultiplier ? 'bg-gradient-to-br from-purple-500 to-pink-500' : ''}
                  `}
                >
                  <div className="text-lg mb-1">{isLocked ? 'ö' : library.emoji}</div>
                  
                  {/* Bonus Display */}
                  {bonus?.revealed ? (
                    <div className={`text-xl font-bold mb-1 ${
                      isMultiplier ? 'text-white' : (isDark ? 'text-yellow-400' : 'text-yellow-600')
                    }`}>
                      {isMultiplier ? '2×' : bonus.bonusValue}
                    </div>
                  ) : (
                    <div className="text-2xl opacity-30 mb-1">?</div>
                  )}
                  
                  <div className={`text-xs font-medium ${
                    isUsed 
                      ? (isDark ? 'text-slate-500' : 'text-slate-400')
                      : (isDark ? 'text-cyan-100' : 'text-slate-900')
                  }`}>
                    {promptIndex + 1}
                  </div>
                  
                  {isUsed && highlightUsed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                      <span className="text-2xl opacity-50">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
      </div>
    </div>
  );
}

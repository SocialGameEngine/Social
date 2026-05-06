// Order round answer phase.
// Players drag items into the correct order using @dnd-kit/sortable.
// Encoded as JSON: string[] (ordered item IDs)

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OrderItem {
  id: string;
  text: string;
}

interface SortableItemProps {
  item: OrderItem;
  index: number;
  isDark: boolean;
}

function SortableItem({ item, index, isDark }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 border select-none ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      } ${isDragging ? 'shadow-2xl ring-2 ring-cyan-500' : ''}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className={`cursor-grab active:cursor-grabbing touch-none p-1 rounded ${
          isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
        }`}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </button>

      <span className={`text-base font-black w-6 text-center ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
        {index + 1}
      </span>

      <span className="flex-1 text-sm font-medium">{item.text}</span>
    </div>
  );
}

interface OrderRoundAnswerProps {
  /** items comes from currentRound.settings.items: { id, text }[] */
  items: OrderItem[];
  prompt: string | null;
  onSubmit: (encoded: string) => void;
  isDark: boolean;
}

export function OrderRoundAnswer({ items: initialItems, prompt, onSubmit, isDark }: OrderRoundAnswerProps) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    onSubmit(JSON.stringify(items.map((i) => i.id)));
  };

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={`text-center text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {prompt}
        </p>
      )}

      <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Drag to arrange in the correct order
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, i) => (
              <SortableItem key={item.id} item={item} index={i} isDark={isDark} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={items.length === 0}
        className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-white font-black py-3 text-sm uppercase tracking-wider transition-colors"
      >
        Submit Order
      </button>
    </div>
  );
}

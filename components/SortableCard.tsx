// components/SortableCard.tsx
'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ICard } from "@/lib/types";

interface SortableCardProps {
  id: string;
  card: ICard;
}

export const SortableCard: React.FC<SortableCardProps> = ({ id, card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white border rounded-lg shadow-sm cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="font-semibold text-lg">{card.type}</div>
      <div className="text-sm text-gray-600">Value: {card.value}</div>
    </div>
  );
};
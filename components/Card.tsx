import { Card as GameCard } from '@/lib/gameLogic';
import React from 'react';

interface CardProps {
  card: GameCard | null;
  visible: boolean;
}

const Card: React.FC<CardProps> = ({ card, visible }) => {
  if (!card) {
    return null;
  }

  return (
    <div className={`w-16 h-24 rounded-lg border-2 border-gray-300 flex items-center justify-center ${visible ? 'bg-white' : 'bg-blue-500'}`}>
      {visible ? (
        <div className="text-center">
          <div className="font-bold">{card.type}</div>
          <div>{card.value}</div>
        </div>
      ) : (
        <div className="text-white font-bold">?</div>
      )}
    </div>
  );
};

export default Card;
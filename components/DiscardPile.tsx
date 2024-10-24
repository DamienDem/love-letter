import React from 'react';
import { Card as CardType } from '@/lib/gameLogic';
import Card from '@/components/Card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DiscardPileProps {
  discardPile: CardType[];
}

const DiscardPile: React.FC<DiscardPileProps> = ({ discardPile }) => {
  if (discardPile.length === 0) {
    return <div className="text-gray-500">Pile de défausse vide</div>;
  }

  const lastDiscardedCard = discardPile[discardPile.length - 1];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">
            <Card card={lastDiscardedCard} visible />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64 p-4">
          <h4 className="font-bold mb-2">Cartes défaussées :</h4>
          <ul className="max-h-96 overflow-y-auto">
            {discardPile.slice().reverse().map((card, index) => (
              <li key={index} className="mb-1">
                {card.type} (Valeur : {card.value})
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DiscardPile;
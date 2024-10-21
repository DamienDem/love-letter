import React, { useState } from 'react';
import { Card } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ChancelierActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chancellorDrawnCards: Card[];
  onFinishAction: (keptCardIndex: number, cardOrder: number[]) => void;
}

const ChancelierActionModal: React.FC<ChancelierActionModalProps> = ({
  isOpen,
  onClose,
  chancellorDrawnCards,
  onFinishAction,
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [cardOrder, setCardOrder] = useState<number[]>([]);

  const handleCardClick = (index: number) => {
    if (selectedCardIndex === null) {
      setSelectedCardIndex(index);
      setCardOrder(chancellorDrawnCards.map((_, i) => i).filter(i => i !== index));
    } else {
      const newOrder = [...cardOrder];
      const clickedCardIndex = newOrder.indexOf(index);
      if (clickedCardIndex !== -1) {
        newOrder.splice(clickedCardIndex, 1);
      }
      newOrder.push(index);
      setCardOrder(newOrder);
    }
  };

  const handleFinishAction = () => {
    if (selectedCardIndex !== null) {
      onFinishAction(selectedCardIndex, cardOrder);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Action du Chancelier</DialogTitle>
        </DialogHeader>
        <div>
          <p>Sélectionnez la carte à garder, puis lordre des cartes à remettre sous le deck.</p>
          <div className="flex justify-around mt-4">
            {chancellorDrawnCards.map((card, index) => (
              <div
                key={card.id}
                className={`cursor-pointer p-2 border rounded ${
                  selectedCardIndex === index ? 'bg-blue-200' : ''
                }`}
                onClick={() => handleCardClick(index)}
              >
                {card.type} ({cardOrder.indexOf(index) !== -1 ? cardOrder.indexOf(index) + 1 : ''})
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleFinishAction} disabled={selectedCardIndex === null || cardOrder.length !== chancellorDrawnCards.length - 1}>
            Terminer laction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChancelierActionModal;
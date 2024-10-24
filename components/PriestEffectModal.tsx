'use client';
import React from 'react';
import { Card } from '@/lib/gameLogic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PriestEffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlayer: string;
  revealedCard: Card | null;
}

const PriestEffectModal: React.FC<PriestEffectModalProps> = ({
  isOpen,
  onClose,
  targetPlayer,
  revealedCard,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Priest Effect</DialogTitle>
        </DialogHeader>
        {revealedCard ? (
          <div>
            <p>You revealed {targetPlayer}s card:</p>
            <p className="font-bold mt-2">{revealedCard.type}</p>
            <p>Value: {revealedCard.value}</p>
          </div>
        ) : (
          <p>No card revealed</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriestEffectModal;
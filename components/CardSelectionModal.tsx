'use client';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CardType, IPlayer, ModalContextProps } from '@/lib/types';
import { BaseGameModal } from './BaseGameModal';

interface CardSelectionModalProps {
  modalContext: ModalContextProps;
  currentPlayer: IPlayer;
  players: IPlayer[];
  onPlayCard: (cardId: string, targetId?: string, guessedCard?: CardType) => void;
}

const cardsRequiringTarget = [
  CardType.Garde,
  CardType.Pretre,
  CardType.Baron,
  CardType.Prince,
  CardType.Roi,
];

export const CardSelectionModal: React.FC<CardSelectionModalProps> = ({
  modalContext,
  currentPlayer,
  players,
  onPlayCard,
}) => {
  const { modalStates, modalActions } = modalContext;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [guessedCard, setGuessedCard] = useState<CardType | null>(null);

  const selectedCard = currentPlayer.hand.find(
    card => card.id === modalStates.selectedCardId
  );

  const requiresTarget = selectedCard && cardsRequiringTarget.includes(selectedCard.type);
  const isGuardSelected = selectedCard?.type === CardType.Garde;
  
  const targetablePlayers = players.filter(
    p => p.id !== currentPlayer.id && !p.isEliminated && !p.isProtected
  );
  const canTargetPlayers = targetablePlayers.length > 0;

  useEffect(() => {
    setSelectedTarget(null);
    setGuessedCard(null);
  }, [modalStates.selectedCardId]);

  const handleClose = () => {
    modalActions.setIsPlayCardModalOpen(false);
    modalActions.setSelectedCardId(null);
  };

  const handlePlayCard = () => {
    if (modalStates.selectedCardId) {
      onPlayCard(
        modalStates.selectedCardId,
        requiresTarget ? selectedTarget ?? undefined : undefined,
        isGuardSelected ? guessedCard ?? undefined : undefined
      );
      handleClose();
    }
  };

  useEffect(() => {
    if (modalStates.selectedCardId && !requiresTarget) {
      handlePlayCard();
    }
  }, [modalStates.selectedCardId]);

  return (
    <BaseGameModal
      isOpen={modalStates.isPlayCardModalOpen}
      onClose={handleClose}
      title={requiresTarget ? "Choose a target" : "Playing card..."}
      footer={
        <Button
          onClick={handlePlayCard}
          disabled={
            !modalStates.selectedCardId ||
            (requiresTarget && canTargetPlayers && !selectedTarget) ||
            (isGuardSelected && canTargetPlayers && !guessedCard)
          }
        >
          Play Card
        </Button>
      }
    >
      {requiresTarget && canTargetPlayers && (
        <Select
          onValueChange={setSelectedTarget}
          value={selectedTarget ?? undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a target player" />
          </SelectTrigger>
          <SelectContent>
            {targetablePlayers.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {isGuardSelected && canTargetPlayers && (
        <Select
          onValueChange={(value) => setGuessedCard(value as CardType)}
          value={guessedCard ?? undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Guess a card" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(CardType)
              .filter((type) => type !== CardType.Garde)
              .map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </BaseGameModal>
  );
};

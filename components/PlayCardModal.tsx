"use client";
import React, { useState, useEffect } from "react";
import { Player, CardType } from "@/lib/gameLogic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  players: Player[];
  onPlayCard: (
    cardId: string,
    targetPlayerId?: string,
    guessedCard?: CardType
  ) => void;
}

const cardsRequiringTarget = [
  CardType.Garde,
  CardType.Pretre,
  CardType.Baron,
  CardType.Prince,
  CardType.Roi,
];

const PlayCardModal: React.FC<PlayCardModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  players,
  onPlayCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [guessedCard, setGuessedCard] = useState<CardType | null>(null);

  const selectedCard = currentPlayer.hand.find(
    (card) => card.id === selectedCardId
  );
  const requiresTarget =
    selectedCard && cardsRequiringTarget.includes(selectedCard.type);
  const isGuardSelected = selectedCard?.type === CardType.Garde;
  const targetablePlayers = players.filter(
    (p) => p.id !== currentPlayer.id && !p.isEliminated && !p.isProtected
  );
  const canTargetPlayers = targetablePlayers.length > 0;

  useEffect(() => {
    // Reset states when the modal is opened
    if (isOpen) {
      setSelectedCardId(null);
      setSelectedTarget(null);
      setGuessedCard(null);
    }
  }, [isOpen]);

  const handlePlayCard = () => {
    if (selectedCardId) {
      onPlayCard(
        selectedCardId,
        requiresTarget ? selectedTarget ?? undefined : undefined,
        isGuardSelected ? guessedCard ?? undefined : undefined
      );
      onClose();
    }
  };

  const getTargetPlayers = () => {
    if (selectedCard?.type === CardType.Prince) {
      return players.filter((p) => !p.isEliminated && !p.isProtected);
    } else {
      return targetablePlayers;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Play a Card</DialogTitle>
        </DialogHeader>
        <Select
          onValueChange={setSelectedCardId}
          value={selectedCardId ?? undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a card to play" />
          </SelectTrigger>
          <SelectContent>
            {currentPlayer.hand.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.type} (Value: {card.value})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requiresTarget && canTargetPlayers && (
          <Select
            onValueChange={setSelectedTarget}
            value={selectedTarget ?? undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a target player" />
            </SelectTrigger>
            <SelectContent>
              {getTargetPlayers().map((player) => (
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
        <DialogFooter>
          <Button
            onClick={handlePlayCard}
            disabled={
              !selectedCardId ||
              (requiresTarget && canTargetPlayers && !selectedTarget) ||
              (isGuardSelected && canTargetPlayers && !guessedCard)
            }
          >
            Play Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayCardModal;

"use client";
import { useState, useEffect } from "react";
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
import { CardType, IPlayer } from "@/lib/types";

interface PlayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: IPlayer;
  players: IPlayer[];
  onPlayCard: (
    cardId: string,
    targetPlayerId?: string,
    guessedCard?: CardType
  ) => void;
  initialSelectedCardId: string | null;
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
  initialSelectedCardId
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [guessedCard, setGuessedCard] = useState<CardType | null>(null);

  useEffect(() => {
    if (isOpen && initialSelectedCardId) {
      setSelectedCardId(initialSelectedCardId);
    }
  }, [isOpen, initialSelectedCardId]);

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
    // Reset target and guessed card when card selection changes
    setSelectedTarget(null);
    setGuessedCard(null);
  }, [selectedCardId]);

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

  // Automatically play card if no target is required
  useEffect(() => {
    if (selectedCardId && !requiresTarget) {
      handlePlayCard();
    }
  }, [selectedCardId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {requiresTarget ? "Choose a target" : "Playing card..."}
          </DialogTitle>
        </DialogHeader>
        
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
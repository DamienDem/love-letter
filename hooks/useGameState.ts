import { useState, useEffect } from 'react';
import { socket } from "@/lib/socket";
import { IGameState, IPlayer, CardType } from "@/lib/types";

interface UseGameStateProps {
  gameId: string;
  playerId: string;
}

interface UseGameStateReturn {
  game: IGameState | null;
  currentPlayer: IPlayer | null;
  isLoading: boolean;
  handlePlayCard: (cardId: string, targetId?: string, guessedCard?: CardType) => void;
  handleChancelierAction: (action: { selectedCardIndex: number; topCardIndex?: number }) => void;
}

export const useGameState = ({ gameId, playerId }: UseGameStateProps): UseGameStateReturn => {
  const [game, setGame] = useState<IGameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<IPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChancellorActionInProgress, setIsChancellorActionInProgress] = useState(false);

  useEffect(() => {
    if (!playerId || !gameId) {
      console.error("PlayerId or GameId is missing");
      setIsLoading(false);
      return;
    }

    const handleGameState = (gameState: IGameState) => {
      console.log("Game state received:", gameState);
      setGame(gameState);
      updateCurrentPlayer(gameState);
      setIsLoading(false);
      
      // Check if this player needs to perform Chancellor action
      if (gameState.isChancellorAction && 
          gameState.players[gameState.currentPlayerIndex].id === playerId && 
          gameState.chancellorDrawnCards.length > 0) {
        setIsChancellorActionInProgress(true);
        socket.emit("chancellorAction", { gameId, playerId });
      }
    };

    const handleGameUpdated = (updatedGame: IGameState) => {
      console.log("Game updated:", updatedGame);
      setGame(updatedGame);
      updateCurrentPlayer(updatedGame);
      
      // Only check and start turn if not in chancellor action
      if (!updatedGame.isChancellorAction) {
        checkAndStartTurn(updatedGame);
        setIsChancellorActionInProgress(false);
      }
    };

    const updateCurrentPlayer = (gameState: IGameState) => {
      const player = gameState.players.find((p) => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
    };

    const checkAndStartTurn = (gameState: IGameState) => {
      if (
        !gameState.isChancellorAction &&
        gameState.players[gameState.currentPlayerIndex].id === playerId &&
        gameState.players.find(p => p.id === playerId)?.hand?.length === 1 &&
        !isChancellorActionInProgress
      ) {
        console.log("Starting turn for player:", playerId);
        socket.emit("startTurn", gameId);
      }
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("getGameState", gameId);

    socket.on("gameState", handleGameState);
    socket.on("gameUpdated", handleGameUpdated);
    socket.on("error", (error: string) => console.error("Game error:", error));

    return () => {
      socket.off("gameState", handleGameState);
      socket.off("gameUpdated", handleGameUpdated);
      socket.off("error");
    };
  }, [playerId, gameId, isChancellorActionInProgress]);

  const handlePlayCard = (
    cardId: string, 
    targetId?: string, 
    guessedCard?: CardType
  ) => {
    if (!currentPlayer) return;

    const selectedCard = currentPlayer.hand.find((card) => card.id === cardId);
    if (selectedCard) {
      if (selectedCard.type === CardType.Chancelier) {
        // Initial Chancellor card play
        console.log("Playing Chancellor card");
        socket.emit("playCard", {
          gameId,
          playerId,
          cardType: CardType.Chancelier,
        });
        setIsChancellorActionInProgress(true);
      } else {
        console.log("Playing card:", {
          cardType: selectedCard.type,
          targetId,
          guessedCard
        });
        socket.emit("playCard", {
          gameId,
          playerId,
          cardType: selectedCard.type,
          targetPlayerId: targetId,
          guessedCard,
        });
      }
    }
  };

  const handleChancelierAction = (action: {
    selectedCardIndex: number;
    topCardIndex?: number;
  }) => {
    if (game && currentPlayer) {
      console.log("Resolving Chancellor action:", action);
      socket.emit("playCard", {
        gameId,
        playerId,
        cardType: CardType.Chancelier,
        chancellorAction: action,
      });
      setIsChancellorActionInProgress(false);
    }
  };

  return {
    game,
    currentPlayer,
    isLoading,
    handlePlayCard,
    handleChancelierAction
  };
};
"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { CardType, Game, Player, Card } from "@/lib/gameLogic";
import GameTable from "@/components/GameTable";
import PlayCardModal from "@/components/PlayCardModal";
import DiscardPile from "@/components/DiscardPile";
import PriestEffectModal from "@/components/PriestEffectModal";
import ChancelierActionModal from "@/components/ChancelierActionModal";

const GamePage: React.FC = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const playerId = searchParams?.get("playerId");
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayCardModalOpen, setIsPlayCardModalOpen] = useState(false);
  const [isPriestModalOpen, setIsPriestModalOpen] = useState(false);
  const [revealedCard, setRevealedCard] = useState<Card | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<string>("");
  const [isChancelierModalOpen, setIsChancelierModalOpen] = useState(false);

  useEffect(() => {
    if (!playerId || !gameId) {
      console.error("PlayerId or GameId is missing");
      setIsLoading(false);
      return;
    }

    console.log("Connecting to game:", gameId, "as player:", playerId);

    if (!socket.connected) {
      console.log("Socket not connected, attempting to connect...");
      socket.connect();
    }

    socket.emit("getGameState", gameId);

    const onGameState = (gameState: Game) => {
      console.log("Received initial game state:", gameState);
      setGame(gameState);
      const player = gameState.players.find((p) => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
      setIsLoading(false);
    };

    const onGameUpdated = (updatedGame: Game) => {
      console.log("Game updated:", updatedGame);
      setGame(updatedGame);
      const player = updatedGame.players.find((p) => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }

      // Vérifier si nous devons ouvrir le modal du Chancelier
      if (
        updatedGame.isChancellorAction &&
        updatedGame.chancellorDrawnCards.length > 0 &&
        updatedGame.players[updatedGame.currentPlayerIndex].id === playerId
      ) {
        console.log("Opening chancellor modal with cards:", updatedGame.chancellorDrawnCards);
        setIsChancelierModalOpen(true);
      }

      // Vérifier le tour seulement si ce n'est pas une action de Chancelier en cours
      if (
        !updatedGame.isChancellorAction &&
        updatedGame.players[updatedGame.currentPlayerIndex].id === playerId &&
        player?.hand.length === 1
      ) {
        console.log("Starting turn for player");
        socket.emit("startTurn", gameId);
      }
    };

    const onCardRevealed = ({
      playerId: targetPlayerId,
      card,
    }: {
      playerId: string;
      card: Card;
    }) => {
      console.log("Card revealed event received:", { targetPlayerId, card });
      setRevealedCard(card);
      setTargetPlayer(targetPlayerId);
      setIsPriestModalOpen(true);
    };

    const onChancellorAction = ({
      playerId: chancellorPlayerId,
    }: {
      playerId: string;
    }) => {
      console.log("Chancellor action received:", {
        chancellorPlayerId,
        currentPlayerId: playerId,
      });
      if (chancellorPlayerId === playerId) {
        setIsChancelierModalOpen(true);
      }
    };

    const onError = (error: string) => {
      console.error("Game error:", error);
    };

    socket.on("gameState", onGameState);
    socket.on("gameUpdated", onGameUpdated);
    socket.on("cardRevealed", onCardRevealed);
    socket.on("chancellorAction", onChancellorAction);
    socket.on("error", onError);

    return () => {
      socket.off("gameState", onGameState);
      socket.off("gameUpdated", onGameUpdated);
      socket.off("cardRevealed", onCardRevealed);
      socket.off("chancellorAction", onChancellorAction);
      socket.off("error", onError);
    };
  }, [playerId, gameId]);

  const handleCardClick = () => {
    console.log("Card clicked");
    if (game?.players[game.currentPlayerIndex].id === playerId) {
      setIsPlayCardModalOpen(true);
    }
  };

  const handlePlayCard = (
    cardId: string,
    targetPlayerId?: string,
    guessedCard?: CardType
  ) => {
    console.log("handlePlayCard called with:", {
      cardId,
      targetPlayerId,
      guessedCard,
    });

    const selectedCard = currentPlayer?.hand.find((card) => card.id === cardId);
    if (selectedCard) {
      console.log("Emitting playCard event:", {
        gameId,
        playerId,
        cardType: selectedCard.type,
        targetPlayerId,
        guessedCard,
      });

      socket.emit("playCard", {
        gameId,
        playerId,
        cardType: selectedCard.type,
        targetPlayerId,
        guessedCard,
      });
    } else {
      console.error("Selected card not found in player's hand");
    }
  };

  const handleChancelierAction = (
    keptCardIndex: number,
    cardOrder: number[]
  ) => {
    console.log("Handling chancellor action:", {
      keptCardIndex,
      cardOrder,
    });

    if (game && currentPlayer) {
      socket.emit("playCard", {
        gameId,
        playerId,
        cardType: CardType.Chancelier,
        chancellorAction: {
          keptCardIndex,
          cardOrder,
        },
      });
    }
    setIsChancelierModalOpen(false);
  };

  if (isLoading) {
    return (
      <div>
        Loading... (PlayerId: {playerId}, GameId: {gameId})
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return <div>Error: Unable to load game data</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Love Letter Game</h1>
      {game.players.length === game.maxPlayers && (
        <>
          <div className="flex justify-between">
            <div className="w-3/4">
              <GameTable
                players={game.players}
                currentPlayerId={currentPlayer.id}
                activePlayerId={game.players[game.currentPlayerIndex].id}
                onCardClick={handleCardClick}
              />
            </div>
            <div className="w-1/4">
              <DiscardPile discardPile={game.discardPile} />
            </div>
          </div>

          <PlayCardModal
            isOpen={isPlayCardModalOpen}
            onClose={() => {
              console.log("Closing PlayCardModal");
              setIsPlayCardModalOpen(false);
            }}
            currentPlayer={currentPlayer}
            players={game.players}
            onPlayCard={handlePlayCard}
          />

          <PriestEffectModal
            isOpen={isPriestModalOpen}
            onClose={() => {
              console.log("Closing PriestEffectModal");
              setIsPriestModalOpen(false);
            }}
            targetPlayer={targetPlayer}
            revealedCard={revealedCard}
          />

          <ChancelierActionModal
            isOpen={isChancelierModalOpen}
            onClose={() => {
              console.log("Closing ChancelierActionModal");
              setIsChancelierModalOpen(false);
            }}
            chancellorDrawnCards={game.chancellorDrawnCards}
            onFinishAction={handleChancelierAction}
          />
        </>
      )}
    </div>
  );
};

export default GamePage;
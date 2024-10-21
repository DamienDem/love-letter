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

      if (
        updatedGame.players[updatedGame.currentPlayerIndex].id === playerId &&
        player?.hand.length === 1
      ) {
        console.log(
          "It's this player's turn and they have only one card, emitting startTurn"
        );
        socket.emit("startTurn", gameId);
      }
    };

    const onCardRevealed = ({
      playerId,
      card,
    }: {
      playerId: string;
      card: Card;
    }) => {
      console.log("Card revealed event received:", { playerId, card });
      setRevealedCard(card);
      setTargetPlayer(playerId);
      setIsPriestModalOpen(true);
    };

    const onChancellorAction = ({ playerId }: { playerId: string }) => {
      if (playerId === currentPlayer?.id) {
        setIsChancelierModalOpen(true);
      }
    };

    const onError = (error: string) => {
      console.error("Game error:", error);
    };

    socket.on("chancellorAction", onChancellorAction);
    socket.on("gameState", onGameState);
    socket.on("gameUpdated", onGameUpdated);
    socket.on("cardRevealed", onCardRevealed);
    socket.off("chancellorAction", onChancellorAction);
    socket.on("error", onError);

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("gameState", onGameState);
      socket.off("gameUpdated", onGameUpdated);
      socket.off("cardRevealed", onCardRevealed);
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
        cardId: selectedCard.id,
        cardType: selectedCard.type,
        targetPlayerId,
        guessedCard,
      });
      socket.emit("playCard", {
        gameId,
        playerId,
        cardId: selectedCard.id,
        cardType: selectedCard.type,
        targetPlayerId,
        guessedCard,
      });
    } else {
      console.error("Selected card not found in player's hand");
    }
  };
  const handleFinishChancelierAction = (
    keptCardIndex: number,
    cardOrder: number[]
  ) => {
    if (game && currentPlayer) {
      socket.emit("finishChancelierAction", {
        gameId: game.id,
        playerId: currentPlayer.id,
        keptCardIndex,
        cardOrder,
      });
    }
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
            onClose={() => setIsChancelierModalOpen(false)}
            chancellorDrawnCards={game?.chancellorDrawnCards || []}
            onFinishAction={handleFinishChancelierAction}
          />
        </>
      )}
    </div>
  );
};

export default GamePage;

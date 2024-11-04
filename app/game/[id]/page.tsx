"use client";
import { CardSelectionModal } from "@/components/CardSelectionModal";
import { ChancelierActionModal } from "@/components/ChancelierActionModal";
import GameOverModal from "@/components/GameOverModal";
import GameTable from "@/components/GameTable";
import PlayerActions from "@/components/PlayerActions";
import { PriestEffectModal } from "@/components/PriestEffectModal";
import { useGameState } from "@/hooks/useGameState";
import { useModals } from "@/hooks/useModals";
import { socket } from "@/lib/socket";
import { ICard } from "@/lib/types";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GamePage: React.FC = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const playerId = searchParams?.get("playerId") as string;
  const gameId = params.id as string;

  const modalContext = useModals();
  const { modalActions } = modalContext;
  const {
    game,
    currentPlayer,
    isLoading,
    handlePlayCard,
    handleChancelierAction,
  } = useGameState({ gameId, playerId });

  useEffect(() => {
    const handleCardRevealed = ({
      playerId: targetPlayerId,
      card,
      sourcePlayerId,
    }: {
      playerId: string;
      card: ICard;
      sourcePlayerId: string;
    }) => {
      if (sourcePlayerId === playerId) {
        modalActions.setRevealedCard(card);
        modalActions.setTargetPlayer(targetPlayerId);
        modalActions.setPriestPlayerId(sourcePlayerId);
        modalActions.setIsPriestModalOpen(true);
      }
    };

    const handleChancellorAction = ({
      playerId: chancellorPlayerId,
    }: {
      playerId: string;
    }) => {
      if (chancellorPlayerId === playerId) {
        modalActions.setIsChancelierModalOpen(true);
      }
    };

    const handleGameOver = () => {
      modalActions.setIsGameOverModalOpen(true);
    };
    socket.on("cardRevealed", handleCardRevealed);
    socket.on("chancellorAction", handleChancellorAction);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("cardRevealed", handleCardRevealed);
      socket.off("gameOver", handleGameOver);
      socket.off("chancellorAction", handleChancellorAction);
    };
  }, [playerId, modalActions]);

  const handleCardClick = (cardId: string) => {
    if (game?.players[game.currentPlayerIndex].id === playerId) {
      console.log("Card clicked:", cardId);
      modalActions.setSelectedCardId(cardId);
      modalActions.setIsPlayCardModalOpen(true);
    }
  };
  const handlePlayAgain = () => {
    socket.emit("restartGame", { gameId });
    modalActions.setIsGameOverModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading game...</p>
          <p className="text-sm text-gray-500">
            PlayerId: {playerId}, GameId: {gameId}
          </p>
        </div>
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          Error: Unable to load game data
        </div>
      </div>
    );
  }

  return (
    <div>
      {game.players.length === game.maxPlayers ? (
        <>
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-3/4">
              <GameTable
                players={game.players}
                currentPlayerId={currentPlayer.id}
                activePlayerId={game.players[game.currentPlayerIndex].id}
                onCardClick={handleCardClick}
                discardPile={game.discardPile}
                deck={game.deck}
              />
            </div>
            <div className="lg:w-1/4">
              <PlayerActions
                actions={game.actions || []}
                players={game.players}
              />
            </div>
          </div>

          <CardSelectionModal
            modalContext={modalContext}
            currentPlayer={currentPlayer}
            players={game.players}
            onPlayCard={handlePlayCard}
          />

          <PriestEffectModal modalContext={modalContext} />

          <ChancelierActionModal
            modalContext={modalContext}
            chancellorDrawnCards={game.chancellorDrawnCards}
            onFinishAction={handleChancelierAction}
          />
          <GameOverModal
            modalContext={modalContext}
            winners={game.gameWinner}
            onPlayAgain={handlePlayAgain}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Waiting for players...</h2>
          <p className="text-gray-600 mt-2">
            {game.players.length} / {game.maxPlayers} players joined
          </p>
        </div>
      )}
    </div>
  );
};

export default GamePage;

"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { CardType, Game, Player, Card } from "@/lib/gameLogic";
import GameTable from "@/components/GameTable";
import PlayCardModal from "@/components/PlayCardModal";
import PriestEffectModal from "@/components/PriestEffectModal";
import ChancelierActionModal from "@/components/ChancelierActionModal";
import PlayerActions from "@/components/PlayerActions";

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
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [priestPlayerId, setPriestPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId || !gameId) {
      console.error("PlayerId or GameId is missing");
      setIsLoading(false);
      return;
    }

  

    if (!socket.connected) {
   
      socket.connect();
    }

    socket.emit("getGameState", gameId);

    const onGameState = (gameState: Game) => {
  
      setGame(gameState);
      const player = gameState.players.find((p) => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
      setIsLoading(false);
    };

    const onGameUpdated = (updatedGame: Game) => {
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
        setIsChancelierModalOpen(true);
      }

      // Vérifier le tour seulement si ce n'est pas une action de Chancelier en cours
      if (
        !updatedGame.isChancellorAction &&
        updatedGame.players[updatedGame.currentPlayerIndex].id === playerId &&
        player?.hand?.length === 1
      ) {
        socket.emit("startTurn", gameId);
      }
    };

    const onCardRevealed = ({
      playerId: targetPlayerId,
      card,
      sourcePlayerId,
    }: {
      playerId: string;
      card: Card;
      sourcePlayerId: string; // ID du joueur qui a joué le Prêtre
    }) => {
      // N'afficher la modale que si c'est le joueur qui a joué le Prêtre
      if (sourcePlayerId === playerId) {
        setRevealedCard(card);
        setTargetPlayer(targetPlayerId);
        setPriestPlayerId(sourcePlayerId);
        setIsPriestModalOpen(true);
      }
    };

    const onChancellorAction = ({
      playerId: chancellorPlayerId,
    }: {
      playerId: string;
    }) => {
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

  const handleCardClick = (cardId: string) => {
    if (game?.players[game.currentPlayerIndex].id === playerId) {
      setSelectedCardId(cardId);
      setIsPlayCardModalOpen(true);
    }
  };

  console.log("game", game);
  
  const handlePlayCard = (
    cardId: string,
    targetPlayerId?: string,
    guessedCard?: CardType
  ) => {
 
    const selectedCard = currentPlayer?.hand.find((card) => card.id === cardId);
    if (selectedCard) {

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
    setSelectedCardId(null);
  };

  const handleChancelierAction = (action: {
    selectedCardIndex: number;
    topCardIndex?: number;
  }) => {

    if (game && currentPlayer) {
      socket.emit("playCard", {
        gameId,
        playerId,
        cardType: CardType.Chancelier,
        chancellorAction: action,
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
    <div>
      {game.players.length === game.maxPlayers && (
        <>
          <div className="flex justify-between">
            <div className="w-3/4">
              <GameTable
                players={game.players}
                currentPlayerId={currentPlayer.id}
                activePlayerId={game.players[game.currentPlayerIndex].id}
                onCardClick={handleCardClick}
                discardPile={game.discardPile}
                deck={game.deck}
              />
            </div>
            <div className="w-1/4">
              <PlayerActions
                actions={game.actions || []}
                players={game.players}
              />
            </div>
          </div>

          <PlayCardModal
            isOpen={isPlayCardModalOpen}
            onClose={() => {
              
              setIsPlayCardModalOpen(false);
              setSelectedCardId(null);
            }}
            currentPlayer={currentPlayer}
            players={game.players}
            onPlayCard={handlePlayCard}
            initialSelectedCardId={selectedCardId}
          />

          {priestPlayerId === playerId && (
            <PriestEffectModal
              isOpen={isPriestModalOpen}
              onClose={() => {
                
                setIsPriestModalOpen(false);
                setPriestPlayerId(null);
              }}
              targetPlayer={targetPlayer}
              revealedCard={revealedCard}
            />
          )}

          <ChancelierActionModal
            isOpen={isChancelierModalOpen}
            onClose={() => {
           
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

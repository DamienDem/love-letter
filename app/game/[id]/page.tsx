"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Game, Player, Card, CardType } from "@/lib/gameLogic";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";

const GameComponent = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const playerId = searchParams?.get("playerId");
  const gameId = params.id;
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<string | null>(null);
  const [guessedCard, setGuessedCard] = useState<CardType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      console.log("Socket connected");
      socket.emit("getGameData", gameId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("game", (updatedGame: Game) => {
      setGame(updatedGame);
      const currentPlayer = updatedGame.players.find((p) => p.id === playerId);
      setPlayer(currentPlayer ?? null);
      const isCurrentTurn =
        updatedGame.players[updatedGame.currentPlayerIndex].id === playerId;
      setIsMyTurn(isCurrentTurn);
      setHasDrawnCard(isCurrentTurn && currentPlayer?.hand.length === 2);
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      if (socket) {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("joinGame");
        socket.off("getGameData");
        socket.off("game");
        socket.off("gameError");
      }
    };
  }, [gameId, playerId]);

  useEffect(() => {
    if (isMyTurn && !hasDrawnCard) {
      handleStartTurn();
    }
  }, [isMyTurn, hasDrawnCard]);

  const handleStartTurn = () => {
    if (socket && game && isMyTurn && !hasDrawnCard) {
      socket.emit("startTurn", { gameId, playerId });
    }
  };

  const handlePlayCard = () => {
    if (socket && game && player && selectedCard && isMyTurn && hasDrawnCard) {
      socket.emit("playTurn", {
        gameId,
        playerId,
        cardType: selectedCard.type,
        targetPlayerId: needsTarget(selectedCard.type)
          ? targetPlayer
          : undefined,
        guessedCard:
          selectedCard.type === CardType.Garde ? guessedCard : undefined,
      });
      setSelectedCard(null);
      setTargetPlayer(null);
      setGuessedCard(null);
    }
  };

  const renderPlayerHand = () => {
    if (!player) return null;
    return player.hand?.map((card, index) => (
      <Button
        key={index}
        onClick={() => {
          setSelectedCard(card);
          if (!needsTarget(card.type)) {
            setTargetPlayer(null);
          }
        }}
        disabled={game?.players[game.currentPlayerIndex].id !== playerId}
        className={`transition-colors ${
          selectedCard === card
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-black"
        }`}
      >
        {card.type} ({card.value})
      </Button>
    ));
  };

  const renderPlayerList = () => {
    if (!game) return null;
    return game.players.map((p) => (
      <div key={p.id}>
        {p.name} - Points: {p.points}
        {p.isEliminated ? " (Éliminé)" : ""}
        {p.isProtected ? " (Protégé)" : ""}
        {game.players[game.currentPlayerIndex].id === p.id
          ? " (Tour actuel)"
          : ""}
        <Button
          onClick={() => setTargetPlayer(p.id)}
          disabled={
            !selectedCard ||
            p.id === playerId ||
            !needsTarget(selectedCard.type)
          }
        >
          Cibler
        </Button>
      </div>
    ));
  };

  const renderGuessCardButtons = () => {
    if (selectedCard?.type !== CardType.Garde) return null;
    return Object.values(CardType).map((cardType, index) => (
      <Button
        key={index}
        onClick={() => setGuessedCard(cardType)}
        disabled={selectedCard?.type !== CardType.Garde}
        className={`transition-colors ${
          guessedCard === cardType
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-black"
        }`}
      >
        {cardType}
      </Button>
    ));
  };

  const needsTarget = (cardType: CardType): boolean => {
    return [
      CardType.Garde,
      CardType.Pretre,
      CardType.Baron,
      CardType.Prince,
      CardType.Roi,
    ].includes(cardType);
  };

  if (!isConnected) return <div>Non connectés</div>;
  if (!game || !player) {
    return <div>Chargement du jeu...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Partie de Love Letter - {game.name}
      </h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Votre main :</h2>
        <div className="flex space-x-2">{renderPlayerHand()}</div>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Joueurs :</h2>
        {renderPlayerList()}
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Actions :</h2>
        {renderGuessCardButtons()}

        <Button
          onClick={handlePlayCard}
          disabled={
            !selectedCard ||
            game.players[game.currentPlayerIndex].id !== playerId ||
            player.hand.length !== 2 ||
            (needsTarget(selectedCard.type) && !targetPlayer) ||
            (selectedCard.type === CardType.Garde && !guessedCard)
          }
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
        >
          Jouer la carte
        </Button>
      </div>
      <div>
        <h2 className="text-xl font-semibold">État du jeu :</h2>
        <p>Cartes restantes dans le deck : {game.deck.length}</p>
        <p>Carte cachée : {game.hiddenCard ? "Oui" : "Non"}</p>
        <p>Manche actuelle : {game.currentRound}</p>
        <p>
          Gagnant de la manche :
          {game.roundWinner ? game.roundWinner.name : "Pas encore déterminé"}
        </p>
        <p>
          Gagnant du jeu :
          {game.gameWinner ? game.gameWinner.name : "Pas encore déterminé"}
        </p>
      </div>
    </div>
  );
};

export default GameComponent;

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket, initSocket } from "@/lib/socketio";
import { Socket } from "socket.io-client";
import { Game, startTurn } from "@/lib/gameLogic";
import { start } from "repl";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const newSocket = await initSocket();
        setSocket(newSocket);
        console.log("Socket initialized in GamePage");

        const requestGameData = () => {
          console.log("Requesting game data for:", gameId);
          newSocket.emit("getGameData", gameId);
        };

        newSocket.on("connect", () => {
          console.log("Socket connected in GamePage");
          requestGameData();
        });

        newSocket.on("gameData", (gameData: Game) => {
          console.log("Received game data:", gameData);
          console.log(newSocket);

          gameData.players[0].socketId = newSocket.id;
          if(gameData.players[gameData.currentPlayerIndex]) {
            console.log('draw');
    
            startTurn(gameData)
          }
          setGame(gameData);
          setIsLoading(false);
        });

        newSocket.on("gameNotFound", () => {
          console.log("Game not found");
          setError(
            "Jeu non trouvé. Vous allez être redirigé vers la page d'accueil."
          );
          setIsLoading(false);
          setTimeout(() => router.push("/"), 3000);
        });

        if (newSocket.connected) {
          requestGameData();
        }
      } catch (error) {
        console.error("Error setting up socket:", error);
        setError("Erreur de connexion au serveur.");
        setIsLoading(false);
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        console.log("Cleaning up socket listeners in GamePage");
        socket.off("connect");
        socket.off("gameData");
        socket.off("gameNotFound");
      }
    };
  }, [gameId, router]);

  if (isLoading) {
    return <div>Chargement des données du jeu...</div>;
  }

  if (!game) {
    return <div>Jeu non trouvé ou erreur de chargement.</div>;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">{game.name}</h1>
        <h2 className="text-xl mb-4 text-center">
          Joueurs ({game.players.length}/{game.maxPlayers})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {game.players.map((player, index) => (
            <div
              key={player.id}
              className={`p-4 rounded ${
                currentPlayer && player.id === currentPlayer.id
                  ? "bg-yellow-100"
                  : "bg-gray-100"
              } ${player.isEliminated ? "opacity-50" : ""}`}
            >
              <h3 className="font-bold">
                Joueur {index + 1}: {player.name}
                {currentPlayer &&
                  player.id === currentPlayer.id &&
                  " (Tour actuel)"}
                {player.isEliminated && " (Éliminé)"}
              </h3>
              {socket &&
                player.socketId === socket.id &&
                player.hand &&
                player.hand.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Vos cartes :</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {player.hand.map((card, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="px-2 py-1 bg-blue-100 rounded"
                        >
                          {card.type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {(!socket || player.socketId !== socket.id) && (
                <p className="mt-2 text-gray-600">
                  {player.hand && player.hand.length > 0
                    ? `${player.hand.length} carte${
                        player.hand.length > 1 ? "s" : ""
                      } en main`
                    : "Pas de carte en main"}
                </p>
              )}
            </div>
          ))}
        </div>
        {game.players.length < game.maxPlayers && (
          <p className="mt-4 text-center text-gray-600">
            En attente dautres joueurs...
          </p>
        )}
        {game.players.length === game.maxPlayers &&
          game.players.every((p) => !p.hand || p.hand.length === 0) && (
            <div className="mt-4 text-center text-green-600 font-bold">
              La partie va bientôt commencer !
            </div>
          )}
      </div>
    </div>
  );
}

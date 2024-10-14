"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";

interface Game {
  id: string;
  name: string;
  players: { id: string; name: string }[];
  maxPlayers: number;
}

export default function JoinGamePage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      console.log("Socket connected");
      socket.emit("getGames");
      socket.on("gamesList", (games) => {
        setIsLoading(false);
        setGames(games);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect");
      socket.off("gamesList");
    };
  }, []);

  const handleJoinClick = (gameId: string) => {
    setSelectedGameId(gameId);
    setIsModalOpen(true);
  };

  const handleJoinGame = () => {
    if (selectedGameId && playerName.trim() !== "") {
      const playerId = uuidv4();
      const player = {
        id: playerId,
        name: playerName.trim(),
      };
      console.log("Joining game", selectedGameId);
      
      if (socket) {
        socket.emit("joinGame", selectedGameId, player);
        router.push(`/game/${selectedGameId}?playerId=${playerId}`);
      } else {
        console.error("Socket not initialized");
      }
    }
  };

  const handleReturnToCreateGame = () => {
    router.push("/");
  };

  if (!isConnected) return <div>Non connectés</div>;
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[600px] p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Parties disponibles
        </h2>
        <div className="space-y-4">
          {isLoading ? (
            <p>Chargement des parties en cours...</p>
          ) : games.length > 0 ? (
            games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-4 border rounded"
              >
                <div>
                  <h3 className="font-semibold">{game.name}</h3>
                  <p className="text-sm text-gray-500">
                    {game.players.length}/{game.maxPlayers} joueurs
                  </p>
                </div>
                {game.players.length < game.maxPlayers && (
                  <Button onClick={() => handleJoinClick(game.id)}>
                    Rejoindre
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p>Aucune partie disponible pour le moment.</p>
          )}
        </div>
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={handleReturnToCreateGame}
            className="w-full"
          >
            Retour à la création de partie
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejoindre la partie</DialogTitle>
            <DialogDescription>
              Entrez votre nom pour rejoindre la partie.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Votre nom"
          />
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button onClick={handleJoinGame}>Rejoindre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

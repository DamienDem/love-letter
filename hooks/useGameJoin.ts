// hooks/useGameJoin.ts
'use client';
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { socket } from "@/lib/socket";
import { GameListState, JoinGameData } from "@/lib/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
;

interface GameJoinHookResult {
  games: GameListState[];
  isLoading: boolean;
  playerName: string;
  isModalOpen: boolean;
  setPlayerName: (name: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  handleJoinClick: (gameId: string) => void;
  handleJoinGame: () => void;
}

export const useGameJoin = (router: AppRouterInstance): GameJoinHookResult => {
  const [games, setGames] = useState<GameListState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleAvailableGames = (availableGames: GameListState[]) => {
      setIsLoading(false);
      setGames(availableGames);
    };

    socket.on("availableGames", handleAvailableGames);
    socket.emit("getAvailableGames");

    return () => {
      socket.off("availableGames", handleAvailableGames);
    };
  }, []);

  const handleJoinClick = (gameId: string) => {
    setSelectedGameId(gameId);
    setIsModalOpen(true);
  };

  const handleJoinGame = () => {
    if (selectedGameId && playerName.trim()) {
      const playerId = uuidv4();
      const joinData: JoinGameData = {
        gameId: selectedGameId,
        player: {
          id: playerId,
          name: playerName.trim(),
        }
      };

      socket.emit("joinGame", selectedGameId, joinData.player);
      router.push(`/game/${selectedGameId}?playerId=${playerId}`);
    }
  };

  return {
    games,
    isLoading,
    playerName,
    isModalOpen,
    setPlayerName,
    setIsModalOpen,
    handleJoinClick,
    handleJoinGame,
  };
};

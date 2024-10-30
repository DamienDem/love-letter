// hooks/useGameForm.ts
'use client'
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { socket } from "@/lib/socket";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface FormData {
  gameName: string;
  numPlayers: string;
  creatorName: string;
}

const DEFAULT_FORM_DATA: FormData = {
  gameName: "",
  numPlayers: "2",
  creatorName: "",
};

export const useGameForm = (router: AppRouterInstance) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, numPlayers: value }));
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    const gameId = uuidv4();
    const playerId = uuidv4();

    const gameData = {
      gameId,
      players: [{ id: playerId, name: formData.creatorName }],
      maxPlayers: parseInt(formData.numPlayers),
      pointsToWin: 3,
    };

    socket.emit("createGame", gameData);
    router.push(`/game/${gameId}?playerId=${playerId}`);
  };

  return {
    formData,
    handleInputChange,
    handleSelectChange,
    handleCreateGame,
  };
};
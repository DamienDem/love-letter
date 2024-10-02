"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { getSocket, initSocket } from "@/lib/socketio";
import { Socket } from "socket.io-client";

interface FormData {
  gameName: string;
  numPlayers: string;
  creatorName: string;
}

interface GameData {
  id: string;
  name: string;
  players: { id: string; name: string }[];
  maxPlayers: number;
}

export default function CreateGameForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    gameName: "",
    numPlayers: "2",
    creatorName: "",
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    initSocket().then(setSocket);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, numPlayers: value }));
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    const socket = getSocket();
    console.log("socket", socket);

    const gameData: GameData = {
      id: Date.now().toString(),
      name: formData.gameName,
      players: [{ id: Date.now().toString(), name: formData.creatorName }],
      maxPlayers: parseInt(formData.numPlayers),
    };

    socket?.emit("createGame", gameData);
    router.push(`/game/${gameData.id}`);
  };

  const handleJoinGame = () => {
    router.push("/join-game");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[600px] p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Love Letter</h2>
        <div className="space-y-6">
          <form onSubmit={handleCreateGame} className="space-y-6">
            <div>
              <label
                htmlFor="gameName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom de la partie
              </label>
              <Input
                id="gameName"
                name="gameName"
                value={formData.gameName}
                onChange={handleInputChange}
                placeholder="Ma partie de Love Letter"
                className="mt-1 w-full"
              />
              <p className="mt-2 text-sm text-gray-500">
                Choisissez un nom unique pour votre partie.
              </p>
            </div>

            <div>
              <label
                htmlFor="numPlayers"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre de joueurs
              </label>
              <Select
                onValueChange={handleSelectChange}
                value={formData.numPlayers}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Sélectionnez le nombre de joueurs" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} joueurs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-gray-500">
                Choisissez le nombre de joueurs pour cette partie.
              </p>
            </div>

            <div>
              <label
                htmlFor="creatorName"
                className="block text-sm font-medium text-gray-700"
              >
                Votre nom
              </label>
              <Input
                id="creatorName"
                name="creatorName"
                value={formData.creatorName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="mt-1 w-full"
              />
              <p className="mt-2 text-sm text-gray-500">
                Entrez votre nom pour cette partie.
              </p>
            </div>

            <Button type="submit" className="w-full">
              Créer une nouvelle partie
            </Button>
          </form>

          <div className="text-center">
            <span className="text-gray-500">ou</span>
          </div>

          <Button onClick={handleJoinGame} variant="outline" className="w-full">
            Rejoindre une partie existante
          </Button>
        </div>
      </div>
    </div>
  );
}

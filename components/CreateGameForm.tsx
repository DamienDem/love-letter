//components/CreateGameForm.tsx
'use client';
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useGameForm } from "@/hooks/useGameForm";




interface FormFieldProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

// Constants
const PLAYER_COUNTS = [2, 3, 4, 5, 6] as const;

// Components
const FormField: React.FC<FormFieldProps> = ({ label, description, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    <p className="mt-2 text-sm text-gray-500">
      {description}
    </p>
  </div>
);

const GameFormDivider: React.FC = () => (
  <div className="text-center">
    <span className="text-gray-500">ou</span>
  </div>
);

// Main Component
export default function CreateGameForm() {
  const router = useRouter();
  const { isConnected } = useSocketConnection();
  const { 
    formData, 
    handleInputChange, 
    handleSelectChange, 
    handleCreateGame 
  } = useGameForm(router);

  if (!isConnected) {
    return <div className="text-center p-4">Non connecté au serveur</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[600px] p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Love Letter</h2>
        <div className="space-y-6">
          <form onSubmit={handleCreateGame} className="space-y-6">
            <FormField
              label="Nom de la partie"
              description="Choisissez un nom unique pour votre partie."
            >
              <Input
                id="gameName"
                name="gameName"
                value={formData.gameName}
                onChange={handleInputChange}
                placeholder="Ma partie de Love Letter"
                className="mt-1 w-full"
              />
            </FormField>

            <FormField
              label="Nombre de joueurs"
              description="Choisissez le nombre de joueurs pour cette partie."
            >
              <Select
                onValueChange={handleSelectChange}
                value={formData.numPlayers}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Sélectionnez le nombre de joueurs" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_COUNTS.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} joueurs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Votre nom"
              description="Entrez votre nom pour cette partie."
            >
              <Input
                id="creatorName"
                name="creatorName"
                value={formData.creatorName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="mt-1 w-full"
              />
            </FormField>

            <Button type="submit" className="w-full">
              Créer une nouvelle partie
            </Button>
          </form>

          <GameFormDivider />

          <Button 
            onClick={() => router.push("/join-game")} 
            variant="outline" 
            className="w-full"
          >
            Rejoindre une partie existante
          </Button>
        </div>
      </div>
    </div>
  );
}
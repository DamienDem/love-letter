// pages/JoinGamePage.tsx
'use client';
import { useRouter } from "next/navigation";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useGameJoin } from "@/hooks/useGameJoin";
import { GameList } from "@/components/JoinGamePage/GameList";
import { JoinGameDialog } from "@/components/JoinGamePage/JoinGameDialog";
import { Button } from "@/components/ui/button";

export default function JoinGamePage() {
  const router = useRouter();
  const { isConnected } = useSocketConnection();
  const {
    games,
    isLoading,
    playerName,
    isModalOpen,
    setPlayerName,
    setIsModalOpen,
    handleJoinClick,
    handleJoinGame,
  } = useGameJoin(router);

  if (!isConnected) {
    return <div className="text-center p-4">Non connecté au serveur</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[600px] p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Parties disponibles
        </h2>
        
        <GameList 
          games={games}
          isLoading={isLoading}
          onJoinClick={handleJoinClick}
        />

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full"
          >
            Retour à la création de partie
          </Button>
        </div>

        <JoinGameDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          onJoin={handleJoinGame}
        />
      </div>
    </div>
  );
}
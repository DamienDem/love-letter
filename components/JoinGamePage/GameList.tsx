// components/JoinGamePage/GameList.tsx
'use client'
import { GameListState } from "@/lib/types";
import { GameListItem } from "./GameListItem";


interface GameListProps {
  games: GameListState[];
  isLoading: boolean;
  onJoinClick: (gameId: string) => void;
}

export const GameList: React.FC<GameListProps> = ({ games, isLoading, onJoinClick }) => {
  if (isLoading) {
    return <p>Chargement des parties en cours...</p>;
  }

  if (games.length === 0) {
    return <p>Aucune partie disponible pour le moment.</p>;
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameListItem 
          key={game.id} 
          game={game} 
          onJoinClick={onJoinClick} 
        />
      ))}
    </div>
  );
};
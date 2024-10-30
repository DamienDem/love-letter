// components/JoinGamePage/GameListItem.tsx
'use client';
import { GameListState } from "@/lib/types";
import { Button } from "../ui/button";

interface GameListItemProps {
    game: GameListState;
    onJoinClick: (gameId: string) => void;
  }
  
  export const GameListItem: React.FC<GameListItemProps> = ({ game, onJoinClick }) => (
    <div className="flex items-center justify-between p-4 border rounded">
      <div>
        <h3 className="font-semibold">{game.name}</h3>
        <p className="text-sm text-gray-500">
          {game.players}/{game.maxPlayers} joueurs
        </p>
      </div>
      {game.players < game.maxPlayers && (
        <Button onClick={() => onJoinClick(game.id)}>
          Rejoindre
        </Button>
      )}
    </div>
  );
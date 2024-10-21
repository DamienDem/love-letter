import React from 'react';
import { Player } from '@/lib/gameLogic';

interface GameTableProps {
  players: Player[];
  currentPlayerId: string;
  activePlayerId: string;
  onCardClick: () => void;
}

const GameTable: React.FC<GameTableProps> = ({
  players,
  currentPlayerId,
  activePlayerId,
  onCardClick,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {players.map((player) => (
        <div
          key={player.id}
          className={`p-4 border rounded ${
            player.id === activePlayerId ? 'bg-yellow-100' : ''
          }`}
        >
          <h3 className="font-bold">{player.name}</h3>
          <p>Points: {player.points}</p>
          {player.isProtected && (
            <p className="text-green-600 font-bold">Protected</p>
          )}
          {player.id === currentPlayerId && (
            <div>
              <h4>Your hand:</h4>
              {player.hand.map((card) => (
                <button
                  key={card.id}
                  onClick={onCardClick}
                  className="mr-2 p-2 border rounded"
                >
                  {card.type}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GameTable;
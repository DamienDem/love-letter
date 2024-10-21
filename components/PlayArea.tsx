import React from "react";
import Card from "./Card";
import { Player } from "@/lib/gameLogic";

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isActivePlayer: boolean;
  onCardClick: () => void;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  isCurrentPlayer,
  isActivePlayer,
  onCardClick,
}) => {
  return (
    <div
      className={`p-4 rounded-lg ${
        isActivePlayer ? "bg-yellow-200" : "bg-gray-200"
      } ${isCurrentPlayer ? "border-4 border-blue-500" : ""}`}
    >
      <h3 className="text-lg font-bold">{player.name}</h3>
      <p>Points: {player.points}</p>
      <div onClick={() =>onCardClick()} className="flex space-x-2 mt-2">
        {player.hand.map((card, index) => (
          <Card key={index} card={card} visible={isCurrentPlayer} />
        ))}
      </div>
      {player.isProtected && <p className="text-green-600 mt-2">Protégé</p>}
      {player.isEliminated && <p className="text-red-600 mt-2">Éliminé</p>}
    </div>
  );
};

export default PlayerArea;

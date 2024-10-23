import React from "react";
import { CardType, Player } from "@/lib/gameLogic";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils"; // Assurez-vous d'avoir cette fonction utilitaire pour combiner les classes

interface GameTableProps {
  players: Player[];
  currentPlayerId: string;
  activePlayerId: string;
  onCardClick: (cardId: string) => void;
}

const GameTable: React.FC<GameTableProps> = ({
  players,
  currentPlayerId,
  activePlayerId,
  onCardClick,
}) => {
  const mustPlayCountess = (hand: Player["hand"]) => {
    const hasCountess = hand.some((card) => card.type === CardType.Comtesse);
    const hasKingOrPrince = hand.some(
      (card) => card.type === CardType.Roi || card.type === CardType.Prince
    );
    return hasCountess && hasKingOrPrince;
  };

  const isCardDisabled = (player: Player, card: Player["hand"][0]) => {
    if (player.id !== activePlayerId) return true;
    if (mustPlayCountess(player.hand)) {
      return card.type !== CardType.Comtesse;
    }
    return false;
  };

  // Calculer les positions des joueurs autour de la table
  const getPlayerPosition = (index: number, totalPlayers: number) => {
    const angle = (index * (360 / totalPlayers) + 270) % 360; // Commence en haut
    const radius = 40; // Distance du centre en pourcentage
    const radian = (angle * Math.PI) / 180;
    
    return {
      left: `${50 + radius * Math.cos(radian)}%`,
      top: `${50 + radius * Math.sin(radian)}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="relative w-full h-[600px] bg-gray-900 p-8">
      {/* Table de poker */}
      <div className="absolute inset-8 rounded-[40%] bg-gradient-to-br from-green-800 to-green-700 shadow-2xl">
        {/* Bordure de la table */}
        <div className="absolute inset-4 rounded-[40%] bg-green-600 shadow-inner">
          {/* Surface de jeu */}
          <div className="absolute inset-2 rounded-[40%] bg-green-500">
            {/* Logo au centre */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                          text-3xl font-bold text-green-700 bg-green-400/20 
                          rounded-full p-8 select-none">
              LL
            </div>
          </div>
        </div>
      </div>

      {/* Positions des joueurs */}
      {players.map((player, index) => (
        <div
          key={player.id}
          className="absolute"
          style={getPlayerPosition(index, players.length)}
        >
          {/* Zone du joueur */}
          <div className={cn(
            "w-48 p-4 rounded-lg backdrop-blur-sm transition-all duration-300",
            player.id === activePlayerId ? "bg-yellow-500/20" : "bg-black/40",
            player.id === currentPlayerId && "scale-110"
          )}>
            {/* Nom et statut du joueur */}
            <div className="text-center mb-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-semibold",
                player.id === currentPlayerId ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200",
                player.isEliminated && "line-through opacity-50",
                player.isProtected && "ring-2 ring-yellow-400"
              )}>
                {player.name}
                <span className="ml-2 text-xs">({player.points} pts)</span>
              </span>
              {player.isProtected && (
                <div className="text-yellow-400 text-xs mt-1">Protected</div>
              )}
            </div>

            {/* Cartes du joueur */}
            {player.id === currentPlayerId && (
              <div className="flex justify-center gap-2 mt-2">
                {player.hand.map((card) => (
                  <Button
                    key={card.id}
                    onClick={() => onCardClick(card.id)}
                    disabled={isCardDisabled(player, card)}
                    className={cn(
                      "relative w-16 h-24 p-1 flex flex-col items-center justify-center",
                      "transition-transform hover:scale-105",
                      isCardDisabled(player, card) && "opacity-50",
                      "bg-white text-black border-2",
                      player.id === activePlayerId && !isCardDisabled(player, card) 
                        ? "border-yellow-400" 
                        : "border-gray-300"
                    )}
                  >
                    <div className="text-sm font-bold">{card.type}</div>
                    <div className="text-xs mt-1">Value: {card.value}</div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameTable;
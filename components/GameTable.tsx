import React from "react";
import { CardType, Player, Card } from "@/lib/gameLogic";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import DiscardPile from "./DiscardPile";

interface GameTableProps {
  players: Player[];
  currentPlayerId: string;
  activePlayerId: string;
  onCardClick: (cardId: string) => void;
  discardPile: Card[];
  deck: Card[];
}

const GameTable: React.FC<GameTableProps> = ({
  players,
  currentPlayerId,
  activePlayerId,
  onCardClick,
  discardPile,
  deck
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

  const getPlayerPosition = (index: number, totalPlayers: number) => {
    const angle = (index * (360 / totalPlayers) + 270) % 360;
    const radius = 37;
    const radian = (angle * Math.PI) / 180;
    
    return {
      left: `${50 + radius * Math.cos(radian)}%`,
      top: `${50 + radius * Math.sin(radian)}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="relative w-full h-screen bg-[#CABCA4] p-8">
      {/* Table de poker */}
      <div className="absolute inset-10 rounded-[40%] bg-[#222225] shadow-2xl"> {/* Bordure extérieure */}
        <div className="absolute inset-8 rounded-[40%] bg-[#184119] shadow-inner"> {/* Surface de jeu */}
          <div className="absolute inset-2 rounded-[40%] bg-gradient-to-br from-[#184119] to-[#184119]/90"> {/* Effet subtil de gradient */}
            {/* Centre de la table avec Deck et Discard Pile */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                          flex items-center gap-8">
              {/* Deck */}
              <div className="relative">
                {deck.length > 0 && (
                  <>
                    {[...Array(Math.min(3, deck.length))].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-16 h-24 rounded-lg bg-gradient-to-br from-red-800 to-red-600 border-2 border-[#222225]"
                        style={{
                          top: `${-i * 1}px`,
                          left: `${-i * 1}px`,
                          zIndex: -i
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-2xl text-white font-serif">♠</div>
                        </div>
                      </div>
                    ))}
                    <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-blue-600 
                                  flex items-center justify-center text-white text-sm font-bold
                                  border-2 border-white shadow-lg">
                      {deck.length}
                    </div>
                  </>
                )}
              </div>

              {/* Pile de défausse */}
              <div className="relative w-16 h-24">
                {discardPile.length > 0 && (
                  <>
                    <DiscardPile discardPile={discardPile}/>
                    <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-red-600 
                                  flex items-center justify-center text-white text-sm font-bold
                                  border-2 border-white shadow-lg">
                      {discardPile.length}
                    </div>
                  </>
                )}
              </div>
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
          <div className={cn(
            "w-48 p-4 rounded-lg backdrop-blur-sm transition-all duration-300",
            player.id === activePlayerId ? "bg-pink-600/20" : "bg-[#222225]/60",
            player.id === currentPlayerId && "scale-110"
          )}>
            <div className="text-center mb-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-semibold",
                player.id === currentPlayerId ? "bg-[#184119] text-white" : "bg-[#222225] text-gray-200",
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
                        : "border-[#222225]"
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
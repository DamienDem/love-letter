// components/PlayerActions.tsx
import React from "react";
import { Game, CardType, PlayerAction } from "@/lib/gameLogic";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerActionsProps {
  actions: PlayerAction[];
  players: Game["players"];
}

const PlayerActions: React.FC<PlayerActionsProps> = ({ actions, players }) => {
  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Unknown Player";
  };

  const formatAction = (action: PlayerAction) => {
    const playerName = getPlayerName(action.playerId);
    const targetName = action.targetPlayerId
      ? getPlayerName(action.targetPlayerId)
      : null;

    let actionText = `${playerName} a joué ${action.cardType}`;

    if (action.targetPlayerId) {
      actionText += ` sur ${targetName}`;

      if (action.cardType === CardType.Garde && action.guessedCard) {
        actionText += ` en devinant ${action.guessedCard}`;
        if (action.success !== undefined) {
          actionText += action.success ? " (Correct!)" : " (Raté!)";
        }
      }
    }

    return actionText;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-2">Historique des actions</h3>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {actions
            .slice()
            .reverse()
            .map((action) => (
              <div key={action.id} className="p-2 bg-gray-50 rounded text-sm">
                {formatAction(action)}
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlayerActions;

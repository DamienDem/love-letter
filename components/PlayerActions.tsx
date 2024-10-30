// components/PlayerActions.tsx
'use client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardType, IGameState, IPlayerAction } from "@/lib/types";

interface PlayerActionsProps {
  actions: IPlayerAction[];
  players: IGameState["players"];
}

const PlayerActions: React.FC<PlayerActionsProps> = ({ actions, players }) => {
  const getPlayer = (playerId: string) => {
    return players.find((p) => p.id === playerId);
  };

  const formatAction = (action: IPlayerAction) => {
    const player = getPlayer(action.playerId);
    const target = action.targetPlayerId
      ? getPlayer(action.targetPlayerId)
      : null;

    const PlayerName = ({ name }: { name: string }) => (
      <span className="text-[#a78c41] font-medium">{name}</span>
    );
    const ActionText = ({ text }: { text: string }) => (
      <span className="text-[#afafaf]">{text}</span>
    );
    let actionText: React.JSX.Element = <></>;

    if (action.targetPlayerId) {
      actionText = (
        <div>
          <PlayerName name={player!.name} />
          <ActionText text={` a ${action.cardType} sur ${target!.name} `} />
        </div>
      );
      if (action.cardType === CardType.Garde && action.guessedCard) {
        actionText = (
          <div>
            {actionText}
            {action.success ? (
              <ActionText text={`${target!.name} est éliminé avec ${action.guessedCard}`} />
            ) : (
              <ActionText
                text={`${target!.name} n'a pas ${action.guessedCard}`}
              />
            )}
          </div>
        );
      }
      if(action.cardType === CardType.Baron) {
        actionText = (
          <div>
            {actionText}
            {target?.isEliminated ? (
              <ActionText text={` et ${target!.name} a été éliminé`} />
            ) : player?.isEliminated ? (
              <ActionText text={` et ${player!.name} a été éliminé`} />
            ) : (
              <ActionText text={'les joueurs ont fait égalité'} />
            )}
          </div>
        )
      }
    } else {
      actionText = (
        <div>
          <PlayerName name={player!.name} />
          <ActionText text={` a joué ${action.cardType}`} />
        </div>
      );
    }

    return actionText;
  };

  return (
    <>
      <h3 className="bg-[#6B6B6B] w-full text-lg p-2 font-semibold">
        Historique
      </h3>
      <div className="bg-[#333333] h-[calc(100vh-44px)] shadow">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {actions
              .slice()
              .reverse()
              .map((action) => (
                <div
                  key={action.id}
                  className="p-2 bg-[#333333] rounded text-sm"
                >
                  {formatAction(action)}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default PlayerActions;

// types.ts
export enum CardType {
  Garde = "Garde",
  Espionne = "Espionne",
  Pretre = "Pretre",
  Baron = "Baron",
  Servante = "Servante",
  Prince = "Prince",
  Chancelier = "Chancelier",
  Roi = "Roi",
  Comtesse = "Comtesse",
  Princesse = "Princesse"
}

export interface ICard {
  id: string;
  type: CardType;
  value: number;
}
export type CardEffectResult = {
    gameState: IGameState;
    additionalData?: {
      revealedCard?: ICard;
      [key: string]: unknown;
    };
  };

  export interface CardEffectData {
    guard: { guessedCard: CardType };
    chancellor: ChancellorAction;
  }
export interface IPlayer {
  id: string;
  name: string;
  hand: ICard[];
  isEliminated: boolean;
  points: number;
  isProtected: boolean;
  socketId?: string;
}

export interface IGameState {
    id: string;
    name: string;
    players: IPlayer[];
    deck: ICard[];
    discardPile: ICard[];
    currentPlayerIndex: number;
    maxPlayers: number;
    roundWinner: IPlayer | null;
    gameWinner: IPlayer | null;
    playedEspionnes: string[];
    hiddenCard: ICard | null;
    chancellorDrawnCards: ICard[];
    currentRound: number;
    pointsToWin: number;
    isChancellorAction: boolean;
    actions: IPlayerAction[];
  }
export interface IPlayerAction {
  id: string;
  playerId: string;
  cardType: CardType;
  targetPlayerId?: string;
  guessedCard?: CardType;
  success?: boolean;
}
export interface ChancellorAction {
    selectedCardIndex: number;
    topCardIndex?: number;
  }
export interface IGameInitData {
  id: string;
  name: string;
  players: Array<{ id: string; name: string }>;
  maxPlayers: number;
  pointsToWin: number;
}

export type PriestResult = {
  game: IGameState;
  targetCard?: ICard;
};

export interface GameListState {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
}

export interface JoinGameData {
  gameId: string;
  player: Omit<IPlayer, 'hand' | 'isEliminated' | 'points' | 'isProtected'>;
}

export interface ModalContextProps {
  modalStates: {
    isPlayCardModalOpen: boolean;
    isPriestModalOpen: boolean;
    isChancelierModalOpen: boolean;
    selectedCardId: string | null;
    revealedCard: ICard | null;
    targetPlayer: string;
    priestPlayerId: string | null;
  };
  modalActions: {
    setIsPlayCardModalOpen: (value: boolean) => void;
    setIsPriestModalOpen: (value: boolean) => void;
    setIsChancelierModalOpen: (value: boolean) => void;
    setSelectedCardId: (value: string | null) => void;
    setRevealedCard: (value: ICard | null) => void;
    setTargetPlayer: (value: string) => void;
    setPriestPlayerId: (value: string | null) => void;
    closeAllModals: () => void;
  };
}
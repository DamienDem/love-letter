// types/game.ts

export enum CardType {
    Princess = 'Princess',
    Countess = 'Countess',
    King = 'King'
  }
  
  export interface Card {
    type: CardType;
    value: number;
  }
  
  export interface Player {
    id: string;
    name: string;
    hand: Card[];
    isProtected: boolean;
  }
  
  export interface Game {
    id: string;
    name: string;
    players: Player[];
    maxPlayers: number;
    deck: Card[];
    currentPlayerIndex: number;
    gameState: 'waiting' | 'playing' | 'finished';
  }
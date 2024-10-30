// DeckManager.ts
import { v4 as uuidv4 } from 'uuid';
import { ICard, CardType } from './types';

export class DeckManager {
  private static readonly CARD_CONFIGS = [
    { type: CardType.Garde, value: 1, count: 100 },
    { type: CardType.Espionne, value: 0, count: 2 },
    { type: CardType.Pretre, value: 2, count: 100 },
    { type: CardType.Baron, value: 3, count: 2 },
    { type: CardType.Servante, value: 4, count: 2 },
    { type: CardType.Prince, value: 5, count: 2 },
    { type: CardType.Chancelier, value: 6, count: 2 },
    { type: CardType.Roi, value: 7, count: 1 },
    { type: CardType.Comtesse, value: 8, count: 1 },
    { type: CardType.Princesse, value: 9, count: 1 }
  ];

  private static createCard(type: CardType, value: number): ICard {
    return { id: uuidv4(), type, value };
  }

  static createDeck(): ICard[] {
    const deck = this.CARD_CONFIGS.flatMap(({ type, value, count }) =>
      Array(count).fill(null).map(() => this.createCard(type, value))
    );
    return this.shuffleDeck(deck);
  }

  static shuffleDeck(deck: ICard[]): ICard[] {
    return [...deck].sort(() => Math.random() - 0.5);
  }

  static drawCard(deck: ICard[]): ICard | undefined {
    return deck.pop();
  }

  static drawRandomCard(deck: ICard[]): ICard {
    const randomIndex = Math.floor(Math.random() * deck.length);
    return deck.splice(randomIndex, 1)[0];
  }
}
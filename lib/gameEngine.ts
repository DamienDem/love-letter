// GameEngine.ts
import {
  IGameState,
  IGameInitData,
  IPlayer,
  ICard,
  CardType,
  CardEffectData,
  CardEffectResult,
} from "./types";


import { DeckManager } from "./deckManager";
import { CardEffectFactory } from "./cardEffect";

export class GameEngine {
  private state: IGameState;

  constructor(gameData: IGameInitData) {
    this.state = this.initializeGame(gameData);
  }

  private initializeGame(gameData: IGameInitData): IGameState {
    const deck = DeckManager.createDeck();
    const hiddenCard = DeckManager.drawRandomCard(deck);

    const players = gameData.players.map((p) => ({
      ...p,
      hand: [DeckManager.drawCard(deck)!],
      isEliminated: false,
      points: 0,
      isProtected: false,
    }));

    return {
      ...gameData,
      players,
      deck,
      discardPile: [],
      currentPlayerIndex: 0,
      roundWinner: null,
      gameWinner: null,
      playedEspionnes: [],
      hiddenCard,
      chancellorDrawnCards: [],
      currentRound: 1,
      isChancellorAction: false,
      actions: [],
    };
  }

  getState(): IGameState {
    return { ...this.state };
  }

  getPlayer(playerId: string): IPlayer | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  getCurrentPlayer(): IPlayer {
    return this.state.players[this.state.currentPlayerIndex];
  }

  moveCardsToDiscard(cards: ICard[]): void {
    this.state.discardPile.push(...cards);
  }

  playCardAndDiscard(playerId: string, cardType: CardType): IGameState {
    const player = this.getPlayer(playerId)!;
    const cardIndex = player.hand.findIndex((card) => card.type === cardType);
    const playedCard = player.hand.splice(cardIndex, 1)[0];
    this.moveCardsToDiscard([playedCard]);
    return this.state;
  }

  startTurn(): void {
    if (this.getCurrentPlayer().isEliminated) {
      this.finishTurn();
      this.startTurn();
      return;
    }

    if (this.state.deck.length === 0) {
      this.checkEndOfRound();
      return;
    }

    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.isProtected = false;
    const newCard = DeckManager.drawCard(this.state.deck);
    if (newCard) currentPlayer.hand.push(newCard);
  }

  playCard(
    playerId: string,
    cardType: CardType,
    targetPlayerId?: string,
    additionalData?: CardEffectData[keyof CardEffectData]
  ): CardEffectResult {
    if (this.state.players[this.state.currentPlayerIndex].id !== playerId) {
      throw new Error("Ce n'est pas le tour de ce joueur");
    }
  
    const effect = CardEffectFactory.getEffect(cardType);
    return effect.execute(this, playerId, targetPlayerId, additionalData as never);
  }

  checkEndOfRound(): void {
    const activePlayers = this.state.players.filter((p) => !p.isEliminated);

    if (
      activePlayers.length === 1 ||
      (this.state.deck.length === 0 &&
        activePlayers.every((p) => p.hand.length === 1))
    ) {
      this.handleRoundEnd(activePlayers);
    }
  }

  private handleRoundEnd(activePlayers: IPlayer[]): void {
    // Gestion des Espionnes
    this.handleEspionnes(activePlayers);

    // Détermination du gagnant
    const roundWinners = this.determineRoundWinners(activePlayers);
    this.awardPoints(roundWinners);

    // Vérification de la fin du jeu
    if (!this.checkGameEnd()) {
      this.startNewRound();
    }
  }

  private handleEspionnes(activePlayers: IPlayer[]): void {
    const activeEspionnes = activePlayers.filter((p) =>
      this.state.playedEspionnes.includes(p.id)
    );

    if (activeEspionnes.length === 1) {
      activeEspionnes[0].points++;
    }
  }

  private determineRoundWinners(activePlayers: IPlayer[]): IPlayer[] {
    if (activePlayers.length === 1) return [activePlayers[0]];

    const highestValue = Math.max(...activePlayers.map((p) => p.hand[0].value));
    return activePlayers.filter((p) => p.hand[0].value === highestValue);
  }

  private awardPoints(winners: IPlayer[]): void {
    winners.forEach((winner) => winner.points++);
    this.state.roundWinner = winners.length === 1 ? winners[0] : null;
  }

  private checkGameEnd(): boolean {
    const winners = this.state.players.filter(
      (p) => p.points >= this.state.pointsToWin
    );
    if (winners.length > 0) {
      this.state.gameWinner = winners[0];
      return true;
    }
    return false;
  }

  startNewRound(): void {
    this.state.deck = DeckManager.createDeck();
    this.state.hiddenCard = DeckManager.drawRandomCard(this.state.deck);

    this.state.players.forEach((player) => {
      player.hand = [DeckManager.drawCard(this.state.deck)!];
      player.isEliminated = false;
      player.isProtected = false;
    });

    this.state.discardPile = [];
    this.state.playedEspionnes = [];
    this.state.chancellorDrawnCards = [];
    this.state.roundWinner = null;
    this.state.currentRound++;
    this.state.currentPlayerIndex =
      (this.state.currentPlayerIndex + 1) % this.state.players.length;
    this.state.isChancellorAction = false;
  }

  finishTurn(): void {
    if (this.state.isChancellorAction) return;

    let nextPlayerIndex = this.state.currentPlayerIndex;
    let hasCheckedAllPlayers = false;
    const initialIndex = nextPlayerIndex;

    do {
      nextPlayerIndex = (nextPlayerIndex + 1) % this.state.players.length;
      if (nextPlayerIndex === initialIndex) hasCheckedAllPlayers = true;
    } while (
      !hasCheckedAllPlayers &&
      this.state.players[nextPlayerIndex].isEliminated
    );

    if (this.state.players.filter((p) => !p.isEliminated).length <= 1) {
      this.checkEndOfRound();
    } else {
      this.state.currentPlayerIndex = nextPlayerIndex;
      this.state.players[nextPlayerIndex].isProtected = false;
    }
  }
}

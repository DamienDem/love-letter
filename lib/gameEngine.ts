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
    console.log("=== Starting Turn ===");
    if (this.getCurrentPlayer().isEliminated) {
      this.finishTurn();
      this.startTurn();
      return;
    }

    console.log("deck length:", this.state.deck.length);

    if (this.state.deck.length === 0) {
      console.log("Deck is empty, checking end of round");
      this.checkEndOfRound();
      return;
    }

    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.isProtected = false;
    const newCard = DeckManager.drawCard(this.state.deck);
    console.log("Drew new card:", newCard?.type);
    if (newCard) currentPlayer.hand.push(newCard);
  }

  startChancellorAction(): void {
    this.state.isChancellorAction = true;
  }
  endChancellorAction(): void {
    this.state.isChancellorAction = false;
  }
  setChancellorDrawnCards(cards: ICard[]): void {
    this.state.chancellorDrawnCards = cards;
  }
  clearChancellorDrawnCards(): void {
    this.state.chancellorDrawnCards = [];
  }
  addCardsToDeck(cards: ICard[]): void {
    cards.reverse().forEach((card) => {
      this.state.deck.unshift(card);
    });
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
    const result = effect.execute(
      this,
      playerId,
      targetPlayerId,
      additionalData as never
    );

    if (
      !(cardType === CardType.Chancelier && !additionalData) ||
      (cardType === CardType.Chancelier && this.getState().deck.length === 0)
    ) {
      this.finishTurn();
    }
    return result;
  }

  checkEndOfRound(): void {
    console.log("=== Checking End of Round ===");
    const activePlayers = this.state.players.filter((p) => !p.isEliminated);
    console.log(
      "Active players:",
      activePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        handValue: p.hand[0]?.value,
        isEliminated: p.isEliminated,
      }))
    );
    console.log("Deck length:", this.state.deck.length);
    console.log(
      "All players have one card:",
      activePlayers.every((p) => p.hand.length === 1)
    );

    if (
      activePlayers.length === 1 ||
      (this.state.deck.length === 0 &&
        activePlayers.every((p) => p.hand.length === 1))
    ) {
      console.log(">>> Ending round");
      this.handleRoundEnd(activePlayers);
    } else {
      console.log(">>> Round continues");
    }
  }

  private handleRoundEnd(activePlayers: IPlayer[]): void {
    console.log("=== Handling Round End ===");
    // Gestion des Espionnes
    this.handleEspionnes(activePlayers);

    // Détermination du gagnant
    const roundWinners = this.determineRoundWinners(activePlayers);
    console.log(
      "Round winners:",
      roundWinners.map((w) => ({
        id: w.id,
        name: w.name,
        cardValue: w.hand[0]?.value,
      }))
    );
    this.awardPoints(roundWinners);

    // Vérification de la fin du jeu
    if (!this.checkGameEnd()) {
      console.log(">>> Starting new round");

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
    console.log("=== Finishing Turn ===");
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
      console.log("Only one or no players active, checking round end");
      this.checkEndOfRound();
    } else {
      console.log("Setting next player index to:", nextPlayerIndex);
      this.state.currentPlayerIndex = nextPlayerIndex;
      this.state.players[nextPlayerIndex].isProtected = false;
    }
  }
}

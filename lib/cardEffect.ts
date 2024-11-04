import { DeckManager } from "./deckManager";
import { GameEngine } from "./gameEngine";
import { CardType, CardEffectData, CardEffectResult } from "./types";

export abstract class CardEffect<
  T extends keyof CardEffectData | never = never
> {
  abstract execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string,
    additionalData?: CardEffectData[T]
  ): CardEffectResult;

  protected validateBasicConditions(
    game: GameEngine,
    playerId: string,
    cardType: CardType
  ): void {
    const player = game.getPlayer(playerId);
    if (!player) throw new Error("Joueur non trouvé");
    if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");

    const hasCard = player.hand.some((card) => card.type === cardType);
    if (!hasCard) throw new Error(`Le joueur n'a pas de ${cardType} en main`);
  }

  protected validateTarget(game: GameEngine, targetPlayerId: string): void {
    const target = game.getPlayer(targetPlayerId);
    if (!target) throw new Error("Joueur cible non trouvé");
    if (target.isEliminated)
      throw new Error("Le joueur cible est déjà éliminé");
    if (target.isProtected)
      throw new Error("Le joueur ciblé est protégé par la Servante");
  }
}

export class GardeEffect extends CardEffect<"guard"> {
  execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string,
    guardData?: CardEffectData["guard"]
  ): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Garde);
    const gameState = game.playCardAndDiscard(playerId, CardType.Garde);

    if (targetPlayerId && guardData) {
      this.validateTarget(game, targetPlayerId);
      const targetPlayer = game.getPlayer(targetPlayerId)!;

      if (
        guardData.guessedCard !== CardType.Garde &&
        targetPlayer.hand[0].type === guardData.guessedCard
      ) {
        targetPlayer.isEliminated = true;
        game.moveCardsToDiscard(targetPlayer.hand);
        targetPlayer.hand = [];
      }
    }

    return { gameState };
  }
}

export class EspionneEffect extends CardEffect {
  execute(game: GameEngine, playerId: string): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Espionne);
    const gameState = game.playCardAndDiscard(playerId, CardType.Espionne);
    gameState.playedEspionnes.push(playerId);
    return { gameState };
  }
}

export class PretreEffect extends CardEffect {
  execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string
  ): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Pretre);
    const gameState = game.playCardAndDiscard(playerId, CardType.Pretre);

    if (targetPlayerId) {
      this.validateTarget(game, targetPlayerId);
      const targetPlayer = game.getPlayer(targetPlayerId)!;
      return {
        gameState,
        additionalData: {
          revealedCard: targetPlayer.hand[0],
        },
      };
    }

    return { gameState };
  }
}

export class BaronEffect extends CardEffect {
  execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string
  ): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Baron);
    const gameState = game.playCardAndDiscard(playerId, CardType.Baron);

    if (targetPlayerId) {
      this.validateTarget(game, targetPlayerId);
      const player = game.getPlayer(playerId)!;
      const targetPlayer = game.getPlayer(targetPlayerId)!;

      if (player.hand[0].value < targetPlayer.hand[0].value) {
        player.isEliminated = true;
        game.moveCardsToDiscard(player.hand);
        player.hand = [];
      } else if (player.hand[0].value > targetPlayer.hand[0].value) {
        targetPlayer.isEliminated = true;
        game.moveCardsToDiscard(targetPlayer.hand);
        targetPlayer.hand = [];
      }
    }

    return { gameState };
  }
}

export class ServanteEffect extends CardEffect {
  execute(game: GameEngine, playerId: string): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Servante);
    const gameState = game.playCardAndDiscard(playerId, CardType.Servante);
    const player = game.getPlayer(playerId)!;
    player.isProtected = true;
    return { gameState };
  }
}

export class PrinceEffect extends CardEffect {
  execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string
  ): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Prince);
    const gameState = game.playCardAndDiscard(playerId, CardType.Prince);

    if (targetPlayerId) {
      this.validateTarget(game, targetPlayerId);
      const targetPlayer = game.getPlayer(targetPlayerId)!;
      const discardedCard = targetPlayer.hand.pop()!;
      game.moveCardsToDiscard([discardedCard]);

      if (discardedCard.type === CardType.Princesse) {
        targetPlayer.isEliminated = true;
      } else {
        if (gameState.deck.length > 0) {
          targetPlayer.hand.push(DeckManager.drawCard(gameState.deck)!);
        } else if (gameState.hiddenCard) {
          targetPlayer.hand.push(gameState.hiddenCard);
          gameState.hiddenCard = null;
        }
      }
    }

    return { gameState };
  }
}

export class ChancelierEffect extends CardEffect<"chancellor"> {
  execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string,
    chancellorAction?: CardEffectData["chancellor"]
  ): CardEffectResult {
    const gameState = game.getState();
    const player = game.getPlayer(playerId)!;

    // Phase initiale
    if (!chancellorAction) {
      this.validateBasicConditions(game, playerId, CardType.Chancelier);
      if (gameState.deck.length > 0) {
        game.startChancellorAction();
      }
      game.playCardAndDiscard(playerId, CardType.Chancelier);

      if (gameState.deck.length === 0) return { gameState };

      const originalCard = player.hand[0];
      player.hand = [];
      gameState.chancellorDrawnCards = [];

      // Piocher au maximum 2 cartes
      const cardsToDrawCount = Math.min(2, gameState.deck.length);
      for (let i = 0; i < cardsToDrawCount; i++) {
        gameState.chancellorDrawnCards.push(
          DeckManager.drawCard(gameState.deck)!
        );
      }

      if (originalCard) {
        gameState.chancellorDrawnCards.push(originalCard);
      }

      game.setChancellorDrawnCards(gameState.chancellorDrawnCards);

      return { gameState };
    }

    // Phase de résolution
    if (!gameState.isChancellorAction) {
      throw new Error("Aucune action de Chancelier n'est en cours");
    }

    const { selectedCardIndex, topCardIndex } = chancellorAction;
    if (
      selectedCardIndex < 0 ||
      selectedCardIndex >= gameState.chancellorDrawnCards.length
    ) {
      throw new Error("Index de la carte sélectionnée invalide");
    }

    player.hand = [gameState.chancellorDrawnCards[selectedCardIndex]];
    const remainingCards = gameState.chancellorDrawnCards.filter(
      (_, i) => i !== selectedCardIndex
    );

    if (remainingCards.length === 1) {
      gameState.deck.unshift(remainingCards[0]);
    } else if (remainingCards.length === 2 && topCardIndex !== undefined) {
      if (topCardIndex === 0 || topCardIndex === 1) {
        const [first, second] =
          topCardIndex === 0 ? remainingCards : remainingCards.reverse();
        gameState.deck.unshift(second);
        gameState.deck.unshift(first);
      } else {
        throw new Error("Index de la carte du dessus invalide");
      }
    }

    game.clearChancellorDrawnCards();
    game.endChancellorAction();

    return { gameState };
  }
}

export class RoiEffect extends CardEffect {
  execute(
    game: GameEngine,
    playerId: string,
    targetPlayerId?: string
  ): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Roi);
    const gameState = game.playCardAndDiscard(playerId, CardType.Roi);

    if (targetPlayerId) {
      this.validateTarget(game, targetPlayerId);
      const player = game.getPlayer(playerId)!;
      const targetPlayer = game.getPlayer(targetPlayerId)!;

      // Échanger les mains
      const tempHand = player.hand;
      player.hand = targetPlayer.hand;
      targetPlayer.hand = tempHand;
    }

    return { gameState };
  }
}

export class ComtesseEffect extends CardEffect {
  execute(game: GameEngine, playerId: string): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Comtesse);
    const gameState = game.playCardAndDiscard(playerId, CardType.Comtesse);
    return { gameState };
  }
}

export class PrincesseEffect extends CardEffect {
  execute(game: GameEngine, playerId: string): CardEffectResult {
    this.validateBasicConditions(game, playerId, CardType.Princesse);
    const gameState = game.playCardAndDiscard(playerId, CardType.Princesse);

    const player = game.getPlayer(playerId)!;
    player.isEliminated = true;

    return { gameState };
  }
}

export class CardEffectFactory {
  private static effects: Map<CardType, CardEffect> = new Map([
    [CardType.Garde, new GardeEffect()],
    [CardType.Espionne, new EspionneEffect()],
    [CardType.Pretre, new PretreEffect()],
    [CardType.Baron, new BaronEffect()],
    [CardType.Servante, new ServanteEffect()],
    [CardType.Prince, new PrinceEffect()],
    [CardType.Chancelier, new ChancelierEffect()],
    [CardType.Roi, new RoiEffect()],
    [CardType.Comtesse, new ComtesseEffect()],
    [CardType.Princesse, new PrincesseEffect()],
  ]);

  static getEffect(cardType: CardType): CardEffect {
    const effect = this.effects.get(cardType);
    if (!effect)
      throw new Error(`Effet non trouvé pour le type de carte ${cardType}`);
    return effect;
  }
}

import { IPlayer, CardType, ICard, IGameState } from './types';

export class GameUtils {
  /**
   * Vérifie si un joueur doit jouer la Comtesse
   * @param hand La main du joueur
   * @returns true si le joueur doit jouer la Comtesse
   */
  static mustPlayComtesse(hand: ICard[]): boolean {
    const hasComtesse = hand.some(card => card.type === CardType.Comtesse);
    const hasPrinceOrKing = hand.some(
      card => card.type === CardType.Prince || card.type === CardType.Roi
    );
    return hasComtesse && hasPrinceOrKing;
  }

  /**
   * Vérifie si une manche est terminée
   * @param game État du jeu
   * @returns true si la manche est terminée
   */
  static isRoundOver(game: IGameState): boolean {
    const activePlayers = game.players.filter(p => !p.isEliminated);
    return (
      activePlayers.length === 1 ||
      (game.deck.length === 0 && activePlayers.every(p => p.hand.length === 1))
    );
  }

  /**
   * Récupère les joueurs actifs
   * @param game État du jeu
   * @returns Liste des joueurs actifs
   */
  static getActivePlayers(game: IGameState): IPlayer[] {
    return game.players.filter(p => !p.isEliminated);
  }

  /**
   * Détermine les gagnants d'une manche
   * @param game État du jeu
   * @returns Liste des gagnants de la manche
   */
  static getRoundWinners(game: IGameState): IPlayer[] {
    const activePlayers = this.getActivePlayers(game);

    if (activePlayers.length === 1) {
      return activePlayers;
    }

    const highestValue = Math.max(...activePlayers.map(p => p.hand[0].value));
    return activePlayers.filter(p => p.hand[0].value === highestValue);
  }

  /**
   * Vérifie si un joueur peut être ciblé
   * @param player Le joueur à vérifier
   * @returns true si le joueur peut être ciblé
   */
  static isTargetable(player: IPlayer): boolean {
    return !player.isEliminated && !player.isProtected;
  }

  /**
   * Récupère les joueurs ciblables
   * @param game État du jeu
   * @param currentPlayerId ID du joueur courant
   * @returns Liste des joueurs ciblables
   */
  static getTargetablePlayers(game: IGameState, currentPlayerId: string): IPlayer[] {
    return game.players.filter(
      p => p.id !== currentPlayerId && this.isTargetable(p)
    );
  }

  /**
   * Vérifie si une carte peut être jouée
   * @param card La carte à vérifier
   * @param hand La main du joueur
   * @returns true si la carte peut être jouée
   */
  static canPlayCard(card: ICard, hand: ICard[]): boolean {
    if (this.mustPlayComtesse(hand)) {
      return card.type === CardType.Comtesse;
    }

    return true;
  }

  /**
   * Vérifie si un joueur a gagné la partie
   * @param game État du jeu
   * @returns Le joueur gagnant ou null
   */
  static getGameWinner(game: IGameState): IPlayer | null {
    const winners = game.players.filter(p => p.points >= game.pointsToWin);
    return winners.length === 1 ? winners[0] : null;
  }

  /**
   * Calcule le score final des joueurs
   * @param game État du jeu
   * @returns Map des scores par joueur
   */
  static getFinalScores(game: IGameState): Map<string, number> {
    const scores = new Map<string, number>();
    game.players.forEach(player => {
      scores.set(player.id, player.points);
    });
    return scores;
  }

  /**
   * Vérifie si un joueur peut effectuer une action
   * @param game État du jeu
   * @param playerId ID du joueur
   * @returns true si le joueur peut jouer
   */
  static canPlayerAct(game: IGameState, playerId: string): boolean {
    return (
      game.currentPlayerIndex >= 0 &&
      game.players[game.currentPlayerIndex].id === playerId &&
      !game.players[game.currentPlayerIndex].isEliminated &&
      !game.roundWinner &&
      !game.gameWinner
    );
  }

  /**
   * Obtient la liste des cartes jouables pour un joueur
   * @param player Le joueur
   * @returns Liste des cartes jouables
   */
  static getPlayableCards(player: IPlayer): ICard[] {
    if (this.mustPlayComtesse(player.hand)) {
      return player.hand.filter(card => card.type === CardType.Comtesse);
    }
    return player.hand;
  }

  /**
   * Vérifie si une action est valide pour une carte
   * @param card La carte à jouer
   * @param targetPlayer Le joueur ciblé (optionnel)
   * @returns true si l'action est valide
   */
  static isValidCardAction(card: ICard, targetPlayer?: IPlayer): boolean {
    // Cartes qui nécessitent une cible
    const requiresTarget = [
      CardType.Garde,
      CardType.Pretre,
      CardType.Baron,
      CardType.Prince,
      CardType.Roi
    ];

    // Cartes qui ne peuvent pas avoir de cible
    const cannotHaveTarget = [
      CardType.Espionne,
      CardType.Servante,
      CardType.Comtesse,
      CardType.Princesse
    ];

    if (requiresTarget.includes(card.type) && !targetPlayer) {
      return false;
    }

    if (cannotHaveTarget.includes(card.type) && targetPlayer) {
      return false;
    }

    return true;
  }

  /**
   * Récapitulatif des actions d'une manche
   * @param game État du jeu
   * @returns Résumé des actions
   */
  static getRoundSummary(game: IGameState): string {
    let summary = `Manche ${game.currentRound}\n`;
    summary += `Cartes restantes dans le deck: ${game.deck.length}\n`;
    summary += `Joueurs actifs: ${this.getActivePlayers(game).map(p => p.name).join(', ')}\n`;
    summary += `Dernières actions:\n`;
    
    // Prendre les 5 dernières actions
    const recentActions = game.actions.slice(-5);
    recentActions.forEach(action => {
      const player = game.players.find(p => p.id === action.playerId);
      const target = action.targetPlayerId 
        ? game.players.find(p => p.id === action.targetPlayerId)
        : null;
      
      summary += `- ${player?.name} joue ${action.cardType}`;
      if (target) {
        summary += ` sur ${target.name}`;
      }
      if (action.success !== undefined) {
        summary += ` (${action.success ? 'Succès' : 'Échec'})`;
      }
      summary += '\n';
    });

    return summary;
  }
}
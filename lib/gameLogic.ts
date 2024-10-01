// lib/gameLogic.ts

export enum CardType {
  Garde = 'Garde',
  Espionne = 'Espionne',
  Pretre = 'Pretre',
  Baron = 'Baron',
  Servante = 'Servante',
  Prince = 'Prince',
  Chancelier = 'Chancelier',
  Roi = 'Roi',
  Comtesse = 'Comtesse',
  Princesse = 'Princesse',
}

export interface Card {
  type: CardType;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isEliminated: boolean;
  points: number;
  isProtected: boolean;
}

export interface Game {
  id: string;
  name: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  maxPlayers: number;
  roundWinner: Player | null;
  gameWinner: Player | null;
  playedEspionnes: string[];
  hiddenCard: Card | null;
  chancellorDrawnCards: Card[];
  currentRound: number;
  pointsToWin: number;
}

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  deck.push(...Array(6).fill({ type: CardType.Garde, value: 1 }));
  deck.push(...Array(2).fill({ type: CardType.Espionne, value: 0 }));
  deck.push(...Array(2).fill({ type: CardType.Pretre, value: 2 }));
  deck.push(...Array(2).fill({ type: CardType.Baron, value: 3 }));
  deck.push(...Array(2).fill({ type: CardType.Servante, value: 4 }));
  deck.push(...Array(2).fill({ type: CardType.Prince, value: 5 }));
  deck.push(...Array(2).fill({ type: CardType.Chancelier, value: 6 }));
  deck.push({ type: CardType.Roi, value: 7 });
  deck.push({ type: CardType.Comtesse, value: 8 });
  deck.push({ type: CardType.Princesse, value: 9 });
  return shuffleDeck(deck);
};

const shuffleDeck = (deck: Card[]): Card[] => {
  return deck.sort(() => Math.random() - 0.5);
};

export const initializeGame = (gameData: { id: string; name: string; players: { id: string; name: string }[]; maxPlayers: number; pointsToWin: number }): Game => {
  const deck = createDeck();
  const hiddenCardIndex = Math.floor(Math.random() * deck.length);
  const hiddenCard = deck.splice(hiddenCardIndex, 1)[0];

  const players: Player[] = gameData.players.map(p => ({
    ...p,
    hand: [deck.pop()!],
    isEliminated: false,
    points: 0,
    isProtected: false
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
    pointsToWin: gameData.pointsToWin
  };
};

export const startNewRound = (game: Game): Game => {
  game.deck = createDeck();
  const hiddenCardIndex = Math.floor(Math.random() * game.deck.length);
  game.hiddenCard = game.deck.splice(hiddenCardIndex, 1)[0];

  game.players.forEach(player => {
    player.hand = [game.deck.pop()!];
    player.isEliminated = false;
    player.isProtected = false;
  });

  game.discardPile = [];
  game.playedEspionnes = [];
  game.chancellorDrawnCards = [];
  game.roundWinner = null;
  game.currentRound++;
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

  return game;
};

export const startTurn = (game: Game): Game => {
  const currentPlayer = game.players[game.currentPlayerIndex];
  currentPlayer.isProtected = false;

  if (currentPlayer.isEliminated) {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    return startTurn(game);
  }

  if (game.deck.length === 0) {
    return checkEndOfRound(game);
  }

  const newCard = game.deck.pop()!;
  currentPlayer.hand.push(newCard);

  return game;
};

export const checkEndOfRound = (game: Game): Game => {
  const activePlayers = game.players.filter(p => !p.isEliminated);

  if (activePlayers.length === 1 || game.deck.length === 0) {
    const activeEspionnes = activePlayers.filter(p => game.playedEspionnes.includes(p.id));
    if (activeEspionnes.length === 1) {
      const espionneWinner = activeEspionnes[0];
      espionneWinner.points++;
      console.log(`${espionneWinner.name} gagne un point pour être la seule Espionne en jeu.`);
    }

    let roundWinners: Player[];

    if (activePlayers.length === 1) {
      roundWinners = [activePlayers[0]];
    } else {
      const highestValue = Math.max(...activePlayers.map(p => p.hand[0].value));
      roundWinners = activePlayers.filter(p => p.hand[0].value === highestValue);
    }

    roundWinners.forEach(winner => {
      winner.points++;
      console.log(`${winner.name} gagne la manche et un point.`);
    });

    game.roundWinner = roundWinners.length === 1 ? roundWinners[0] : null;

    const winners = game.players.filter(p => p.points >= game.pointsToWin);
    if (winners.length > 0) {
      game.gameWinner = winners.reduce((prev, current) => 
        (prev.points > current.points) ? prev : current
      );
      console.log(`${game.gameWinner.name} gagne la partie avec ${game.gameWinner.points} points!`);
    } else {
      game = startNewRound(game);
    }
  }

  return game;
};

export const playGuard = (game: Game, playerId: string, targetPlayerId: string, guessedCard: CardType): Game => {
  const player = game.players.find(p => p.id === playerId);
  const targetPlayer = game.players.find(p => p.id === targetPlayerId);

  if (!player || !targetPlayer) throw new Error("Joueur non trouvé");
  if (player.isEliminated || targetPlayer.isEliminated) throw new Error("Un des joueurs est déjà éliminé");
  if (targetPlayer.isProtected) throw new Error("Le joueur ciblé est protégé par la Servante");

  const guardIndex = player.hand.findIndex(card => card.type === CardType.Garde);
  if (guardIndex === -1) throw new Error("Le joueur n'a pas de Garde en main");

  const playedCard = player.hand.splice(guardIndex, 1)[0];
  game.discardPile.push(playedCard);

  if (targetPlayer.hand[0].type === guessedCard && guessedCard !== CardType.Garde) {
    targetPlayer.isEliminated = true;
  }

  return game;
};

export const playEspionne = (game: Game, playerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);

  if (!player) throw new Error("Joueur non trouvé");
  if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");

  const espionneIndex = player.hand.findIndex(card => card.type === CardType.Espionne);
  if (espionneIndex === -1) throw new Error("Le joueur n'a pas d'Espionne en main");

  const playedCard = player.hand.splice(espionneIndex, 1)[0];
  game.discardPile.push(playedCard);
  game.playedEspionnes.push(playerId);

  return game;
};

export const playPretre = (game: Game, playerId: string, targetPlayerId: string): { game: Game; targetCard: Card } => {
  const player = game.players.find(p => p.id === playerId);
  const targetPlayer = game.players.find(p => p.id === targetPlayerId);

  if (!player || !targetPlayer) throw new Error("Joueur non trouvé");
  if (player.isEliminated || targetPlayer.isEliminated) throw new Error("Un des joueurs est déjà éliminé");
  if (targetPlayer.isProtected) throw new Error("Le joueur ciblé est protégé par la Servante");

  const pretreIndex = player.hand.findIndex(card => card.type === CardType.Pretre);
  if (pretreIndex === -1) throw new Error("Le joueur n'a pas de Prêtre en main");

  const playedCard = player.hand.splice(pretreIndex, 1)[0];
  game.discardPile.push(playedCard);

  return { game, targetCard: targetPlayer.hand[0] };
};

export const playBaron = (game: Game, playerId: string, targetPlayerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);
  const targetPlayer = game.players.find(p => p.id === targetPlayerId);

  if (!player || !targetPlayer) throw new Error("Joueur non trouvé");
  if (player.isEliminated || targetPlayer.isEliminated) throw new Error("Un des joueurs est déjà éliminé");
  if (targetPlayer.isProtected) throw new Error("Le joueur ciblé est protégé par la Servante");

  const baronIndex = player.hand.findIndex(card => card.type === CardType.Baron);
  if (baronIndex === -1) throw new Error("Le joueur n'a pas de Baron en main");

  const playedCard = player.hand.splice(baronIndex, 1)[0];
  game.discardPile.push(playedCard);

  if (player.hand[0].value < targetPlayer.hand[0].value) {
    player.isEliminated = true;
  } else if (player.hand[0].value > targetPlayer.hand[0].value) {
    targetPlayer.isEliminated = true;
  }

  return game;
};

export const playServante = (game: Game, playerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);

  if (!player) throw new Error("Joueur non trouvé");
  if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");

  const servanteIndex = player.hand.findIndex(card => card.type === CardType.Servante);
  if (servanteIndex === -1) throw new Error("Le joueur n'a pas de Servante en main");

  const playedCard = player.hand.splice(servanteIndex, 1)[0];
  game.discardPile.push(playedCard);

  player.isProtected = true;

  return game;
};

export const playPrince = (game: Game, playerId: string, targetPlayerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);
  const targetPlayer = game.players.find(p => p.id === targetPlayerId);

  if (!player || !targetPlayer) throw new Error("Joueur non trouvé");
  if (player.isEliminated || targetPlayer.isEliminated) throw new Error("Un des joueurs est déjà éliminé");
  if (targetPlayer.isProtected) throw new Error("Le joueur ciblé est protégé par la Servante");

  const princeIndex = player.hand.findIndex(card => card.type === CardType.Prince);
  if (princeIndex === -1) throw new Error("Le joueur n'a pas de Prince en main");

  const playedCard = player.hand.splice(princeIndex, 1)[0];
  game.discardPile.push(playedCard);

  const discardedCard = targetPlayer.hand.pop()!;
  game.discardPile.push(discardedCard);

  if (discardedCard.type === CardType.Princesse) {
    targetPlayer.isEliminated = true;
  } else {
    if (game.deck.length > 0) {
      const newCard = game.deck.pop()!;
      targetPlayer.hand.push(newCard);
    } else if (game.hiddenCard) {
      targetPlayer.hand.push(game.hiddenCard);
      game.hiddenCard = null;
    }
  }

  return game;
};

export const playChancelier = (game: Game, playerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);

  if (!player) throw new Error("Joueur non trouvé");
  if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");

  const chancelierIndex = player.hand.findIndex(card => card.type === CardType.Chancelier);
  if (chancelierIndex === -1) throw new Error("Le joueur n'a pas de Chancelier en main");

  const playedCard = player.hand.splice(chancelierIndex, 1)[0];
  game.discardPile.push(playedCard);

  const cardsToDrawCount = Math.min(2, game.deck.length);
  for (let i = 0; i < cardsToDrawCount; i++) {
    const drawnCard = game.deck.pop()!;
    game.chancellorDrawnCards.push(drawnCard);
  }

  return game;
};

export const finishChancelierTurn = (game: Game, playerId: string, keptCardIndex: number, cardOrder: number[]): Game => {
  const player = game.players.find(p => p.id === playerId);

  if (!player) throw new Error("Joueur non trouvé");
  if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");
  if (game.chancellorDrawnCards.length === 0) throw new Error("Aucune carte n'a été piochée par le Chancelier");
  if (keptCardIndex < 0 || keptCardIndex >= game.chancellorDrawnCards.length) throw new Error("Index de la carte gardée invalide");
  if (cardOrder.length !== game.chancellorDrawnCards.length - 1) throw new Error("L'ordre des cartes à remettre sous le deck est invalide");

  // Garder la carte choisie
  const keptCard = game.chancellorDrawnCards[keptCardIndex];
  player.hand.push(keptCard);

  // Remettre les autres cartes sous le deck dans l'ordre spécifié
  const cardsToReturn = game.chancellorDrawnCards.filter((_, index) => index !== keptCardIndex);
  for (const index of cardOrder) {
    game.deck.unshift(cardsToReturn[index]);
  }

  // Vider les cartes piochées par le Chancelier
  game.chancellorDrawnCards = [];

  // Passer au joueur suivant
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

  return startTurn(game);
};

export const playRoi = (game: Game, playerId: string, targetPlayerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);
  const targetPlayer = game.players.find(p => p.id === targetPlayerId);

  if (!player || !targetPlayer) throw new Error("Joueur non trouvé");
  if (player.isEliminated || targetPlayer.isEliminated) throw new Error("Un des joueurs est déjà éliminé");
  if (targetPlayer.isProtected) throw new Error("Le joueur ciblé est protégé par la Servante");

  const roiIndex = player.hand.findIndex(card => card.type === CardType.Roi);
  if (roiIndex === -1) throw new Error("Le joueur n'a pas de Roi en main");

  const playedCard = player.hand.splice(roiIndex, 1)[0];
  game.discardPile.push(playedCard);

  // Échanger les mains
  const tempHand = player.hand;
  player.hand = targetPlayer.hand;
  targetPlayer.hand = tempHand;

  return game;
};

export const playComtesse = (game: Game, playerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);

  if (!player) throw new Error("Joueur non trouvé");
  if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");

  const comtesseIndex = player.hand.findIndex(card => card.type === CardType.Comtesse);
  if (comtesseIndex === -1) throw new Error("Le joueur n'a pas de Comtesse en main");

  const playedCard = player.hand.splice(comtesseIndex, 1)[0];
  game.discardPile.push(playedCard);

  return game;
};

export const playPrincesse = (game: Game, playerId: string): Game => {
  const player = game.players.find(p => p.id === playerId);

  if (!player) throw new Error("Joueur non trouvé");
  if (player.isEliminated) throw new Error("Le joueur est déjà éliminé");

  const princesseIndex = player.hand.findIndex(card => card.type === CardType.Princesse);
  if (princesseIndex === -1) throw new Error("Le joueur n'a pas de Princesse en main");

  const playedCard = player.hand.splice(princesseIndex, 1)[0];
  game.discardPile.push(playedCard);

  player.isEliminated = true;

  return game;
};

const mustPlayComtesse = (hand: Card[]): boolean => {
  const hasComtesse = hand.some(card => card.type === CardType.Comtesse);
  const hasPrinceOrKing = hand.some(card => card.type === CardType.Prince || card.type === CardType.Roi);
  return hasComtesse && hasPrinceOrKing;
};

export const playCard = (game: Game, playerId: string, cardType: CardType, targetPlayerId?: string, guessedCard?: CardType): Game | { game: Game; targetCard?: Card } => {
  if (game.players[game.currentPlayerIndex].id !== playerId) {
    throw new Error("Ce n'est pas le tour de ce joueur");
  }

  const player = game.players[game.currentPlayerIndex];

  if (mustPlayComtesse(player.hand) && cardType !== CardType.Comtesse) {
    throw new Error("Vous devez jouer la Comtesse lorsque vous avez le Roi ou le Prince en main");
  }

  let result;
  switch (cardType) {
    case CardType.Garde:
      if (!targetPlayerId || !guessedCard) {
        throw new Error("Le Garde nécessite une cible et une carte devinée");
      }
      result = playGuard(game, playerId, targetPlayerId, guessedCard);
      break;
    case CardType.Espionne:
      result = playEspionne(game, playerId);
      break;
    case CardType.Pretre:
      if (!targetPlayerId) {
        throw new Error("Le Prêtre nécessite une cible");
      }
      result = playPretre(game, playerId, targetPlayerId);
      break;
    case CardType.Baron:
      if (!targetPlayerId) {
        throw new Error("Le Baron nécessite une cible");
      }
      result = playBaron(game, playerId, targetPlayerId);
      break;
    case CardType.Servante:
      result = playServante(game, playerId);
      break;
    case CardType.Prince:
      if (!targetPlayerId) {
        throw new Error("Le Prince nécessite une cible");
      }
      result = playPrince(game, playerId, targetPlayerId);
      break;
    case CardType.Chancelier:
      result = playChancelier(game, playerId);
      break;
    case CardType.Roi:
      if (!targetPlayerId) {
        throw new Error("Le Roi nécessite une cible");
      }
      result = playRoi(game, playerId, targetPlayerId);
      break;
    case CardType.Comtesse:
      result = playComtesse(game, playerId);
      break;
    case CardType.Princesse:
      result = playPrincesse(game, playerId);
      break;
    default:
      throw new Error("Type de carte non reconnu");
  }

  if (cardType !== CardType.Chancelier && !player.isEliminated) {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    return startTurn(result instanceof Object && 'game' in result ? result.game : result);
  }

  return result;
};

export const playTurn = (game: Game, playerId: string, cardType: CardType, targetPlayerId?: string, guessedCard?: CardType): Game | { game: Game; targetCard?: Card } => {
  game = startTurn(game);
  game = checkEndOfRound(game);

  if (game.roundWinner || game.gameWinner) {
    return game;
  }

  const result = playCard(game, playerId, cardType, targetPlayerId, guessedCard);
  return checkEndOfRound(result instanceof Object && 'game' in result ? result.game : result);
};
// lib/gameLogic.ts
import { v4 as uuidv4 } from "uuid";
export var CardType;
(function (CardType) {
    CardType["Garde"] = "Garde";
    CardType["Espionne"] = "Espionne";
    CardType["Pretre"] = "Pretre";
    CardType["Baron"] = "Baron";
    CardType["Servante"] = "Servante";
    CardType["Prince"] = "Prince";
    CardType["Chancelier"] = "Chancelier";
    CardType["Roi"] = "Roi";
    CardType["Comtesse"] = "Comtesse";
    CardType["Princesse"] = "Princesse";
})(CardType || (CardType = {}));
const createDeck = () => {
    const deck = [];
    const addCards = (type, value, count) => {
        for (let i = 0; i < count; i++) {
            deck.push({ id: uuidv4(), type, value });
        }
    };
    addCards(CardType.Garde, 1, 6);
    addCards(CardType.Espionne, 0, 2);
    addCards(CardType.Pretre, 2, 2);
    addCards(CardType.Baron, 3, 2);
    addCards(CardType.Servante, 4, 2);
    addCards(CardType.Prince, 5, 2);
    addCards(CardType.Chancelier, 6, 2);
    addCards(CardType.Roi, 7, 1);
    addCards(CardType.Comtesse, 8, 1);
    addCards(CardType.Princesse, 9, 1);
    return shuffleDeck(deck);
};
const shuffleDeck = (deck) => {
    return deck.sort(() => Math.random() - 0.5);
};
export const initializeGame = (gameData) => {
    const deck = createDeck();
    const hiddenCardIndex = Math.floor(Math.random() * deck.length);
    const hiddenCard = deck.splice(hiddenCardIndex, 1)[0];
    const players = gameData.players.map((p) => ({
        ...p,
        hand: [deck.pop()],
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
        pointsToWin: gameData.pointsToWin,
        isChancellorAction: false,
        actions: []
    };
};
export const startNewRound = (game) => {
    game.deck = createDeck();
    const hiddenCardIndex = Math.floor(Math.random() * game.deck.length);
    game.hiddenCard = game.deck.splice(hiddenCardIndex, 1)[0];
    game.players.forEach((player) => {
        player.hand = [game.deck.pop()];
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
export const startTurn = (game) => {
    // Si le joueur actuel est éliminé, passer au joueur suivant
    if (game.players[game.currentPlayerIndex].isEliminated) {
        game = finishTurn(game);
        return startTurn(game); // Récursion pour trouver le prochain joueur valide
    }
    const currentPlayer = game.players[game.currentPlayerIndex];
    currentPlayer.isProtected = false;
    // Si le deck est vide, vérifier la fin de la manche
    if (game.deck.length === 0) {
        return checkEndOfRound(game);
    }
    // Piocher une nouvelle carte pour le joueur actuel
    const newCard = game.deck.pop();
    currentPlayer.hand.push(newCard);
    return game;
};
export const checkEndOfRound = (game) => {
    const activePlayers = game.players.filter((p) => !p.isEliminated);
    if (activePlayers.length === 1 ||
        (game.deck.length === 0 && activePlayers.every((p) => p.hand.length === 1))) {
        const activeEspionnes = activePlayers.filter((p) => game.playedEspionnes.includes(p.id));
        if (activeEspionnes.length === 1) {
            const espionneWinner = activeEspionnes[0];
            espionneWinner.points++;
            console.log(`${espionneWinner.name} gagne un point pour être la seule Espionne en jeu.`);
        }
        let roundWinners;
        if (activePlayers.length === 1) {
            roundWinners = [activePlayers[0]];
        }
        else {
            const highestValue = Math.max(...activePlayers.map((p) => p.hand[0].value));
            roundWinners = activePlayers.filter((p) => p.hand[0].value === highestValue);
        }
        roundWinners.forEach((winner) => {
            winner.points++;
            console.log(`${winner.name} gagne la manche et un point.`);
        });
        game.roundWinner = roundWinners.length === 1 ? roundWinners[0] : null;
        const winners = game.players.filter((p) => p.points >= game.pointsToWin);
        if (winners.length === 1) {
            game.gameWinner = winners[0];
            console.log(`${game.gameWinner.name} gagne la partie avec ${game.pointsToWin} points!`);
        }
        else if (winners.length > 1) {
            game.gameWinner = winners[0];
            const winnerNames = winners.map((w) => w.name).join(" et ");
            console.log(`La partie se termine sur une égalité entre ${winnerNames} avec ${game.pointsToWin} points!`);
        }
        else {
            game = startNewRound(game);
        }
    }
    return game;
};
export const playGuard = (game, playerId, targetPlayerId, guessedCard) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    const guardIndex = player.hand.findIndex((card) => card.type === CardType.Garde);
    if (guardIndex === -1)
        throw new Error("Le joueur n'a pas de Garde en main");
    if (targetPlayerId && guessedCard) {
        const targetPlayer = game.players.find((p) => p.id === targetPlayerId);
        if (!targetPlayer)
            throw new Error("Joueur cible non trouvé");
        if (targetPlayer.isEliminated)
            throw new Error("Le joueur cible est déjà éliminé");
        if (targetPlayer.isProtected)
            throw new Error("Le joueur ciblé est protégé par la Servante");
        if (targetPlayer.hand[0].type === guessedCard &&
            guessedCard !== CardType.Garde) {
            targetPlayer.isEliminated = true;
            // Ajouter la carte du joueur éliminé à la pile de défausse
            game.discardPile.push(...targetPlayer.hand);
            targetPlayer.hand = [];
        }
    }
    const playedCard = player.hand.splice(guardIndex, 1)[0];
    game.discardPile.push(playedCard);
    return game;
};
export const playEspionne = (game, playerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    const espionneIndex = player.hand.findIndex((card) => card.type === CardType.Espionne);
    if (espionneIndex === -1)
        throw new Error("Le joueur n'a pas d'Espionne en main");
    const playedCard = player.hand.splice(espionneIndex, 1)[0];
    game.discardPile.push(playedCard);
    game.playedEspionnes.push(playerId);
    return game;
};
export const playPretre = (game, playerId, targetPlayerId) => {
    const player = game.players.find((p) => p.id === playerId);
    let targetPlayer;
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Un des joueurs est déjà éliminé");
    const pretreIndex = player.hand.findIndex((card) => card.type === CardType.Pretre);
    if (pretreIndex === -1)
        throw new Error("Le joueur n'a pas de Prêtre en main");
    const playedCard = player.hand.splice(pretreIndex, 1)[0];
    game.discardPile.push(playedCard);
    if (targetPlayerId) {
        targetPlayer = game.players.find((p) => p.id === targetPlayerId);
        if (!targetPlayer)
            throw new Error("Joueur cible non trouvé");
        if (targetPlayer.isEliminated)
            throw new Error("Le joueur cible est déjà éliminé");
        if (targetPlayer.isProtected)
            throw new Error("Le joueur ciblé est protégé par la Servante");
    }
    const res = targetPlayer
        ? { game: game, targetCard: targetPlayer.hand[0] }
        : game;
    return res;
};
export const playBaron = (game, playerId, targetPlayerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    const baronIndex = player.hand.findIndex((card) => card.type === CardType.Baron);
    if (baronIndex === -1)
        throw new Error("Le joueur n'a pas de Baron en main");
    // Si un joueur cible est fourni, on applique l'effet normal du Baron
    if (targetPlayerId) {
        const targetPlayer = game.players.find((p) => p.id === targetPlayerId);
        if (!targetPlayer)
            throw new Error("Joueur cible non trouvé");
        if (targetPlayer.isEliminated)
            throw new Error("Le joueur cible est déjà éliminé");
        if (targetPlayer.isProtected)
            throw new Error("Le joueur ciblé est protégé par la Servante");
        if (player.hand[0].value < targetPlayer.hand[0].value) {
            player.isEliminated = true;
            game.discardPile.push(player.hand[0]);
            player.hand = [];
        }
        else if (player.hand[0].value > targetPlayer.hand[0].value) {
            targetPlayer.isEliminated = true;
            game.discardPile.push(targetPlayer.hand[0]);
            targetPlayer.hand = [];
        }
    }
    const playedCard = player.hand.splice(baronIndex, 1)[0];
    game.discardPile.push(playedCard);
    return game;
};
export const playServante = (game, playerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    const servanteIndex = player.hand.findIndex((card) => card.type === CardType.Servante);
    if (servanteIndex === -1)
        throw new Error("Le joueur n'a pas de Servante en main");
    const playedCard = player.hand.splice(servanteIndex, 1)[0];
    game.discardPile.push(playedCard);
    player.isProtected = true;
    return game;
};
export const playPrince = (game, playerId, targetPlayerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Un des joueurs est déjà éliminé");
    const princeIndex = player.hand.findIndex((card) => card.type === CardType.Prince);
    if (princeIndex === -1)
        throw new Error("Le joueur n'a pas de Prince en main");
    if (targetPlayerId) {
        const targetPlayer = game.players.find((p) => p.id === targetPlayerId);
        if (!targetPlayer)
            throw new Error("Joueur cible non trouvé");
        if (targetPlayer.isEliminated)
            throw new Error("Le joueur cible est déjà éliminé");
        if (targetPlayer.isProtected)
            throw new Error("Le joueur ciblé est protégé par la Servante");
        const playedCard = player.hand.splice(princeIndex, 1)[0];
        game.discardPile.push(playedCard);
        const discardedCard = targetPlayer.hand.pop();
        game.discardPile.push(discardedCard);
        if (discardedCard.type === CardType.Princesse) {
            targetPlayer.isEliminated = true;
            targetPlayer.hand = [];
        }
        else {
            if (game.deck.length > 0) {
                const newCard = game.deck.pop();
                targetPlayer.hand.push(newCard);
            }
            else if (game.hiddenCard) {
                targetPlayer.hand.push(game.hiddenCard);
                game.hiddenCard = null;
            }
        }
    }
    return game;
};
export const playChancelier = (game, playerId, chancellorAction) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    // Phase initiale : jouer le Chancelier
    if (!chancellorAction) {
        if (game.players[game.currentPlayerIndex].id !== playerId) {
            throw new Error("Ce n'est pas le tour de ce joueur");
        }
        const chancelierIndex = player.hand.findIndex((card) => card.type === CardType.Chancelier);
        if (chancelierIndex === -1) {
            throw new Error("Le joueur n'a pas de Chancelier en main");
        }
        // Jouer la carte Chancelier
        const playedCard = player.hand.splice(chancelierIndex, 1)[0];
        game.discardPile.push(playedCard);
        // Si le deck est vide, terminer ici
        if (game.deck.length === 0) {
            console.log("Deck vide, le Chancelier est joué sans effet");
            return game;
        }
        // Garder la carte qui était en main
        const originalCard = player.hand[0];
        player.hand = [];
        // Piocher des cartes en fonction de l'état du deck
        game.chancellorDrawnCards = [];
        // Piocher au maximum 2 cartes
        const cardsToDrawCount = Math.min(2, game.deck.length);
        for (let i = 0; i < cardsToDrawCount; i++) {
            const drawnCard = game.deck.pop();
            game.chancellorDrawnCards.push(drawnCard);
        }
        // Ajouter la carte originale aux cartes disponibles
        if (originalCard) {
            game.chancellorDrawnCards.push(originalCard);
        }
        game.isChancellorAction = true;
        console.log("Phase initiale - cartes disponibles:", game.chancellorDrawnCards, "Cartes dans le deck:", game.deck.length);
        return game;
    }
    // Phase finale : choisir une carte
    if (!game.isChancellorAction) {
        throw new Error("Aucune action de Chancelier n'est en cours");
    }
    const { selectedCardIndex, topCardIndex } = chancellorAction;
    // Vérifications de base
    if (selectedCardIndex < 0 ||
        selectedCardIndex >= game.chancellorDrawnCards.length) {
        throw new Error("Index de la carte sélectionnée invalide");
    }
    // Sélectionner la carte à garder
    const selectedCard = game.chancellorDrawnCards[selectedCardIndex];
    player.hand = [selectedCard];
    // Retirer la carte sélectionnée du tableau
    const remainingCards = game.chancellorDrawnCards.filter((_, i) => i !== selectedCardIndex);
    // Cas spécial : une seule carte restante
    if (remainingCards.length === 1) {
        game.deck.unshift(remainingCards[0]);
    }
    // Cas normal : deux cartes restantes
    else if (remainingCards.length === 2 && topCardIndex !== undefined) {
        if (topCardIndex === 0 || topCardIndex === 1) {
            const [first, second] = topCardIndex === 0 ? remainingCards : remainingCards.reverse();
            game.deck.unshift(second);
            game.deck.unshift(first);
        }
        else {
            throw new Error("Index de la carte du dessus invalide");
        }
    }
    // Nettoyage
    game.chancellorDrawnCards = [];
    game.isChancellorAction = false;
    console.log("Fin de l'action du Chancelier:", {
        selectedCard,
        remainingCards: remainingCards.length,
        deckTop: game.deck.slice(0, remainingCards.length),
    });
    return game;
};
export const finishTurn = (game) => {
    // Ne pas finir le tour si une action de Chancelier est en cours
    if (game.isChancellorAction) {
        return game;
    }
    let nextPlayerIndex = game.currentPlayerIndex;
    let hasCheckedAllPlayers = false;
    const initialIndex = nextPlayerIndex;
    do {
        // Passer au joueur suivant
        nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
        // Vérifier si on a fait un tour complet
        if (nextPlayerIndex === initialIndex) {
            hasCheckedAllPlayers = true;
        }
        // Si on trouve un joueur non éliminé ou si on a vérifié tous les joueurs, on sort de la boucle
    } while (!hasCheckedAllPlayers && game.players[nextPlayerIndex].isEliminated);
    // Si tous les joueurs sauf un sont éliminés, on doit vérifier la fin de la partie
    const activePlayers = game.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1) {
        return checkEndOfRound(game);
    }
    // Mettre à jour l'index du joueur courant
    game.currentPlayerIndex = nextPlayerIndex;
    // Si le prochain joueur n'est pas éliminé, on peut commencer son tour
    if (!game.players[nextPlayerIndex].isEliminated) {
        game.players[nextPlayerIndex].isProtected = false;
    }
    return game;
};
export const playRoi = (game, playerId, targetPlayerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Un des joueurs est déjà éliminé");
    const roiIndex = player.hand.findIndex((card) => card.type === CardType.Roi);
    if (roiIndex === -1)
        throw new Error("Le joueur n'a pas de Roi en main");
    const playedCard = player.hand.splice(roiIndex, 1)[0];
    game.discardPile.push(playedCard);
    if (targetPlayerId) {
        const targetPlayer = game.players.find((p) => p.id === targetPlayerId);
        if (!targetPlayer)
            throw new Error("Joueur cible non trouvé");
        if (targetPlayer.isEliminated)
            throw new Error("Le joueur cible est déjà éliminé");
        if (targetPlayer.isProtected)
            throw new Error("Le joueur ciblé est protégé par la Servante");
        // Échanger les mains
        const tempHand = player.hand;
        player.hand = targetPlayer.hand;
        targetPlayer.hand = tempHand;
    }
    return game;
};
export const playComtesse = (game, playerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    const comtesseIndex = player.hand.findIndex((card) => card.type === CardType.Comtesse);
    if (comtesseIndex === -1)
        throw new Error("Le joueur n'a pas de Comtesse en main");
    const playedCard = player.hand.splice(comtesseIndex, 1)[0];
    game.discardPile.push(playedCard);
    return game;
};
export const playPrincesse = (game, playerId) => {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        throw new Error("Joueur non trouvé");
    if (player.isEliminated)
        throw new Error("Le joueur est déjà éliminé");
    const princesseIndex = player.hand.findIndex((card) => card.type === CardType.Princesse);
    if (princesseIndex === -1)
        throw new Error("Le joueur n'a pas de Princesse en main");
    const playedCard = player.hand.splice(princesseIndex, 1)[0];
    game.discardPile.push(playedCard);
    player.isEliminated = true;
    return game;
};
const mustPlayComtesse = (hand) => {
    const hasComtesse = hand.some((card) => card.type === CardType.Comtesse);
    const hasPrinceOrKing = hand.some((card) => card.type === CardType.Prince || card.type === CardType.Roi);
    return hasComtesse && hasPrinceOrKing;
};
export const playCard = (game, playerId, cardType, targetPlayerId, guessedCard, chancellorAction) => {
    if (game.players[game.currentPlayerIndex].id !== playerId) {
        throw new Error("Ce n'est pas le tour de ce joueur");
    }
    const player = game.players[game.currentPlayerIndex];
    if (!game.isChancellorAction) {
        if (game.players[game.currentPlayerIndex].id !== playerId) {
            throw new Error("Ce n'est pas le tour de ce joueur");
        }
    }
    if (mustPlayComtesse(player.hand) && cardType !== CardType.Comtesse) {
        throw new Error("Vous devez jouer la Comtesse lorsque vous avez le Roi ou le Prince en main");
    }
    let result;
    switch (cardType) {
        case CardType.Garde:
            result = playGuard(game, playerId, targetPlayerId, guessedCard);
            break;
        case CardType.Espionne:
            result = playEspionne(game, playerId);
            break;
        case CardType.Pretre:
            result = playPretre(game, playerId, targetPlayerId);
            break;
        case CardType.Baron:
            result = playBaron(game, playerId, targetPlayerId);
            break;
        case CardType.Servante:
            result = playServante(game, playerId);
            break;
        case CardType.Prince:
            result = playPrince(game, playerId, targetPlayerId);
            break;
        case CardType.Chancelier:
            result = playChancelier(game, playerId, chancellorAction);
            break;
        case CardType.Roi:
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
    return result;
};
export const playTurn = (game, playerId, cardType, targetPlayerId, guessedCard) => {
    game = startTurn(game);
    game = checkEndOfRound(game);
    if (game.roundWinner || game.gameWinner) {
        return game;
    }
    const result = playCard(game, playerId, cardType, targetPlayerId, guessedCard);
    return checkEndOfRound(result instanceof Object && "game" in result ? result.game : result);
};
//# sourceMappingURL=gameLogic.js.map
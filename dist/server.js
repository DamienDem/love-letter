"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//server.ts
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const gameLogic_js_1 = require("./lib/gameLogic.js");
const uuid_1 = require("uuid");
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT) || 3000;
const app = (0, next_1.default)({ dev, hostname, port });
const handler = app.getRequestHandler();
const games = [];
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)(handler);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true
        },
    });
    io.on("connection", (socket) => {
        console.log("New client connected");
        socket.on("createGame", ({ gameId, players, maxPlayers, pointsToWin = 3 }) => {
            const game = {
                id: gameId,
                name: `Game ${gameId}`,
                players,
                maxPlayers,
                pointsToWin,
                currentPlayerIndex: 0,
                deck: [],
                discardPile: [],
                roundWinner: null,
                gameWinner: null,
                playedEspionnes: [],
                hiddenCard: null,
                chancellorDrawnCards: [],
                currentRound: 1,
                isChancellorAction: false,
                actions: [],
            };
            games.push(game);
            socket.join(gameId);
            io.to(gameId).emit("gameCreated", game);
            io.emit("gameListUpdated", getAvailableGames());
        });
        socket.on("joinGame", (gameId, player) => {
            const gameIndex = games.findIndex((g) => g.id === gameId);
            if (gameIndex !== -1) {
                let game = games[gameIndex];
                if (game.players.length < game.maxPlayers) {
                    game.players.push(player);
                    socket.join(gameId);
                    if (game.players.length === game.maxPlayers) {
                        console.log("Game is full, starting game");
                        game = (0, gameLogic_js_1.initializeGame)(game);
                        games[gameIndex] = game;
                        io.to(gameId).emit("gameStarted", game);
                    }
                    else {
                        io.to(gameId).emit("playerJoined", { gameId, player });
                    }
                    io.to(gameId).emit("gameUpdated", game);
                    io.emit("gameListUpdated", getAvailableGames());
                }
                else {
                    socket.emit("joinError", "Game is full");
                }
            }
            else {
                socket.emit("joinError", "Game not found");
            }
        });
        socket.on("getGameState", (gameId) => {
            const game = games.find((g) => g.id === gameId);
            if (game) {
                socket.emit("gameState", game);
            }
            else {
                socket.emit("error", "Game not found");
            }
        });
        function handleRoundEnd(game, gameId, gameIndex) {
            console.log("Round ended");
            io.to(gameId).emit("roundEnded", {
                winner: game.roundWinner,
                espionneWinner: game.players.find((p) => game.playedEspionnes.includes(p.id) && !p.isEliminated),
                activePlayers: game.players.filter((p) => !p.isEliminated),
            });
            if (game.gameWinner) {
                console.log("Game ended");
                io.to(gameId).emit("gameEnded", { winner: game.gameWinner });
                games.splice(gameIndex, 1);
            }
            else {
                console.log("New round started");
                io.to(gameId).emit("newRoundStarted", game);
            }
        }
        socket.on("startTurn", (gameId) => {
            const gameIndex = games.findIndex((g) => g.id === gameId);
            if (gameIndex !== -1) {
                let game = games[gameIndex];
                const currentPlayer = game.players[game.currentPlayerIndex];
                currentPlayer.isProtected = false;
                // Vérifier si le joueur actuel n'a qu'une seule carte en main
                if (currentPlayer.hand.length === 1) {
                    console.log("Player has only one card, starting turn");
                    game = (0, gameLogic_js_1.startTurn)(game);
                    game = (0, gameLogic_js_1.checkEndOfRound)(game);
                    games[gameIndex] = game;
                    console.log("Emitting gameUpdated after startTurn");
                    io.to(gameId).emit("gameUpdated", game);
                    if (game.roundWinner) {
                        handleRoundEnd(game, gameId, gameIndex);
                    }
                }
                else {
                    console.log("Player already has more than one card, not starting turn");
                }
            }
            else {
                console.log("Game not found:", gameId);
                socket.emit("error", "Game not found");
            }
        });
        socket.on("playCard", async ({ gameId, playerId, cardType, targetPlayerId, guessedCard, chancellorAction, }) => {
            const gameIndex = games.findIndex((g) => g.id === gameId);
            if (gameIndex !== -1) {
                let game = games[gameIndex];
                try {
                    const action = {
                        id: (0, uuid_1.v4)(),
                        playerId,
                        cardType,
                        targetPlayerId,
                        guessedCard,
                    };
                    console.log("Processing playCard:", {
                        cardType,
                        playerId,
                        hasChancellorAction: !!chancellorAction,
                        isChancellorAction: game.isChancellorAction,
                        currentPlayerIndex: game.currentPlayerIndex,
                        currentPlayerId: game.players[game.currentPlayerIndex].id,
                    });
                    if (cardType === gameLogic_js_1.CardType.Garde && targetPlayerId && guessedCard) {
                        const targetPlayer = game.players.find(p => p.id === targetPlayerId);
                        if (targetPlayer && targetPlayer.hand[0]) {
                            action.success = targetPlayer.hand[0].type === guessedCard;
                        }
                    }
                    // Ajouter l'action à l'historique
                    if (!game.actions)
                        game.actions = [];
                    game.actions.push(action);
                    // Action du Chancelier en deux phases
                    if (cardType === gameLogic_js_1.CardType.Chancelier) {
                        // Première phase : jouer la carte
                        if (!chancellorAction) {
                            console.log("Phase initiale du Chancelier");
                            const result = (0, gameLogic_js_1.playCard)(game, playerId, cardType, targetPlayerId, guessedCard);
                            game = result;
                            // Émettre l'événement pour ouvrir le modal
                            io.to(gameId).emit("chancellorAction", { playerId });
                        }
                        // Deuxième phase : choisir les cartes
                        else {
                            console.log("Phase finale du Chancelier");
                            const result = (0, gameLogic_js_1.playCard)(game, playerId, cardType, targetPlayerId, guessedCard, chancellorAction);
                            game = result;
                            // Seulement maintenant on peut finir le tour
                            game = (0, gameLogic_js_1.finishTurn)(game);
                            game = (0, gameLogic_js_1.checkEndOfRound)(game);
                        }
                    }
                    // Autres cartes
                    else {
                        const result = (0, gameLogic_js_1.playCard)(game, playerId, cardType, targetPlayerId, guessedCard);
                        if ("targetCard" in result) {
                            game = result.game;
                            // Modifier l'émission de l'événement pour inclure le sourcePlayerId
                            io.to(gameId).emit("cardRevealed", {
                                playerId: targetPlayerId,
                                card: result.targetCard,
                                sourcePlayerId: playerId, // Ajouter l'ID du joueur qui a joué le Prêtre
                            });
                        }
                        else {
                            game = result;
                        }
                        game = (0, gameLogic_js_1.finishTurn)(game);
                        game = (0, gameLogic_js_1.checkEndOfRound)(game);
                    }
                    // Mettre à jour le jeu
                    games[gameIndex] = game;
                    io.to(gameId).emit("gameUpdated", game);
                    games[gameIndex] = game;
                    io.to(gameId).emit("gameUpdated", game);
                    if (game.roundWinner) {
                        handleRoundEnd(game, gameId, gameIndex);
                    }
                }
                catch (error) {
                    console.error("Error in playCard:", error);
                    if (error instanceof Error) {
                        socket.emit("error", error.message);
                    }
                    else {
                        socket.emit("error", "An unknown error occurred");
                    }
                }
            }
        });
        socket.on("getAvailableGames", () => {
            socket.emit("availableGames", getAvailableGames());
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected");
            // Gérer la déconnexion du joueur ici
            // Par exemple, rechercher le joueur dans les jeux et le retirer si nécessaire
        });
    });
    httpServer
        .once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
        .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
function getAvailableGames() {
    return games
        .filter((g) => g.players.length < g.maxPlayers)
        .map((g) => ({
        id: g.id,
        name: g.name,
        players: g.players.length,
        maxPlayers: g.maxPlayers,
    }));
}

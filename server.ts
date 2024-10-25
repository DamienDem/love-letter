//server.ts
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  CardType,
  checkEndOfRound,
  finishTurn,
  Game,
  initializeGame,
  playCard,
  PlayerAction,
  startTurn,
} from "./lib/gameLogic.js";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, dir: __dirname });
const handler = app.getRequestHandler();
const games: Game[] = [];

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on(
      "createGame",
      ({ gameId, players, maxPlayers, pointsToWin = 3 }) => {
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
      }
    );

    socket.on("joinGame", (gameId, player) => {
      const gameIndex = games.findIndex((g) => g.id === gameId);

      if (gameIndex !== -1) {
        let game = games[gameIndex];

        if (game.players.length < game.maxPlayers) {
          game.players.push(player);
          socket.join(gameId);

          if (game.players.length === game.maxPlayers) {
            console.log("Game is full, starting game");
            game = initializeGame(game);
            games[gameIndex] = game;
            io.to(gameId).emit("gameStarted", game);
          } else {
            io.to(gameId).emit("playerJoined", { gameId, player });
          }

          io.to(gameId).emit("gameUpdated", game);
          io.emit("gameListUpdated", getAvailableGames());
        } else {
          socket.emit("joinError", "Game is full");
        }
      } else {
        socket.emit("joinError", "Game not found");
      }
    });

    socket.on("getGameState", (gameId) => {
      const game = games.find((g) => g.id === gameId);
      if (game) {
        socket.emit("gameState", game);
      } else {
        socket.emit("error", "Game not found");
      }
    });
    function handleRoundEnd(game: Game, gameId: string, gameIndex: number) {
      console.log("Round ended");
      io.to(gameId).emit("roundEnded", {
        winner: game.roundWinner,
        espionneWinner: game.players.find(
          (p) => game.playedEspionnes.includes(p.id) && !p.isEliminated
        ),
        activePlayers: game.players.filter((p) => !p.isEliminated),
      });

      if (game.gameWinner) {
        console.log("Game ended");
        io.to(gameId).emit("gameEnded", { winner: game.gameWinner });
        games.splice(gameIndex, 1);
      } else {
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
          game = startTurn(game);
          game = checkEndOfRound(game);
          games[gameIndex] = game;

          console.log("Emitting gameUpdated after startTurn");
          io.to(gameId).emit("gameUpdated", game);

          if (game.roundWinner) {
            handleRoundEnd(game, gameId, gameIndex);
          }
        } else {
          console.log(
            "Player already has more than one card, not starting turn"
          );
        }
      } else {
        console.log("Game not found:", gameId);
        socket.emit("error", "Game not found");
      }
    });

    socket.on(
      "playCard",
      async ({
        gameId,
        playerId,
        cardType,
        targetPlayerId,
        guessedCard,
        chancellorAction,
      }) => {
        const gameIndex = games.findIndex((g) => g.id === gameId);
        if (gameIndex !== -1) {
          let game = games[gameIndex];
          try {
            const action: PlayerAction = {
              id: uuidv4(),
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

            if (cardType === CardType.Garde && targetPlayerId && guessedCard) {
              const targetPlayer = game.players.find(p => p.id === targetPlayerId);
              if (targetPlayer && targetPlayer.hand[0]) {
                action.success = targetPlayer.hand[0].type === guessedCard;
              }
            }
    
            // Ajouter l'action à l'historique
            if (!game.actions) game.actions = [];
            game.actions.push(action);
            // Action du Chancelier en deux phases
            if (cardType === CardType.Chancelier) {
              // Première phase : jouer la carte
              if (!chancellorAction) {
                console.log("Phase initiale du Chancelier");
                const result = playCard(
                  game,
                  playerId,
                  cardType,
                  targetPlayerId,
                  guessedCard
                );
                game = result as Game;

                // Émettre l'événement pour ouvrir le modal
                io.to(gameId).emit("chancellorAction", { playerId });
              }
              // Deuxième phase : choisir les cartes
              else {
                console.log("Phase finale du Chancelier");
                const result = playCard(
                  game,
                  playerId,
                  cardType,
                  targetPlayerId,
                  guessedCard,
                  chancellorAction
                );
                game = result as Game;

                // Seulement maintenant on peut finir le tour
                game = finishTurn(game);
                game = checkEndOfRound(game);
              }
            }
            // Autres cartes
            else {
              const result = playCard(
                game,
                playerId,
                cardType,
                targetPlayerId,
                guessedCard
              );

              if ("targetCard" in result) {
                game = result.game;
                // Modifier l'émission de l'événement pour inclure le sourcePlayerId
                io.to(gameId).emit("cardRevealed", {
                  playerId: targetPlayerId,
                  card: result.targetCard,
                  sourcePlayerId: playerId, // Ajouter l'ID du joueur qui a joué le Prêtre
                });
              } else {
                game = result;
              }

              game = finishTurn(game);
              game = checkEndOfRound(game);
            }

            // Mettre à jour le jeu
            games[gameIndex] = game;
            io.to(gameId).emit("gameUpdated", game);
            games[gameIndex] = game;
            io.to(gameId).emit("gameUpdated", game);

            if (game.roundWinner) {
              handleRoundEnd(game, gameId, gameIndex);
            }
          } catch (error) {
            console.error("Error in playCard:", error);
            if (error instanceof Error) {
              socket.emit("error", error.message);
            } else {
              socket.emit("error", "An unknown error occurred");
            }
          }
        }
      }
    );
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

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { checkEndOfRound, Game, initializeGame, playCard, startTurn } from "./lib/gameLogic";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const games: Game[] = [];

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on(
      "createGame",
      ({ gameId, players, maxPlayers, pointsToWin = 1 }) => {
        const game = initializeGame({
          id: gameId,
          name: `Game ${gameId}`,
          players,
          maxPlayers,
          pointsToWin,
        });
        games.push(game);
        io.to(gameId).emit("game", game);
      }
    );

    socket.on("getGames", () => {
      socket.emit("gamesList", games);
    });

    socket.on("joinGame", (gameId, player) => {
      socket.join(gameId);
      const gameIndex = games.findIndex((g) => g.id === gameId);

      if (gameIndex !== -1) {
        let game = games[gameIndex];
        game.players.push(player);

        if (game.players.length === game.maxPlayers) {
          console.log("Game is full, starting game");
          game = initializeGame(game);
          games[gameIndex] = game; // Met à jour le jeu dans le tableau games
        }

        io.to(gameId).emit("game", game); // Envoie la mise à jour à tous les clients dans la room
      }
    });
    socket.on("getGameData", (gameId) => {
      const game = games.find((g) => g.id === gameId);

      if (game) {
        socket.emit("game", game);
      }
    });

    socket.on("startTurn", ({ gameId, playerId }) => {
      const gameIndex = games.findIndex((g) => g.id === gameId);
      if (gameIndex !== -1) {
        let game = games[gameIndex];
        
        // Vérifier si c'est bien le tour du joueur
        if (game.players[game.currentPlayerIndex].id !== playerId) {
          socket.emit("gameError", { message: "Ce n'est pas votre tour" });
          return;
        }
    
        // Exécuter startTurn pour piocher une carte
        game = startTurn(game);
    
        // Mettre à jour le jeu dans la liste des jeux
        games[gameIndex] = game;
    
        // Envoyer la mise à jour du jeu à tous les joueurs
        io.to(gameId).emit("game", game);
      }
    });
    socket.on("playTurn", ({ gameId, playerId, cardType, targetPlayerId, guessedCard }) => {
      const gameIndex = games.findIndex((g) => g.id === gameId);
      if (gameIndex !== -1) {
        let game = games[gameIndex];
        
        // Vérifier si c'est bien le tour du joueur
        if (game.players[game.currentPlayerIndex].id !== playerId) {
          socket.emit("gameError", { message: "Ce n'est pas votre tour" });
          return;
        }
    
        // Jouer la carte
        const result = playCard(game, playerId, cardType, targetPlayerId, guessedCard);
    
        if ("game" in result) {
          game = result.game;
    
          // Envoyer la carte révélée au joueur ciblé si nécessaire
          if (result.targetCard && targetPlayerId) {
            const targetPlayer = game.players.find(p => p.id === targetPlayerId);
            if (targetPlayer && targetPlayer.socketId) {
              io.to(targetPlayer.socketId).emit("revealedCard", result.targetCard);
            }
          }
        } else {
          game = result;
        }
    
        // Passer au joueur suivant
        // game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    
        // Vérifier la fin de la manche ou du jeu
        game = checkEndOfRound(game);
    
        // Mettre à jour le jeu dans la liste des jeux
        games[gameIndex] = game;
    
        // Envoyer la mise à jour du jeu à tous les joueurs
        io.to(gameId).emit("game", game);
    
        // Vérifier et annoncer la fin de la manche ou du jeu si nécessaire
        if (game.roundWinner || game.gameWinner) {
          io.to(gameId).emit("gameEnded", {
            roundWinner: game.roundWinner?.name,
            gameWinner: game.gameWinner?.name,
          });
        }
      }
    });
    // socket.on(
    //   "playCard",
    //   ({ gameId, playerId, cardType, targetPlayerId, guessedCard }) => {
    //     const gameIndex = games.findIndex((g) => g.id === gameId);
    //     if (gameIndex !== -1) {
    //       const result = playTurn(
    //         games[gameIndex],
    //         playerId,
    //         cardType,
    //         targetPlayerId,
    //         guessedCard
    //       );

    //       if ("game" in result) {
    //         games[gameIndex] = result.game;
    //         io.to(gameId).emit("game", games[gameIndex]);

    //         if (result.targetCard) {
    //           const targetPlayer = games[gameIndex].players.find(
    //             (p) => p.id === targetPlayerId
    //           );
    //           if (targetPlayer && targetPlayer.socketId) {
    //             io.to(targetPlayer.socketId).emit(
    //               "revealedCard",
    //               result.targetCard
    //             );
    //           }
    //         }
    //       } else {
    //         games[gameIndex] = result;
    //         io.to(gameId).emit("game", games[gameIndex]);
    //       }

    //       if (games[gameIndex].roundWinner || games[gameIndex].gameWinner) {
    //         io.to(gameId).emit("gameEnded", {
    //           roundWinner: games[gameIndex].roundWinner?.name,
    //           gameWinner: games[gameIndex].gameWinner?.name,
    //         });
    //       }
    //     }
    //   }
    // );
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      // Gérer la déconnexion du joueur ici si nécessaire
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

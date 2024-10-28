import { createServer } from "http";
import next from "next";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { CardType, ChancellorAction, IGameState, IPlayer } from "./lib/types";
import { GameUtils } from "./lib/gameUtils";
import { GameEngine } from "./lib/gameEngine";
import { initializeGame, PlayerAction } from "./lib/gameLogic";

// Interfaces
interface GameManager {
  createGame(gameData: GameCreationData): void;
  joinGame(gameId: string, player: IPlayer): void;
  getGameState(gameId: string): IGameState | undefined;
  handlePlayCard(playCardData: PlayCardData): void;
  startTurn(gameId: string): void;
  getAvailableGames(): AvailableGame[];
}

interface GameCreationData {
  gameId: string;
  players: IPlayer[];
  maxPlayers: number;
  pointsToWin: number;
}

interface PlayCardData {
  gameId: string;
  playerId: string;
  cardType: CardType;
  targetPlayerId?: string;
  guessedCard?: CardType;
  chancellorAction?: ChancellorAction;
}

interface AvailableGame {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
}

interface RoundEndData {
  winner: IPlayer | null;
  espionneWinner: IPlayer | undefined;
  activePlayers: IPlayer[];
}

// Gestionnaire d'événements socket
class SocketEventHandler {
  constructor(
    private socket: Socket,
    private gameManager: GameManager,
    private io: Server
  ) {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.socket.on("createGame", this.handleCreateGame.bind(this));
    this.socket.on("joinGame", this.handleJoinGame.bind(this));
    this.socket.on("getGameState", this.handleGetGameState.bind(this));
    this.socket.on("startTurn", this.handleStartTurn.bind(this));
    this.socket.on("playCard", this.handlePlayCard.bind(this));
    this.socket.on(
      "getAvailableGames",
      this.handleGetAvailableGames.bind(this)
    );
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
  }

  private handleCreateGame({
    gameId,
    players,
    maxPlayers,
    pointsToWin = 3,
  }: GameCreationData): void {
    try {
      this.gameManager.createGame({ gameId, players, maxPlayers, pointsToWin });
      this.socket.join(gameId);
      this.io
        .to(gameId)
        .emit("gameCreated", this.gameManager.getGameState(gameId));
      this.io.emit("gameListUpdated", this.gameManager.getAvailableGames());
    } catch (error) {
      console.log("Error creating game");

      this.handleError(error);
    }
  }

  private handleJoinGame(gameId: string, player: IPlayer): void {
    try {
      this.gameManager.joinGame(gameId, player);
      this.socket.join(gameId);

      let gameState = this.gameManager.getGameState(gameId);
      if (gameState) {
        if (gameState.players.length === gameState.maxPlayers) {
          gameState = initializeGame(gameState);
          this.io.to(gameId).emit("gameStarted", gameState);
        } else {
          this.io.to(gameId).emit("playerJoined", { gameId, player });
        }

        this.io.to(gameId).emit("gameUpdated", gameState);
        this.io.emit("gameListUpdated", this.gameManager.getAvailableGames());
      }
    } catch (error) {
      console.log("Error joining game");

      this.handleError(error);
    }
  }

  private handleGetGameState(gameId: string): void {
    const gameState = this.gameManager.getGameState(gameId);
    if (gameState) {
      this.socket.emit("gameState", gameState);
    } else {
      this.socket.emit("error", "Game not found");
    }
  }

  private handleStartTurn(gameId: string): void {
    try {
      this.gameManager.startTurn(gameId);
      const gameState = this.gameManager.getGameState(gameId);

      if (gameState) {
        this.io.to(gameId).emit("gameUpdated", gameState);

        if (gameState.roundWinner) {
          this.handleRoundEnd(gameState, gameId);
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handlePlayCard(data: PlayCardData): void {
    try {
      this.gameManager.handlePlayCard(data);
      const gameState = this.gameManager.getGameState(data.gameId);

      if (gameState) {
        this.io.to(data.gameId).emit("gameUpdated", gameState);

        if (gameState.roundWinner) {
          this.handleRoundEnd(gameState, data.gameId);
        }

        // Gérer les événements spéciaux
        this.handleSpecialCardEffects(gameState, data);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleSpecialCardEffects(
    gameState: IGameState,
    data: PlayCardData
  ): void {
    if (data.cardType === CardType.Chancelier && !data.chancellorAction) {
      this.io.to(data.gameId).emit("chancellorAction", {
        playerId: data.playerId,
      });
    }
  }

  private handleRoundEnd(gameState: IGameState, gameId: string): void {
    const roundEndData: RoundEndData = {
      winner: gameState.roundWinner,
      espionneWinner: gameState.players.find(
        (p) => gameState.playedEspionnes.includes(p.id) && !p.isEliminated
      ),
      activePlayers: GameUtils.getActivePlayers(gameState),
    };

    this.io.to(gameId).emit("roundEnded", roundEndData);

    if (gameState.gameWinner) {
      this.io.to(gameId).emit("gameEnded", {
        winner: gameState.gameWinner,
      });
    } else {
      this.io.to(gameId).emit("newRoundStarted", gameState);
    }
  }

  private handleGetAvailableGames(): void {
    this.socket.emit("availableGames", this.gameManager.getAvailableGames());
  }

  private handleDisconnect(): void {
    console.log("Client disconnected");
    // Implémenter la logique de déconnexion si nécessaire
  }

  private handleError(error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    this.socket.emit("error", errorMessage);
    console.error("Error:", errorMessage);
  }
}

// Gestionnaire de jeu
class GameManagerImpl implements GameManager {
  private games: Map<string, GameEngine> = new Map();

  createGame(gameData: GameCreationData): void {
    const gameEngine = new GameEngine({
      id: gameData.gameId,
      name: `Game ${gameData.gameId}`,
      players: gameData.players,
      maxPlayers: gameData.maxPlayers,
      pointsToWin: gameData.pointsToWin,
    });
    this.games.set(gameData.gameId, gameEngine);
  }

  joinGame(gameId: string, player: IPlayer): void {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const gameState = game.getState();
    if (gameState.players.length >= gameState.maxPlayers) {
      throw new Error("Game is full");
    }

    gameState.players.push({
      ...player,
      hand: [],
      isEliminated: false,
      points: 0,
      isProtected: false,
    });
  }

  startTurn(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    game.startTurn();
  }

  getGameState(gameId: string): IGameState | undefined {
    const game = this.games.get(gameId);
    return game?.getState();
  }

  handlePlayCard(data: PlayCardData): void {
    const game = this.games.get(data.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const action: PlayerAction = {
      id: uuidv4(),
      playerId: data.playerId,
      cardType: data.cardType,
      targetPlayerId: data.targetPlayerId,
      guessedCard: data.guessedCard,
    };

    // Vérifier le résultat de l'action Garde
    if (
      data.cardType === CardType.Garde &&
      data.targetPlayerId &&
      data.guessedCard
    ) {
      const gameState = game.getState();
      const targetPlayer = gameState.players.find(
        (p) => p.id === data.targetPlayerId
      );
      if (targetPlayer && targetPlayer.hand[0]) {
        action.success = targetPlayer.hand[0].type === data.guessedCard;
      }
    }

    const additionalData =
      data.cardType === CardType.Garde
        ? { guessedCard: data.guessedCard }
        : data.chancellorAction;

    game.playCard(
      data.playerId,
      data.cardType,
      data.targetPlayerId,
      additionalData as never
    );

    if (!game.getState().actions) {
      game.getState().actions = [];
    }
    game.getState().actions.push(action);
  }

  getAvailableGames(): AvailableGame[] {
    const availableGames: AvailableGame[] = [];
    this.games.forEach((game, id) => {
      const state = game.getState();
      if (state.players.length < state.maxPlayers) {
        availableGames.push({
          id,
          name: state.name,
          players: state.players.length,
          maxPlayers: state.maxPlayers,
        });
      }
    });
    return availableGames;
  }
}

// Configuration et démarrage du serveur
async function startServer() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = process.env.HOSTNAME || "localhost";
  const port = parseInt(process.env.PORT!) || 3000;

  const app = next({ dev, hostname, port });
  const handler = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
  });

  const gameManager = new GameManagerImpl();

  io.on("connection", (socket) => {
    console.log("New client connected");
    new SocketEventHandler(socket, gameManager, io);
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
}

startServer().catch(console.error);

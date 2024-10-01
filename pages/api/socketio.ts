// pages/api/socketio.ts
import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface Player {
  id: string;
  name: string;
}

interface Game {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
}

let games: Game[] = [];

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io')

    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
    })

    io.on('connection', (socket) => {
      console.log('New client connected');

      socket.on('getGames', () => {
        console.log('Sending games list:', games);
        socket.emit('gamesList', games);
      });

      socket.on('getGameData', (gameId: string) => {
        console.log('Getting game data for:', gameId);
        const game = games.find(g => g.id === gameId);
        if (game) {
          console.log('Game found, sending data:', game);
          socket.emit('gameData', game);
        } else {
          console.log('Game not found');
          socket.emit('gameNotFound');
        }
      });

      socket.on('createGame', (game: Game) => {
        console.log('New game created:', game);
        games.push(game);
        io.emit('gamesList', games);
      });

      socket.on('joinGame', (gameId: string, player: Player) => {
        console.log('Player joined game:', gameId, player);
        const gameIndex = games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1 && games[gameIndex].players.length < games[gameIndex].maxPlayers) {
          games[gameIndex].players.push(player);
          io.emit('gamesList', games);
          
          // Notify all clients about the updated game
          io.emit('playerJoined', games[gameIndex]);
          
          if (games[gameIndex].players.length === games[gameIndex].maxPlayers) {
            io.emit('gameStarting', gameId);
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Here you might want to handle player disconnection
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('socket.io already running');
  }

  res.end();
};

export default ioHandler;
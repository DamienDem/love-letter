"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { initSocket, getSocket } from '@/lib/socketio';
import { Socket } from 'socket.io-client';

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

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let socket: Socket | null = null;

    const setupSocket = async () => {
      try {
        socket = await initSocket();
        console.log('Socket initialized in GamePage');

        const requestGameData = () => {
          console.log('Requesting game data for:', gameId);
          socket?.emit('getGameData', gameId);
        };

        socket.on('connect', () => {
          console.log('Socket connected in GamePage');
          requestGameData();
        });

        socket.on('gameData', (gameData: Game) => {
          console.log('Received game data:', gameData);
          setGame(gameData);
          setIsLoading(false);
        });

        socket.on('playerJoined', (updatedGame: Game) => {
          console.log('Player joined, updated game:', updatedGame);
          setGame(updatedGame);
        });

        socket.on('gameNotFound', () => {
          console.log('Game not found');
          setIsLoading(false);
        });

        // If socket is already connected, request game data immediately
        if (socket.connected) {
          requestGameData();
        }
      } catch (error) {
        console.error('Error setting up socket:', error);
        setIsLoading(false);
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up socket listeners in GamePage');
        socket.off('connect');
        socket.off('gameData');
        socket.off('playerJoined');
        socket.off('gameNotFound');
      }
    };
  }, [gameId]);

  useEffect(() => {
    // Set a timeout to change isLoading to false if it's still true after 5 seconds
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached');
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  if (isLoading) {
    return <div>Chargement des données du jeu...</div>;
  }

  if (!game) {
    return <div>Jeu non trouvé ou erreur de chargement.</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[600px] p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{game.name}</h1>
        <h2 className="text-xl mb-4 text-center">
          Joueurs ({game.players.length}/{game.maxPlayers})
        </h2>
        <div className="space-y-2">
          {game.players.map((player, index) => (
            <div key={player.id} className="p-2 bg-gray-100 rounded">
              Joueur {index + 1}: {player.name}
            </div>
          ))}
        </div>
        {game.players.length < game.maxPlayers && (
          <p className="mt-4 text-center text-gray-600">
            En attente d'autres joueurs...
          </p>
        )}
        {game.players.length === game.maxPlayers && (
          <p className="mt-4 text-center text-green-600 font-bold">
            La partie va commencer !
          </p>
        )}
      </div>
    </div>
  );
}
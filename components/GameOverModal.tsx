"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { ModalContextProps } from "@/lib/types";
import { BaseGameModal } from "./BaseGameModal";

interface GameOverModalProps {
  modalContext: ModalContextProps;
  winners: Array<{
    id: string;
    name: string;
    points: number;
  }>;
  onPlayAgain: () => void;
}

const GameOverModal = ({
  modalContext,
  winners,
  onPlayAgain,
}: GameOverModalProps) => {
  const { modalStates, modalActions } = modalContext;
  if (!modalStates.isGameOverModalOpen) return;
  const handleClose = () => {
    modalActions.setIsGameOverModalOpen(false);
  };

  return (
    <BaseGameModal
      isOpen={modalStates.isGameOverModalOpen}
      onClose={handleClose}
      title="Game end"
    >
      <Card className="w-96 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Partie terminée!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              {winners.length > 1 ? "Les gagnants sont:" : "Le gagnant est:"}
            </h3>
            <div className="space-y-2">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className="text-center p-2 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium">{winner.name}</p>
                  <p className="text-sm text-gray-600">
                    {winner.points} points
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onPlayAgain} className="w-full">
            Rejouer
          </Button>
        </CardFooter>
      </Card>
    </BaseGameModal>
  );
};

export default GameOverModal;

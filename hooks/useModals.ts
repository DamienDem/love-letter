// hooks/useModals.ts
'use client';
import { useState } from 'react';
import { ICard } from "@/lib/types";

export const useModals = () => {
  const [isPlayCardModalOpen, setIsPlayCardModalOpen] = useState(false);
  const [isPriestModalOpen, setIsPriestModalOpen] = useState(false);
  const [isChancelierModalOpen, setIsChancelierModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [revealedCard, setRevealedCard] = useState<ICard | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<string>("");
  const [priestPlayerId, setPriestPlayerId] = useState<string | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  const closeAllModals = () => {
    setIsPlayCardModalOpen(false);
    setIsPriestModalOpen(false);
    setIsChancelierModalOpen(false);
    setSelectedCardId(null);
    setPriestPlayerId(null);
  };

  return {
    modalStates: {
      isPlayCardModalOpen,
      isPriestModalOpen,
      isChancelierModalOpen,
      selectedCardId,
      revealedCard,
      targetPlayer,
      priestPlayerId,
      isGameOverModalOpen,
    },
    modalActions: {
      setIsPlayCardModalOpen,
      setIsPriestModalOpen,
      setIsChancelierModalOpen,
      setSelectedCardId,
      setRevealedCard,
      setTargetPlayer,
      setPriestPlayerId,
      closeAllModals,
      setIsGameOverModalOpen,
    },
  };
};
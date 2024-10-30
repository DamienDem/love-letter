'use client';
import { ModalContextProps } from "@/lib/types";
import { BaseGameModal } from "./BaseGameModal";

interface PriestEffectModalProps {
  modalContext: ModalContextProps;
}

export const PriestEffectModal: React.FC<PriestEffectModalProps> = ({
  modalContext
}) => {
  const { modalStates, modalActions } = modalContext;

  const handleClose = () => {
    modalActions.setIsPriestModalOpen(false);
    modalActions.setPriestPlayerId(null);
  };

  return (
    <BaseGameModal
      isOpen={modalStates.isPriestModalOpen}
      onClose={handleClose}
      title="Priest Effect"
    >
      {modalStates.revealedCard ? (
        <div className="space-y-2">
          <p>You revealed {modalStates.targetPlayer}s card:</p>
          <div className="p-4 bg-gray-50 rounded">
            <p className="font-bold">{modalStates.revealedCard.type}</p>
            <p className="text-sm text-gray-600">Value: {modalStates.revealedCard.value}</p>
          </div>
        </div>
      ) : (
        <p>No card revealed</p>
      )}
    </BaseGameModal>
  );
};
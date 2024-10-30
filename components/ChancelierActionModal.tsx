'use client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { ICard, ModalContextProps } from '@/lib/types';
import { BaseGameModal } from './BaseGameModal';
import { Button } from './ui/button';
import { SortableCard } from './SortableCard';

interface ChancelierActionModalProps {
  modalContext: ModalContextProps;
  chancellorDrawnCards: ICard[];
  onFinishAction: (action: { selectedCardIndex: number; topCardIndex?: number }) => void;
}

export const ChancelierActionModal: React.FC<ChancelierActionModalProps> = ({
  modalContext,
  chancellorDrawnCards,
  onFinishAction,
}) => {
  const { modalStates, modalActions } = modalContext;
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [remainingCards, setRemainingCards] = useState<ICard[]>([]);
  const [step, setStep] = useState<'select' | 'order'>('select');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!modalStates.isChancelierModalOpen) return;
    
    setSelectedCardIndex(null);
    setRemainingCards([]);
    setStep('select');
  }, [modalStates.isChancelierModalOpen]);

  const handleClose = () => {
    modalActions.setIsChancelierModalOpen(false);
  };

  const handleCardSelect = (index: number) => {
    setSelectedCardIndex(index);
    const newRemainingCards = chancellorDrawnCards.filter((_, i) => i !== index);
    setRemainingCards(newRemainingCards);
    
    if (newRemainingCards.length <= 1) {
      onFinishAction({ selectedCardIndex: index });
      handleClose();
    } else {
      setStep('order');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRemainingCards((cards) => {
        const oldIndex = cards.findIndex(card => card.id === active.id);
        const newIndex = cards.findIndex(card => card.id === over.id);
        return arrayMove(cards, oldIndex, newIndex);
      });
    }
  };

  if (!modalStates.isChancelierModalOpen || chancellorDrawnCards.length === 0) {
    return null;
  }

  return (
    <BaseGameModal
      isOpen={modalStates.isChancelierModalOpen}
      onClose={handleClose}
      title="Chancelier Action"
      footer={
        step === 'order' ? (
          <>
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
            <Button 
              onClick={() => {
                if (selectedCardIndex !== null && remainingCards.length === 2) {
                  onFinishAction({
                    selectedCardIndex,
                    topCardIndex: 0
                  });
                  handleClose();
                }
              }}
            >
              Confirm
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        )
      }
    >
      {step === 'select' ? (
        <div className="grid grid-cols-1 gap-4">
          {chancellorDrawnCards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardSelect(index)}
              className="cursor-pointer p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="font-semibold">{card.type}</div>
              <div className="text-sm">Value: {card.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <Alert>
            <AlertDescription>
              <p className="font-bold mb-2">Selected card:</p>
              {selectedCardIndex !== null && (
                <div className="p-2 bg-blue-50 rounded">
                  {chancellorDrawnCards[selectedCardIndex].type}
                  (Value: {chancellorDrawnCards[selectedCardIndex].value})
                </div>
              )}
            </AlertDescription>
          </Alert>

          <div>
            <h4 className="font-medium mb-2">Order remaining cards:</h4>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={remainingCards.map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {remainingCards.map((card) => (
                    <SortableCard
                      key={card.id}
                      id={card.id}
                      card={card}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}
    </BaseGameModal>
  );
};
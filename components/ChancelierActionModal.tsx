import React, { useState, useEffect } from 'react';
import { Card } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface ChancelierActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chancellorDrawnCards: Card[];
  onFinishAction: (keptCardIndex: number, cardOrder: number[]) => void;
}

const SortableItem = ({ id, card }: { id: string; card: Card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white border rounded-lg shadow-sm cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="font-semibold text-lg">{card.type}</div>
      <div className="text-sm text-gray-600">Valeur: {card.value}</div>
    </div>
  );
};

export default function ChancelierActionModal({
  isOpen,
  onClose,
  chancellorDrawnCards,
  onFinishAction,
}: ChancelierActionModalProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [step, setStep] = useState<'select' | 'order'>('select');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen && chancellorDrawnCards.length > 0) {
      console.log("Modal opened with cards:", chancellorDrawnCards);
      setSelectedCardIndex(null);
      setRemainingCards([]);
      setStep('select');
    }
  }, [isOpen, chancellorDrawnCards]);


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

// ChancelierActionModal.tsx

const handleFinish = () => {
  if (selectedCardIndex !== null && remainingCards.length === 2) {
    // Créer l'ordre des cartes basé sur leur position dans chancellorDrawnCards
    const cardOrder = remainingCards.map(remainingCard => 
      chancellorDrawnCards.findIndex(originalCard => originalCard.id === remainingCard.id)
    );

    console.log("Finalizing chancellor action:", {
      selectedCardIndex,
      remainingCards,
      cardOrder,
      originalCards: chancellorDrawnCards
    });

    // Vérifier que tous les index sont valides
    if (cardOrder.some(index => index === -1)) {
      console.error("Invalid card order:", cardOrder);
      return;
    }

    onFinishAction(selectedCardIndex, cardOrder);
  }
};

const handleCardSelect = (index: number) => {
  console.log("Card selected:", {
    selectedIndex: index,
    card: chancellorDrawnCards[index]
  });
  
  setSelectedCardIndex(index);
  const newRemainingCards = chancellorDrawnCards.filter((_, i) => i !== index);
  console.log("Remaining cards:", newRemainingCards);
  setRemainingCards(newRemainingCards);
  setStep('order');
};

  // Guard pour le cas où nous n'avons pas les bonnes cartes
  if (!isOpen || chancellorDrawnCards.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Action du Chancelier</DialogTitle>
          <DialogDescription>
            {step === 'select' 
              ? "Choisissez une carte à conserver dans votre main"
              : "Organisez l'ordre des cartes à remettre au fond du deck"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'select' ? (
            <div className="grid grid-cols-3 gap-4">
              {chancellorDrawnCards.map((card, index) => (
                <div
                  key={card.id}
                  onClick={() => handleCardSelect(index)}
                  className="cursor-pointer p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-semibold">{card.type}</div>
                  <div className="text-sm">Valeur: {card.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  <p className="font-bold mb-2">Carte conservée:</p>
                  {selectedCardIndex !== null && (
                    <div className="p-2 bg-blue-50 rounded">
                      {chancellorDrawnCards[selectedCardIndex].type}
                      (Valeur: {chancellorDrawnCards[selectedCardIndex].value})
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-2">Ordre des cartes à replacer:</h4>
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
                        <SortableItem
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
        </div>

        <DialogFooter>
          {step === 'select' ? (
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('select');
                  setSelectedCardIndex(null);
                  setRemainingCards([]);
                }}
              >
                Retour
              </Button>
              <Button 
                onClick={handleFinish}
                disabled={remainingCards.length !== 2}
              >
                Confirmer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// components/JoinGamePage/JoinGameDialog.tsx
'use client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  
  interface JoinGameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    playerName: string;
    onPlayerNameChange: (name: string) => void;
    onJoin: () => void;
  }
  
  export const JoinGameDialog: React.FC<JoinGameDialogProps> = ({
    isOpen,
    onClose,
    playerName,
    onPlayerNameChange,
    onJoin,
  }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejoindre la partie</DialogTitle>
          <DialogDescription>
            Entrez votre nom pour rejoindre la partie.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Votre nom"
        />
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Annuler
          </Button>
          <Button onClick={onJoin}>Rejoindre</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
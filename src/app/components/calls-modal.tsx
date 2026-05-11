import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Phone, Video, User } from 'lucide-react';
import { User as UserType } from '@/lib/supabase';

interface CallsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

export function CallsModal({ open, onOpenChange, onVoiceCall, onVideoCall }: CallsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Calls</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600 text-center">
            Start a call with a user from your chats
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => {
                onVoiceCall();
                onOpenChange(false);
              }}
              className="flex flex-col items-center py-6 bg-green-500 hover:bg-green-600"
            >
              <Phone className="w-8 h-8 mb-2" />
              <span>Voice Call</span>
            </Button>
            
            <Button
              onClick={() => {
                onVideoCall();
                onOpenChange(false);
              }}
              className="flex flex-col items-center py-6 bg-blue-500 hover:bg-blue-600"
            >
              <Video className="w-8 h-8 mb-2" />
              <span>Video Call</span>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Select a chat first, then start a call
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
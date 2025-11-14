'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Medication } from '@/lib/types';
import { useEffect, useRef } from 'react';
import type { LanguageKey } from '@/lib/languages';
import { getUIContent } from '@/lib/languages';
import { BellRing, Volume2 } from 'lucide-react';

interface AlarmDialogProps {
  alarm: Medication | null;
  onSnooze: (medication: Medication) => void;
  onDismiss: () => void;
  language: LanguageKey;
}

export function AlarmDialog({ alarm, onSnooze, onDismiss, language }: AlarmDialogProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const content = getUIContent(language);

  useEffect(() => {
    const audio = audioRef.current;
    if (alarm && audio) {
        // The `autoPlay` prop will handle starting the audio.
        // We can add additional logic here if needed, like handling play failures.
        audio.play().catch(e => console.error("Audio playback failed:", e));
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [alarm]);

  if (!alarm) return null;
  
  const handleDismiss = () => {
      onDismiss();
  };
  
  const handleSnooze = () => {
      onSnooze(alarm);
  };

  return (
    <AlertDialog open={!!alarm} onOpenChange={(open) => !open && handleDismiss()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-2xl font-headline">
            <div className="p-3 bg-primary/10 rounded-full">
              <BellRing className="h-7 w-7 text-primary animate-swing" />
            </div>
            {content.alarmTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-foreground pt-4 text-center">
            Take <strong className="font-bold text-primary">{alarm.dosage}</strong> of{' '}
            <strong className="font-bold text-primary">{alarm.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center items-center py-4">
            <Volume2 className="h-5 w-5 text-muted-foreground mr-2"/>
            <p className="text-sm text-muted-foreground">Playing audio reminder...</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSnooze}>{content.snooze}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDismiss} className="bg-primary text-primary-foreground">{content.dismiss}</AlertDialogAction>
        </AlertDialogFooter>
        {alarm.audioUri && <audio ref={audioRef} src={alarm.audioUri} autoPlay loop />}
      </AlertDialogContent>
    </AlertDialog>
  );
}

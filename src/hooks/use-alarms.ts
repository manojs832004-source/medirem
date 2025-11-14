'use client';

import { useEffect, useRef } from 'react';
import type { Medication } from '@/lib/types';
import { format } from 'date-fns';

export function useAlarms(
  medications: Medication[], 
  onAlarm: (medication: Medication) => void,
  activeAlarm: Medication | null
) {
  const triggeredAlarms = useRef<Set<string>>(new Set());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      if (now.getSeconds() === 0) {
        triggeredAlarms.current.clear();
      }

      medications.forEach((medication) => {
        const alarmId = `${medication.id}-${medication.time}`;
        if (
          medication.time === currentTime && 
          !triggeredAlarms.current.has(alarmId) &&
          activeAlarm?.id !== medication.id
        ) {
          onAlarm(medication);
          triggeredAlarms.current.add(alarmId);
        }
      });
    }, 1000); // Check every second for precision

    return () => clearInterval(intervalId);
  }, [medications, onAlarm, activeAlarm]);
}

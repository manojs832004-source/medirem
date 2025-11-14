'use client';

import type { Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Clock, Pill, Trash2 } from 'lucide-react';
import { getUIContent, type LanguageKey } from '@/lib/languages';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface MedicationListProps {
  medications: Medication[];
  deleteMedication: (id: string) => void;
  language: LanguageKey;
}

export function MedicationList({ medications, deleteMedication, language }: MedicationListProps) {
  const content = getUIContent(language);

  if (medications.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-card rounded-2xl mt-2">
        <h3 className="text-xl font-semibold mb-2">{content.noMedications}</h3>
        <p className="text-muted-foreground">Add a new medication to get started.</p>
      </div>
    );
  }
  
  const sortedMedications = [...medications].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-3">
        {sortedMedications.map((med) => (
            <Card key={med.id}>
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 bg-accent rounded-lg relative h-14 w-14 flex items-center justify-center">
                        {med.image ? (
                            <Image src={med.image} alt={med.name} layout="fill" objectFit="cover" className="rounded-lg" />
                        ) : (
                            <Pill className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4"/>
                        <span className="font-medium text-foreground">{med.time}</span>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );
}

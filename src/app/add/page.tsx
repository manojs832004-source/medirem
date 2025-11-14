
'use client';

import { MedicationForm } from '@/components/medication-form';
import useLocalStorage from '@/hooks/use-local-storage';
import { getUIContent, type LanguageKey } from '@/lib/languages';
import type { Medication } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

export default function AddMedicinePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [language] = useLocalStorage<LanguageKey>('language', 'en-US');
  const content = getUIContent(language);

  const addMedication = async (medication: Omit<Medication, 'id'>) => {
    if (firestore && user) {
      const newMedDocRef = doc(collection(firestore, 'users', user.uid, 'medicationSchedules'));
      await setDoc(newMedDocRef, {
        ...medication,
        id: newMedDocRef.id, // Ensure the document data has the ID
        userId: user.uid,
      });
      router.push('/');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
       <header className="flex items-center gap-4 mb-8">
         <Button variant="ghost" size="icon" onClick={() => router.back()}>
           <ChevronLeft className="h-6 w-6" />
           <span className="sr-only">Back</span>
         </Button>
         <h1 className="text-xl font-bold">{content.addMedication}</h1>
       </header>
       <div className='flex flex-col items-center'>
            <MedicationForm language={language} addMedication={addMedication} />
       </div>
    </div>
  );
}

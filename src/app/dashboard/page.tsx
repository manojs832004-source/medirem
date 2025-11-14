
'use client';

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import useLocalStorage from '@/hooks/use-local-storage';
import { getUIContent, LanguageKey } from '@/lib/languages';
import { ChevronLeft, MoreHorizontal, Pill, Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Medication } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Appointment {
    id: string;
    date: string;
    title: string;
    notes?: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const router = useRouter();
  const [language] = useLocalStorage<LanguageKey>('language', 'en-US');
  const content = getUIContent(language);


  const medicationCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'medicationSchedules') : null),
    [firestore, user]
  );
  
  const { data: medications, isLoading: medicationsLoading } = useCollection<Medication>(medicationCollectionRef);


  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  const medicationsForSelectedDate = (medications || []).filter(med => {
    // This logic needs to be more robust for real applications, comparing dates properly
    return true; 
  }).sort((a,b) => a.time.localeCompare(b.time));

  const appointmentsForSelectedDate = appointments.filter(app => {
    if (!selectedDate) return false;
    const appDate = new Date(app.date);
    return appDate.getFullYear() === selectedDate.getFullYear() &&
           appDate.getMonth() === selectedDate.getMonth() &&
           appDate.getDate() === selectedDate.getDate();
  });

  const handleAddAppointment = () => {
    if (!appointmentTitle.trim() || !selectedDate) return;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      date: selectedDate.toISOString(),
      title: appointmentTitle,
      notes: appointmentNotes,
    };
    setAppointments([...appointments, newAppointment]);
    setAppointmentTitle('');
    setAppointmentNotes('');
    setShowAddAppointment(false);
  };


  return (
    <div className="p-4 md:p-6 text-foreground bg-background min-h-screen">
      <header className="flex items-center justify-between mb-8">
         <Button variant="ghost" size="icon" onClick={() => router.back()}>
           <ChevronLeft className="h-6 w-6" />
           <span className="sr-only">Back</span>
         </Button>
         <h1 className="text-xl font-bold">{content.dashboard}</h1>
         <Button variant="ghost" size="icon">
           <MoreHorizontal className="h-6 w-6" />
         </Button>
       </header>

      <main className="space-y-8">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-2xl border-none shadow-md bg-card p-2"
           styles={{
              head_cell: {
                width: '40px',
                textTransform: 'capitalize',
                fontSize: '0.8rem',
              },
              cell: {
                width: '40px',
                height: '40px',
              },
              day: {
                width: '40px',
                height: '40px',
                borderRadius: '9999px',
              },
              day_selected: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              },
              day_today: {
                fontWeight: 'bold',
                color: 'hsl(var(--primary))'
              }
           }}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">{selectedDate ? format(selectedDate, 'MMMM d') : ''}</h2>
            <Button size="sm" onClick={() => setShowAddAppointment(!showAddAppointment)} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                {content.addAppointment}
            </Button>
          </div>

          {showAddAppointment && selectedDate && (
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold">{content.addAppointment} for {format(selectedDate, 'MMMM d')}</h3>
                    <Input 
                        placeholder={`${content.doctorName}'s ${content.appointments}`}
                        value={appointmentTitle}
                        onChange={(e) => setAppointmentTitle(e.target.value)}
                    />
                    <Textarea 
                        placeholder={`${content.notes} (${content.language.toLocaleLowerCase().includes('en') ? 'optional' : 'opcional'})`}
                        value={appointmentNotes}
                        onChange={(e) => setAppointmentNotes(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowAddAppointment(false)}>Cancel</Button>
                        <Button onClick={handleAddAppointment} className="bg-primary text-primary-foreground">Save</Button>
                    </div>
                </CardContent>
            </Card>
          )}

          {appointmentsForSelectedDate.map(app => (
            <Card key={app.id}>
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 bg-accent rounded-lg">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold">{app.title}</h3>
                        {app.notes && <p className="text-sm text-muted-foreground">{app.notes}</p>}
                    </div>
                </CardContent>
            </Card>
          ))}


          {medicationsLoading ? <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin text-primary" /> : medicationsForSelectedDate.map(med => (
             <div key={med.id} className="flex items-center gap-4">
                <p className="w-16 text-sm text-muted-foreground">{med.time}</p>
                <div className="flex-grow bg-card p-4 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                        <h3 className="font-bold">{med.name}</h3>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </div>
                    <div className="p-3 bg-accent rounded-lg">
                        <Pill className="h-6 w-6 text-primary" />
                    </div>
                </div>
             </div>
          ))}
           {medicationsForSelectedDate.length === 0 && appointmentsForSelectedDate.length === 0 && !medicationsLoading && (
            <p className="text-center text-muted-foreground pt-4">{content.noMedications}</p>
           )}
        </div>

      </main>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import type { Medication } from '@/lib/types';
import { AlarmDialog } from '@/components/alarm-dialog';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAlarms } from '@/hooks/use-alarms';
import { getUIContent, type LanguageKey } from '@/lib/languages';
import { addMinutes, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Pill, Clock, Settings, Edit, Trash2, LogOut, User as UserIcon } from 'lucide-react';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [activeAlarm, setActiveAlarm] = useState<Medication | null>(null);
  const [language, setLanguage] = useLocalStorage<LanguageKey>('language', 'en-US');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const content = getUIContent(language);

  const medicationCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'medicationSchedules') : null),
    [firestore, user]
  );
  
  const { data: medications, isLoading: medicationsLoading } = useCollection<Medication>(medicationCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const deleteMedication = (id: string) => {
    if (firestore && user) {
        const docRef = doc(firestore, 'users', user.uid, 'medicationSchedules', id);
        deleteDoc(docRef);
    }
  };
  
  const handleLogout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleAlarm = (medication: Medication) => {
    if (!activeAlarm) {
      setActiveAlarm(medication);
    }
  };
  
  // The useAlarms hook needs to be updated to handle a potentially null `medications` array
  useAlarms(medications || [], handleAlarm, activeAlarm);

  const handleSnooze = (medicationToSnooze: Medication) => {
    const snoozedTime = addMinutes(new Date(), 5);
    const newTime = format(snoozedTime, 'HH:mm');

    if(firestore && user && medicationToSnooze.id) {
        const docRef = doc(firestore, 'users', user.uid, 'medicationSchedules', medicationToSnooze.id);
        updateDoc(docRef, { time: newTime });
    }
    setActiveAlarm(null);
  };

  const handleDismiss = () => {
    if (activeAlarm) {
      // This will be updated to log medication intake
      setActiveAlarm(null);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const medicationsToTake = (medications || []).sort((a,b) => a.time.localeCompare(b.time));

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground bg-background">
      <header className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={user.photoURL || "https://picsum.photos/seed/user/100/100"} alt="User Avatar" width={40} height={40} className="rounded-full" />
            <h1 className="text-2xl font-bold">Hey, {user.displayName || 'there'}! 👋</h1>
          </div>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 md:px-6 space-y-6">
        <div className='py-4'>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold text-lg">{format(new Date(), 'eeee, d MMMM')}</h2>
            </div>
            <div className="flex justify-between items-center space-x-2">
                {weekDays.map(day => (
                    <button key={day.toString()} onClick={() => setSelectedDate(day)} className={cn("flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-colors", format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                        <span className="text-xs font-medium">{format(day, 'E')}</span>
                        <span className="text-lg font-bold">{format(day, 'd')}</span>
                    </button>
                ))}
            </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold tracking-tight">{content.yourSchedule}</h2>
             <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-primary h-auto p-0">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                        if(medicationsToTake.length > 0 && medicationsToTake[0].id) {
                            deleteMedication(medicationsToTake[0].id)
                        }
                    }} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete First</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
           <div className="space-y-3">
            {medicationsLoading ? <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin text-primary" /> : medicationsToTake.length > 0 ? medicationsToTake.map((med) => (
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
                            <p className="text-sm text-muted-foreground">
                              {med.dosage}
                              {med.foodContext && med.foodContext !== 'any' && ` ・ ${med.foodContext.charAt(0).toUpperCase() + med.foodContext.slice(1)} food`}
                              {med.reminderText && ` ・ ${med.reminderText}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4"/>
                            <span className="font-medium text-foreground">{med.time}</span>
                        </div>
                    </CardContent>
                </Card>
            )) : (
                 <div className="text-center py-12 px-6 bg-card rounded-2xl mt-2">
                    <h3 className="text-xl font-semibold mb-2">{content.noMedications}</h3>
                    <p className="text-muted-foreground">Add a new medication to get started.</p>
                </div>
            )}
          </div>
        </div>
      </main>
      
      <AlarmDialog
        alarm={activeAlarm}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
        language={language}
      />
    </div>
  );
}

// Minimal Card components for layout
const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`bg-card rounded-2xl shadow-sm ${className}`}>{children}</div>
);
const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={` ${className}`}>{children}</div>
);

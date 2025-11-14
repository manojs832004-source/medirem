
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { languages, LanguageKey, getUIContent } from '@/lib/languages';
import { Loader2, LogOut, Languages as LanguageIcon, ChevronLeft, User, Clipboard, BarChart3, Edit, Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  photoURL: z.string().optional(),
});


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [language, setLanguage] = useLocalStorage<LanguageKey>('language', 'en-US');
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const content = getUIContent(language);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      displayName: user?.displayName || '',
      photoURL: user?.photoURL || '',
    },
  });
  const [imagePreview, setImagePreview] = useState<string | null>(user?.photoURL || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
      setImagePreview(user.photoURL || null);
    }
  }, [user, form]);


  useEffect(() => {
    if (userDocRef) {
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.languagePreference) {
            setLanguage(userData.languagePreference);
          }
        }
      });
    }
  }, [userDocRef, setLanguage]);

  const handleLanguageChange = async (newLanguage: LanguageKey) => {
    setLanguage(newLanguage);
    if (userDocRef) {
        setIsSaving(true);
        try {
            await updateDoc(userDocRef, { languagePreference: newLanguage });
            toast({ title: 'Success', description: 'Language preference saved!' });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save language preference.',
            });
            console.error('Error updating language:', error);
        } finally {
            setIsSaving(false);
        }
    }
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };

  const copyUserId = () => {
    if (user) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: 'Copied!', description: 'Your Patient ID has been copied to the clipboard.' });
    }
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue('photoURL', dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user || !auth.currentUser) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    setIsProfileSaving(true);
    try {
        await updateProfile(auth.currentUser, {
            displayName: values.displayName,
            photoURL: values.photoURL || '',
        });

        if (userDocRef) {
            await updateDoc(userDocRef, {
                displayName: values.displayName,
            });
        }
        
        toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
        setIsDialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProfileSaving(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen text-foreground">
      <header className="flex items-center gap-4 mb-8">
         <Button variant="ghost" size="icon" onClick={() => router.back()}>
           <ChevronLeft className="h-6 w-6" />
           <span className="sr-only">Back</span>
         </Button>
         <h1 className="text-xl font-bold">{content.profile}</h1>
      </header>

      <main className="max-w-lg mx-auto space-y-6">
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <Image
                    src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`}
                    alt="User Avatar"
                    width={100}
                    height={100}
                    className="rounded-full border-4 border-primary/50 shadow-lg"
                />
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                <p className="text-muted-foreground">{user.email}</p>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="flex justify-center mb-6">
                            <div className="relative w-32 h-32">
                                <Image 
                                    src={imagePreview || `https://picsum.photos/seed/${user.uid}/100/100`} 
                                    alt="Avatar preview" 
                                    width={128} 
                                    height={128} 
                                    className="rounded-full object-cover" 
                                />
                                <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="displayName" className="text-sm font-medium">Name</label>
                            <Input id="displayName" {...form.register('displayName')} className="mt-1" />
                            {form.formState.errors.displayName && <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>}
                        </div>
                         <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isProfileSaving}>
                                {isProfileSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                         </DialogFooter>
                    </form>
                </DialogContent>
             </Dialog>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Your Stats
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="bg-accent/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Meds Today</p>
                </div>
                 <div className="bg-accent/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold">95%</p>
                    <p className="text-sm text-muted-foreground">Adherence</p>
                </div>
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Patient ID
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Share this ID with your caretaker to allow them to monitor your schedule and adherence.</p>
                <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                    <code className="text-sm flex-grow truncate">{user.uid}</code>
                    <Button size="icon" variant="ghost" onClick={copyUserId}>
                        <Clipboard className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>

         <Card>
             <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <LanguageIcon className="h-5 w-5 text-primary" />
                    Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{content.language}</label>
                    <div className='flex items-center gap-2'>
                        {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
                        <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-auto md:w-[180px]">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Button onClick={handleLogout} variant="outline" className="w-full h-12 text-lg rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </main>
    </div>
  );
}

    
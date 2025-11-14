
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getUIContent, type LanguageKey } from '@/lib/languages';
import { generateMedicationAudio } from '@/app/actions';
import type { Medication } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Trash2, Wand2, PlayCircle, PauseCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Pill name is required.' }),
  dosage: z.string().min(1, { message: 'Dosage is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Use HH:MM format.' }),
  reminderText: z.string().optional(),
  image: z.string().optional(),
  audioUri: z.string().optional(),
  foodContext: z.enum(['before', 'after', 'any']).default('any'),
});

interface MedicationFormProps {
  language: LanguageKey;
  addMedication: (medication: Omit<Medication, 'id'>) => void;
}

export function MedicationForm({ language, addMedication }: MedicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewAudioUri, setPreviewAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const content = getUIContent(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      dosage: '',
      time: '',
      reminderText: '',
      image: '',
      audioUri: '',
      foodContext: 'any',
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        form.setValue('image', dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', '');
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvertToAudio = async () => {
    const values = form.getValues();
    if (!values.name || !values.dosage || !values.time) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out Pill name, Dose, and Time before generating audio.',
        });
        return;
    }

    setIsConverting(true);
    setPreviewAudioUri(null);
    form.setValue('audioUri', '');
    
    try {
        const result = await generateMedicationAudio({ ...values, language });
        if (result.success && result.audioUri) {
            setPreviewAudioUri(result.audioUri);
            form.setValue('audioUri', result.audioUri);
            toast({
                title: 'Audio Generated!',
                description: 'You can now preview the alarm sound.',
            });
        } else {
            throw new Error(result.error || 'Failed to generate audio.');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Conversion Failed',
            description: error.message,
        });
    } finally {
        setIsConverting(false);
    }
  };

  const toggleAudioPreview = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    let audioUri = values.audioUri;
    if (!audioUri) {
        const audioResult = await generateMedicationAudio({ ...values, language });
        if (audioResult.success && audioResult.audioUri) {
            audioUri = audioResult.audioUri;
        } else {
            toast({
                variant: 'destructive',
                title: 'Audio Error',
                description: audioResult.error || 'Could not generate audio for the alarm.',
            });
            setIsSubmitting(false);
            return;
        }
    }

    const newMedication: Omit<Medication, 'id'> = {
      name: values.name,
      dosage: values.dosage,
      time: values.time,
      language,
      audioUri: audioUri,
      image: values.image,
      reminderText: values.reminderText,
      foodContext: values.foodContext,
    };
    addMedication(newMedication);
    form.reset();
    setImagePreview(null);
    setPreviewAudioUri(null);
    toast({
      title: 'Success!',
      description: `${values.name} has been added.`,
    });
    
    setIsSubmitting(false);
  }

  return (
    <div className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="flex justify-center mb-6">
                <div className="relative w-40 h-40">
                  {imagePreview ? (
                     <>
                      <Image src={imagePreview} alt="Medication preview" layout="fill" objectFit="cover" className="rounded-full" />
                      <Button type="button" variant="destructive" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={removeImage}>
                         <Trash2 className="h-4 w-4" />
                      </Button>
                     </>
                  ) : (
                    <Button type="button" variant="outline" className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 text-muted-foreground border-dashed" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-8 w-8" />
                        <span>Add Photo</span>
                    </Button>
                  )}
                  <FormControl>
                     <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageChange}
                      />
                  </FormControl>
                </div>
            </div>

            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-muted-foreground">{content.medicationName}</FormLabel>
                    <FormControl>
                    <Input placeholder={content.medicationName} {...field} className="bg-card border-border h-12 rounded-xl focus-visible:ring-ring" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-muted-foreground">{content.dosage}</FormLabel>
                        <FormControl>
                        <Input placeholder="0.5" {...field} className="bg-card border-border h-12 rounded-xl focus-visible:ring-ring"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-muted-foreground">{content.time}</FormLabel>
                        <FormControl>
                        <Input type="time" {...field} className="bg-card border-border h-12 rounded-xl focus-visible:ring-ring"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField
              control={form.control}
              name="foodContext"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-muted-foreground">When to take?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="before" />
                        </FormControl>
                        <FormLabel className="font-normal">Before food</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="after" />
                        </FormControl>
                        <FormLabel className="font-normal">After food</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="any" />
                        </FormControl>
                        <FormLabel className="font-normal">Any</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="reminderText"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-muted-foreground">{content.customReminder}</FormLabel>
                    <div className="relative">
                        <FormControl>
                        <Textarea
                            placeholder={content.customReminderPlaceholder}
                            className="resize-none bg-card border-border rounded-xl focus-visible:ring-ring pr-24"
                            {...field}
                        />
                        </FormControl>
                         <Button type="button" size="sm" onClick={handleConvertToAudio} className="absolute top-1/2 -translate-y-1/2 right-2" disabled={isConverting}>
                            {isConverting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>}
                            <span className="ml-2 hidden sm:inline">Convert</span>
                        </Button>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            {previewAudioUri && (
              <div className="flex items-center gap-3 p-3 bg-accent rounded-xl">
                 <Button type="button" size="icon" variant="ghost" onClick={toggleAudioPreview}>
                    {isPlaying ? <PauseCircle className="h-6 w-6 text-primary"/> : <PlayCircle className="h-6 w-6 text-primary"/>}
                 </Button>
                 <p className="text-sm font-medium text-primary">Preview Alarm Audio</p>
                 <audio 
                    ref={audioRef} 
                    src={previewAudioUri} 
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
              </div>
            )}


            <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl mt-8 bg-primary text-primary-foreground" disabled={isSubmitting || isConverting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                content.addMedication
              )}
            </Button>
          </form>
        </Form>
    </div>
  );
}

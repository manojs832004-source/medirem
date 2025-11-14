'use server';

import { textToSpeechAlarm, TextToSpeechAlarmInput } from '@/ai/flows/text-to-speech-alarm';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  dosage: z.string().min(1, { message: 'Dosage is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format.' }),
  language: z.string(),
  reminderText: z.string().optional(),
  foodContext: z.enum(['before', 'after', 'any']).default('any'),
});

export async function generateMedicationAudio(values: z.infer<typeof formSchema>) {
  try {
    const alarmInput: TextToSpeechAlarmInput = {
      medicationName: values.name,
      dosage: values.dosage,
      time: values.time,
      language: values.language,
      customMessage: values.reminderText,
      foodContext: values.foodContext || 'any',
    };
    const { audioUri } = await textToSpeechAlarm(alarmInput);
    return { success: true, audioUri };
  } catch (error) {
    console.error('Error generating audio:', error);
    return { success: false, error: 'Failed to generate audio reminder.' };
  }
}

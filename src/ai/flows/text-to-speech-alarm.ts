'use server';

/**
 * @fileOverview Converts medication details into speech for audio reminders.
 *
 * - textToSpeechAlarm - Converts medication details into speech in the selected language.
 * - TextToSpeechAlarmInput - The input type for the textToSpeechAlarm function.
 * - TextToSpeechAlarmOutput - The return type for the textToSpeechAlarm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

const TextToSpeechAlarmInputSchema = z.object({
  medicationName: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication.'),
  time: z.string().describe('The time the medication should be taken.'),
  language: z.string().describe('The language for the audio reminder.'),
  customMessage: z.string().optional().describe('A custom message for the reminder.'),
  foodContext: z.enum(['before', 'after', 'any']).default('any').describe('When to take the medication relative to food.'),
});
export type TextToSpeechAlarmInput = z.infer<typeof TextToSpeechAlarmInputSchema>;

const TextToSpeechAlarmOutputSchema = z.object({
  audioUri: z.string().describe('The audio data URI in WAV format.'),
});
export type TextToSpeechAlarmOutput = z.infer<typeof TextToSpeechAlarmOutputSchema>;

export async function textToSpeechAlarm(input: TextToSpeechAlarmInput): Promise<TextToSpeechAlarmOutput> {
  return textToSpeechAlarmFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textToSpeechAlarmPrompt',
  input: {schema: TextToSpeechAlarmInputSchema},
  prompt: `Please read the following medication reminder in {{{language}}}: It's time to take {{{dosage}}} of {{{medicationName}}}.{{#if customMessage}} {{{customMessage}}}{{/if}}`,
});

const textToSpeechAlarmFlow = ai.defineFlow(
  {
    name: 'textToSpeechAlarmFlow',
    inputSchema: TextToSpeechAlarmInputSchema,
    outputSchema: TextToSpeechAlarmOutputSchema,
  },
  async input => {
    let reminderText = `It is time to take ${input.dosage} of ${input.medicationName} at ${input.time}`;
    if (input.foodContext && input.foodContext !== 'any') {
      reminderText += `, ${input.foodContext} food`;
    }
    if (input.customMessage) {
      reminderText += `. ${input.customMessage}`;
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: `Please read the following medication reminder in ${input.language}: ${reminderText}`,
    });

    if (!media) {
      throw new Error('No media returned from TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const audioUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {audioUri};
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

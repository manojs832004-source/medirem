
'use server';
/**
 * @fileOverview A flow to suggest medication based on symptoms.
 *
 * - suggestMedication - A function that suggests medication.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestionInputSchema = z.object({
  symptoms: z.string(),
  language: z.string(),
});

export async function suggestMedication(input: z.infer<typeof SuggestionInputSchema>): Promise<string> {
  return suggestMedicationFlow(input);
}

const suggestMedicationFlow = ai.defineFlow(
  {
    name: 'suggestMedicationFlow',
    inputSchema: SuggestionInputSchema,
    outputSchema: z.string(),
  },
  async ({symptoms, language}) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Based on the following symptoms, suggest potential over-the-counter medications or remedies.
Symptoms: "${symptoms}"
Provide a brief explanation for each suggestion.
You must always include the following disclaimer at the end of your response: "Disclaimer: This is not medical advice. Consult a healthcare professional."
Respond in the following language: ${language}.`,
      config: {
        maxOutputTokens: 1024,
      },
    });

    return llmResponse.text;
  }
);

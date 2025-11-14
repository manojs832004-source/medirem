
'use server';

import { suggestMedication } from '@/ai/flows/suggest-medication';

export async function suggestMedicationAction(symptoms: string, language: string) {
  try {
    const suggestionText = await suggestMedication({ symptoms, language });
    return { success: true, suggestion: suggestionText };
  } catch (error: any) {
    console.error('Error in suggestion flow:', error);
    const errorMessage =
      error.message || 'Failed to get suggestion due to an unknown server error.';
    return { success: false, error: errorMessage };
  }
}

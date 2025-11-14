export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // "HH:mm" format
  language: string;
  audioUri: string;
  reminderText?: string;
  image?: string;
  foodContext?: 'before' | 'after' | 'any';
}

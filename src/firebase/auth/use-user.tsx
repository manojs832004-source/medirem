
'use client';
import { useFirebase } from '@/firebase/provider';
import type { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

export interface UseUserResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  firestore: Firestore;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UseUserResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UseUserResult => {
  const { user, isUserLoading, userError, firestore } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError, firestore };
};

'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // This makes the Next.js error overlay appear during development.
      // It's recommended to handle this more gracefully in production.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    // Note: No cleanup function is returned. 
    // The error listener should be active for the entire lifecycle of the app.
  }, []);

  return null;
}

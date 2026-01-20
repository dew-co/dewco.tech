import { type FirebaseOptions, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

type FirebaseRuntimeConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

// Injected by public/env.js at runtime.
const runtimeEnv = (globalThis as { __env?: { firebase?: FirebaseRuntimeConfig } })
  .__env;

const firebaseConfig: FirebaseOptions = {
  apiKey: runtimeEnv?.firebase?.apiKey ?? '',
  authDomain: runtimeEnv?.firebase?.authDomain ?? '',
  projectId: runtimeEnv?.firebase?.projectId ?? '',
  storageBucket: runtimeEnv?.firebase?.storageBucket ?? '',
  messagingSenderId: runtimeEnv?.firebase?.messagingSenderId ?? '',
  appId: runtimeEnv?.firebase?.appId ?? '',
  measurementId: runtimeEnv?.firebase?.measurementId ?? '',
};

export const firebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const firestoreDb = getFirestore(firebaseApp);

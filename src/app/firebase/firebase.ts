import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDWP5cXyEFRKeYjwQGmzlVZvbZC65dR7mY',
  authDomain: 'dewco-tech.firebaseapp.com',
  projectId: 'dewco-tech',
  storageBucket: 'dewco-tech.firebasestorage.app',
  messagingSenderId: '1036026597842',
  appId: '1:1036026597842:web:c97933eeeffa1fd6e8f80b',
  measurementId: 'G-T36T268FLW',
};

export const firebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const firestoreDb = getFirestore(firebaseApp);

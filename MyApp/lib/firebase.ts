import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDdCRaKUcMnfMPSF9j_gzexe7Hx0geOxUc',
  authDomain: 'testproject-22277.firebaseapp.com',
  databaseURL: 'https://testproject-22277-default-rtdb.firebaseio.com',
  projectId: 'testproject-22277',
  storageBucket: 'testproject-22277.firebasestorage.app',
  messagingSenderId: '453096943439',
  appId: '1:453096943439:web:6fd87a45c7bc64ea505f3a',
  measurementId: 'G-YKY4G69SLN',
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDatabase(): Database {
  return getDatabase(getFirebaseApp());
}

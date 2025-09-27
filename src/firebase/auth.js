import { auth } from '../firebase/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { updateProfile } from 'firebase/auth';

export const setAuthDisplayName = async (username) => {
  if (!auth.currentUser) throw new Error('No current user');
  await updateProfile(auth.currentUser, { displayName: username });
  return auth.currentUser;
}
export const doCreateUserWithEmailAndPassword = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
}

export const doSignOut = async () => {
    return auth.signOut();
};

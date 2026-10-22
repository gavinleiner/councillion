import {initializeApp} from 'firebase/app';
import {initializeAuth,indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithCredential,signOut,onIdTokenChanged} from 'firebase/auth';
import {getDatabase,ref,set,update,get,onValue,onChildAdded,onChildChanged,onDisconnect,serverTimestamp,push,query,limitToLast,orderByChild,runTransaction,remove} from 'firebase/database';
import {FIREBASE_CONFIG} from './firebase-config.js';
import {googleIdentity} from './account-identity.js';
const app=initializeApp(FIREBASE_CONFIG),auth=initializeAuth(app,{persistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence]}),db=FIREBASE_CONFIG.databaseURL?getDatabase(app):null;
const requireDatabase=()=>{if(!db)throw Error('The new party server is still being configured. Try Daily Dive or Endless Cases meanwhile.');};
const ready=auth.authStateReady();
export async function restoreAccount(){await ready;return googleIdentity(auth.currentUser);}
export function watchAccount(callback,onError=()=>{}){let revision=0;return onIdTokenChanged(auth,async user=>{const turn=++revision;try{const identity=await googleIdentity(user);if(turn===revision&&auth.currentUser===user)callback(identity);}catch(error){if(turn===revision)onError(error);}},onError);}
export async function googleSession(token){requireDatabase();await ready;const user=(await signInWithCredential(auth,GoogleAuthProvider.credential(token))).user;return {uid:user.uid,identity:await googleIdentity(user)};}
export async function currentSession(expectedGoogleId){requireDatabase();await ready;const identity=await googleIdentity(auth.currentUser,expectedGoogleId);if(!identity)throw Error('Sign in with Google to play Puffer Party.');return {uid:auth.currentUser.uid,identity};}
export async function logout(){await ready;await signOut(auth);}
export {db,ref,set,update,get,onValue,onChildAdded,onChildChanged,onDisconnect,serverTimestamp,push,query,limitToLast,orderByChild,runTransaction,remove};

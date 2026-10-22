import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithCredential,signOut,onAuthStateChanged} from 'firebase/auth';
import {getDatabase,ref,set,update,get,onValue,onChildAdded,onChildChanged,onDisconnect,serverTimestamp,push,query,limitToLast,orderByChild,runTransaction,remove} from 'firebase/database';
import {FIREBASE_CONFIG} from './firebase-config.js';
const app=initializeApp(FIREBASE_CONFIG),auth=getAuth(app),db=FIREBASE_CONFIG.databaseURL?getDatabase(app):null;
const requireDatabase=()=>{if(!db)throw Error('The new party server is still being configured. Try Daily Dive or Endless Cases meanwhile.');};
const ready=setPersistence(auth,browserSessionPersistence).then(()=>new Promise(resolve=>{const unsub=onAuthStateChanged(auth,()=>{unsub();resolve();});}));
export async function googleSession(token){requireDatabase();await ready;const user=(await signInWithCredential(auth,GoogleAuthProvider.credential(token))).user;return {uid:user.uid};}
export async function currentSession(expectedGoogleId){requireDatabase();await ready;if(!auth.currentUser)throw Error('Sign in with Google to play Puffer Party.');const result=await auth.currentUser.getIdTokenResult();if(result.signInProvider!=='google.com'||(expectedGoogleId&&!auth.currentUser.providerData.some(p=>p.providerId==='google.com'&&p.uid===expectedGoogleId)))throw Error('A Google account is required.');return {uid:auth.currentUser.uid};}
export async function logout(){await ready;await signOut(auth);}
export {db,ref,set,update,get,onValue,onChildAdded,onChildChanged,onDisconnect,serverTimestamp,push,query,limitToLast,orderByChild,runTransaction,remove};

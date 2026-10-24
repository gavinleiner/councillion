import {initializeApp} from 'firebase/app';
import {initializeAuth,indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithCredential,signOut,onIdTokenChanged} from 'firebase/auth';
import {getDatabase,ref,set,update,get,onValue,onChildAdded,onChildChanged,onDisconnect,serverTimestamp,push,query,limitToLast,orderByChild,runTransaction,remove} from 'firebase/database';
import {FIREBASE_CONFIG} from './firebase-config.js';
import {googleIdentity} from './account-identity.js';
const app=initializeApp(FIREBASE_CONFIG),auth=initializeAuth(app,{persistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence]}),db=FIREBASE_CONFIG.databaseURL?getDatabase(app):null;
const requireDatabase=()=>{if(!db)throw Error('The new party server is still being configured. Try Daily Dive or Endless Cases meanwhile.');};
const ready=auth.authStateReady();
const provisioned=new Set();
async function accountIdentity(user,expected){const identity=await googleIdentity(user,expected);if(db&&identity?.honor&&!provisioned.has(identity.uid)){try{await runTransaction(ref(db,'accountHonors/'+identity.uid),current=>current?.kind===identity.honor.kind?undefined:identity.honor,{applyLocally:false});provisioned.add(identity.uid);}catch{/* A reconnect retries the protected badge grant without interrupting login. */}}return identity;}
export async function restoreAccount(){await ready;return accountIdentity(auth.currentUser);}
export function watchAccount(callback,onError=()=>{}){let revision=0;return onIdTokenChanged(auth,async user=>{const turn=++revision;try{const identity=await accountIdentity(user);if(turn===revision&&auth.currentUser===user)callback(identity);}catch(error){if(turn===revision)onError(error);}},onError);}
export async function googleSession(token){requireDatabase();await ready;const user=(await signInWithCredential(auth,GoogleAuthProvider.credential(token))).user;return {uid:user.uid,identity:await accountIdentity(user)};}
export async function currentSession(expectedGoogleId,{forceRefresh=false}={}){requireDatabase();await ready;const user=auth.currentUser;if(forceRefresh&&user)await user.getIdToken(true);const identity=await accountIdentity(user,expectedGoogleId);if(!identity)throw Error('Sign in with Google to play Puffer Party.');if(auth.currentUser!==user)throw Error('Your Google account changed. Please try joining again.');return {uid:user.uid,identity};}
export async function logout(){await ready;await signOut(auth);}
export {db,ref,set,update,get,onValue,onChildAdded,onChildChanged,onDisconnect,serverTimestamp,push,query,limitToLast,orderByChild,runTransaction,remove};

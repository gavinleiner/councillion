import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {verifyGoogleToken} from '../google-token.js';
const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await webcrypto.subtle.exportKey('jwk',pair.publicKey),kid:'test-key',alg:'RS256'};
const base={iss:'https://accounts.google.com',aud:'councillion-test',sub:'player-1',nonce:'random-test-nonce',iat:1000,exp:2000,name:'Counsel',email:'test@example.com'};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
async function token(changes={},header={}){const data=encode({alg:'RS256',kid:'test-key',...header})+'.'+encode({...base,...changes});return data+'.'+Buffer.from(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,Buffer.from(data))).toString('base64url');}
const options={clientId:base.aud,nonce:base.nonce,keys:[jwk],now:1500,cryptoApi:webcrypto};
test('Google identity requires a valid signature and matching audience, issuer, nonce, and expiry',async()=>{
 assert.equal((await verifyGoogleToken(await token(),options)).id,'player-1');
 for(const changes of [{aud:'other-app'},{azp:'other-app'},{iss:'https://attacker.example'},{nonce:'replayed'},{exp:1400},{iat:1700},{sub:''}])await assert.rejects(verifyGoogleToken(await token(changes),options));
 for(const header of [{alg:'none'},{kid:'unrecognized'}])await assert.rejects(verifyGoogleToken(await token({},header),options));
 const valid=(await token()).split('.');valid[1]=encode({...base,name:'Forged name'});await assert.rejects(verifyGoogleToken(valid.join('.'),options));
 await assert.rejects(verifyGoogleToken('broken.token',options));
});

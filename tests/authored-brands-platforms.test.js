import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/brands-platforms-specifications.json',import.meta.url))).questions;
const exact=(key,s)=>{const r=resolveAnswer(PACK_BY_ID.get('authored-'+key),s);assert.equal(r.status,'exact',key+': '+s);return r.answer.label;};
test('independently chosen familiar hotel and online-community inputs actually grade',()=>{for(const q of specs)for(const s of q.familiar)exact(q.key,s);});
test('hotel renames share identity while different hotel brands stay scoreable',()=>{
 for(const[a,b]of [['Hampton','Hampton Inn'],['InterContinental Hotels Group','IHG'],['AmeriSuites','Hyatt Place'],['Summerfield Suites','Hyatt House'],['Jurys Inn','Leonardo Hotels'],['Clarion Collection','Home Hotel'],['Motel168','Motel 168']])assert.equal(exact('hotel-brands',a),exact('hotel-brands',b));
 for(const[a,b]of [['Comfort Inn','Comfort Suites'],['Hyatt Place','Hyatt House'],['Hilton','Hilton Garden Inn'],['Holiday Inn','Holiday Inn Express'],['Nickelodeon Hotels & Resorts','Marriott']])assert.notEqual(exact('hotel-brands',a),exact('hotel-brands',b));
});
test('real social-service histories do not merge separate apps from the same company',()=>{
 for(const[a,b]of [['Twitter','X'],['Musical.ly','TikTok'],['Spot.IM','OpenWeb'],['Yammer','Viva Engage'],['Google Duo','Google Meet'],['Facebook Messenger','Messenger'],['myYearbook','MeetMe'],['MSN Messenger','Windows Live Messenger']])assert.equal(exact('social-platforms',a),exact('social-platforms',b));
 for(const[a,b]of [['Kwai','Kuaishou'],['Weixin','WeChat'],['Douyin','TikTok'],['Facebook','Messenger'],['Foursquare Swarm','Foursquare City Guide'],['QQ','Qzone']])assert.notEqual(exact('social-platforms',a),exact('social-platforms',b));
});
test('list footers, booking sites, unbuilt hotels and unrelated apps cannot become exact answers',()=>{
 for(const s of ['Airbnb','Booking.com','Trivago','Hawaii','World-wide','Hilton Honors','Marriott Bonvoy','Undergraduate by Hilton','Denizen Hotels','Nickelodeon Resorts by Marriott','Homes & Villas by Marriott Bonvoy','S Hotels & Resorts†www.shotelsresorts.com'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-hotel-brands'),s).status,'exact',s);
 for(const s of ['Gmail','Microsoft Excel','Google Docs','Moodle','Tinder','A subreddit','My Instagram profile'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-social-platforms'),s).status,'exact',s);
});
test('actual short platform names work without generated two-letter shortcuts',()=>{
 for(const s of ['X','VK','QQ','Hi5','AIM','ICQ'])exact('social-platforms',s);
 for(const s of ['FB','IG','YT','SC','GC','B'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-social-platforms'),s).status,'exact',s);
 for(const s of ['HH','HI','CP','HC'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-hotel-brands'),s).status,'exact',s);
});

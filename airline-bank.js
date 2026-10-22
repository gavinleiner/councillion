// Supplied by the user from the reference game's revealed answer list.
// These are answer-bank labels and game scores, not airline-policy guidance.
const groups={
100:`Falcon in cabin`,
85:`Award booking fee
Award redeposit fee
Baggage delivery
Baggage protection
Baggage subscription
Bassinet seat
Bike
Bundle
Buying elite status
Buying miles
Carbon offset
Celebration cake
Connection fee
Curbside check-in
DOT regulation fee
EU261 levy
Excess valuation
Express verification fee
Fare club membership
Fare lock
Firearms
Frequent flyer joining fee
Golf clubs
Group booking fee
Hands Free (easyJet)
Home check-in
In-flight phone calls
Infant equipment
Insurance surcharge
International service recovery fee
Medical oxygen
Meet and assist
Natural occurrence interruption fee
Online check-in fee
Paper ticket fee
Peak travel surcharge
Priority baggage
Quiet zone
Reactivating miles
Receipt fee
Refund administration fee
Scratch cards
Skycouch
Skynest
SMS confirmation
Status challenge
Stretcher
Surfboard
Travel SIM card
Wheelchair levy`,
60:`Airport check-in fee
Amenity kit
Booking fee
Credit card fee
Duty-free
Early check-in
Empty adjacent seat
Extra seat
Fast-track security
Flexible fare
Fuel surcharge
Gate-checked bag
Lap infant
Missed flight fee
Musical instrument
Name change fee
No-show fee
Oversized bag
Pet in hold
Phone booking fee
Power outlet
Preferred seat
Priority check-in
Reclining seat
Refundable fare
Same-day change
Ski equipment
Sports equipment
Standby
Unaccompanied minor`,
30:`Alcohol
Blanket
Boarding pass printing
Business class
Cancellation fee
Change fee
Exit row
Extra bag
First class
Headphones
Hot drinks
In-flight entertainment
Lounge access
Overweight bag
Pet in cabin
Pillow
Premium economy
Priority boarding
Seats together
Travel insurance
Upgrade
Water`,
10:`Carry-on bag
Checked bag
Drinks
Extra legroom
Meals
Seat selection
Snacks
Wi-Fi`
};
const aliases={
 'Falcon in cabin':['Falcon','Falcons','Falcon seat','Falcon cabin space'],
 'Alcohol':['Alcoholyou','Alcoholic drinks','Beer','Wine','Liquor'],
 'Wi-Fi':['Wifi','Internet','In-flight Wi-Fi','Onboard internet'],
 'Carry-on bag':['Carry on','Carry-on','Cabin bag','Hand baggage','Hand luggage'],
 'Checked bag':['Checked baggage','Checked luggage','Check in bag','Hold luggage'],
 'Seat selection':['Seat choice','Choosing a seat','Choose seats'],
 'Extra legroom':['Legroom','Extra leg room','Leg room'],
 'Meals':['Meal','Food','In-flight meals'],
 'Snacks':['Snack'],
 'Drinks':['Drink','Beverages','Beverage'],
 'Bike':['Bicycle'],
 'Duty-free':['Duty free shopping','Duty free goods'],
 'Meet and assist':['Meet & assist','Meet and greet'],
 'Hands Free (easyJet)':['Hands Free','Easyjet hands free'],
 'DOT regulation fee':['DOT fee'],
 'EU261 levy':['EU261 fee'],
 'SMS confirmation':['Text confirmation','SMS notification'],
 'Travel SIM card':['SIM card','Travel SIM'],
 'Boarding pass printing':['Printed boarding pass','Boarding pass printing fee'],
 'Power outlet':['Power socket','Charging outlet'],
 'Pet in cabin':['Cabin pet','Pet carry on'],
 'Pet in hold':['Hold pet','Pet in cargo'],
 'Musical instrument':['Instrument'],
 'Surfboard':['Surf board'],
 'Golf clubs':['Golf bag'],
 'Lounge access':['Airport lounge','Lounge'],
 'Sports equipment':['Sporting equipment'],
 'Unaccompanied minor':['Unaccompanied child','Child traveling alone'],
};
export const AIRLINE_PACK={id:'airline-extras',topic:'AIRLINE EXTRAS',prompt:'Name an extra that airlines charge for.',source:'User-supplied reference answer bank',answers:Object.entries(groups).flatMap(([points,lines])=>lines.split('\n').map(label=>({label,points:Number(points),aliases:aliases[label]??[],...(Number(points)===100?{quip:'Qatar Airways lets passengers buy cabin space for their falcons.'}:{})})))};

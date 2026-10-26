#!/usr/bin/env python3
"""Reconcile named foods with the finite fetched inventories, without inventing tails."""
import collections,gzip,json,pathlib,re,sys,unicodedata
from authored_food_repairs import apply_food_repairs
ROOT=pathlib.Path(__file__).resolve().parents[1]
source=json.load(gzip.open(ROOT/'data-snapshots/authored/sources/food-name-lists.json.gz'))
target=ROOT/'data-snapshots/authored/batches/07-food-variety.json'
batch=json.load(open(target));byid={q['concept']:q for q in batch['questions']}
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
fix={
 'cookies':{
 'Ballokume (from Turkish bal-lokum )':'Ballokume',
 'Basler Läckerli Leckerli, Läggerli':'Basler Läckerli~Basler Leckerli~Laggerli',
 'Biscuit roll egg roll (鸡蛋卷), love letters, kueh belandah, crispy biscuit roll, crisp biscuit roll or cookie roll':'Biscuit roll~Egg roll biscuit~Love letters~Kueh belandah~Cookie roll',
 'Bizcochito biscochito':'Bizcochito~Biscochito',
 'Black and white cookie Half-Moon cookie':'Black and white cookie~Half-moon cookie',
 'Boortsog boorsoq , or bawyrsak':'Boortsog~Boorsoq~Bawyrsak',
 'Bourbon biscuit Bourbon cream or Bourbon':'Bourbon biscuit~Bourbon cream~Bourbon',
 'Bredela Bredele, Bredle or Winachtsbredele':'Bredela~Bredele~Bredle~Winachtsbredele',
 "Caramel shortbread Millionaire's Shortbread":"Caramel shortbread~Millionaire's shortbread",
 "Cat's tongue cookie ( langues de chat , kue lidah kucing, lengua de gato )":"Cat's tongue cookie~Langues de chat~Kue lidah kucing~Lengua de gato",
 'Chocolate-coated marshmallow treats Chocolate Teacake':'Chocolate teacake~Chocolate-coated marshmallow treat',
 'Cuchuflís or Cubanitos':'Cuchufli~Cubanito',
 'Fig bar / Fig roll':'Fig bar~Fig roll',
 'Flour kurabiye ( Un kurabiyesi )':'Flour kurabiye~Un kurabiyesi',
 'Galletas de bato (Rosquillos)':'Galletas de bato~Rosquillos',
 'Ginger snaps':'Gingersnap~Ginger snaps~Ginger nut~Gingernut',
 'Jammie Dodgers':'Jammie Dodger~Jammie Dodgers',
 'Ladyfingers':'Ladyfinger~Ladyfingers~Savoiardi~Boudoir biscuit',
 "Ma'amoul":'Maamoul',
 'Malted milk (biscuit)':'Malted milk biscuit~Malted milk',
 'Oatmeal raisin':'Oatmeal raisin cookie~Oatmeal raisin',
 'Pepernoot':'Pepernoot~Pepernoten',
 'Pignolo':'Pignolo~Pignoli cookie',
 'Polvorón':'Polvoron~Polvorones',
 'Puto seco':'Puto seco~Puto seko',
 'Rosca or biscocho de rosca':'Rosca~Biscocho de rosca',
 'Russian tea cake':'Russian tea cake~Snowball cookie~Mexican wedding cookie',
 'Sandie':'Sandie~Sandies',
 'Sablé':'Sablé~Sable biscuit',
 'Spritzgebäck':'Spritzgebäck~Spritz cookie',
 'Zaleti':'Zaleti~Zaletti',
 'Kaasstengels':'Kaasstengels~Kastengel',
 'Shortbread':'Shortbread~Shortbread cookie',
 'Chocolate chip cookie':'Chocolate chip cookie~Chocolate chip',
 'Peanut butter cookie':'Peanut butter cookie~Peanut butter cookies',
 'Oat crisps':'Oat crisps~Havreflarn',
 },
 'pies':{
 'Australian and New Zealand meat pie':'Australian meat pie~New Zealand meat pie',
 'Bisteeya pastilla , etc.':'Pastilla~Bisteeya~Bastilla',
 'Chinese pie Pâté chinois':'Pâté chinois~Chinese pie',
 'Custard tart flans pâtissier':'Custard tart~Flan pâtissier',
 "Fish pie Fisherman's Pie":"Fish pie~Fisherman's pie",
 'Flan chino [ es ]':'Flan chino',
 'Öçpoçmaq Echpochmak':'Echpochmak~Öçpoçmaq',
 'Pirozhki pirozhok , piroshki':'Pirozhki~Pirozhok~Piroshki',
 'Samosa singara , sambusac, samsa':'Samosa~Singara~Sambusac~Samsa',
 'Sea-pie Cipaille':'Sea-pie~Cipaille',
 'Spanakopita spinach pie':'Spanakopita~Spinach pie',
 'Speķrauši pīrāgi or pīrādziņi':'Speķrauši~Pīrāgi~Pīrādziņi',
 'Sweet potato pie [ 22 ]':'Sweet potato pie',
 'Tiropita Greek cheese pie':'Tiropita~Greek cheese pie',
 'Tocinillo de cielo [ es ]':'Tocinillo de cielo~Tocino de cielo',
 'Wähe [ 27 ]':'Wähe', 'Woolton pie [ 28 ]':'Woolton pie',
 'Tourtière':'Tourtière~Tourtiere',
 'Sugar cream pie':'Sugar cream pie~Hoosier pie',
 'Mince pie':'Mince pie~Mincemeat pie',
 'Stargazy pie':'Stargazy pie~Stargazey pie',
 },
 'pastries':{
 'Cannoli siciliani':'Cannoli~Cannolo~Cannoli siciliani',
 'Choux à la crème':'Choux à la crème~Choux bun',
 'Fazuelos , Fijuelas, or Deblas':'Fazuelo~Fazuelos~Fijuela~Debla',
 "Ladies' navels":"Hanım göbeği~Hanim gobegi~Ladies' navels",
 'Öçpoçmaq':'Echpochmak~Öçpoçmaq',
 "Pa de pessic, bescuit, pa d'En Pou":"Pa de pessic~Bescuit~Pa d'En Pou",
 'Paris–Brest':'Paris-Brest',
 'Poffertjes ( Dutch ) Æbleskiver ( Danish )':'Poffertjes~Æbleskiver',
 'Pogača':'Pogaca~Pogača',
 'Profiterole':'Profiterole~Cream puff',
 'Savory spinach pie':'Spinach pie~Spanakopita',
 'Sfogliatelle':'Sfogliatella~Sfogliatelle',
 'Utap':'Otap~Utap',
 'Éclair':'Eclair~Éclair',
 'Kanafeh':'Kanafeh~Knafeh~Kunafa',
 'Punsch-roll':'Punsch-roll~Punschrulle~Dammsugare',
 'Börek':'Börek~Burek~Borek',
 'Plăcintă':'Placinta~Plăcintă',
 'Schaumrolle':'Schaumrolle',
 },
 'fermented':{
 'Nattō':'Natto~Nattō',
 'Stinky tofu ( chòu dòufu )':'Stinky tofu~Chou doufu',
 'Yellow soybean paste ( huáng jiàng )':'Yellow soybean paste~Huang jiang',
 'Murri (condiment)':'Murri',
 'Crème fraîche':'Crème fraîche~Creme fraiche',
 'Filmjölk':'Filmjölk~Filmjolk',
 'Matzoon':'Matzoon~Matsoni',
 'Smetana , Smântână':'Smetana~Smantana~Smântână',
 'Dosa (food)':'Dosa',
 'Koko (millet porridge)':'Koko~Millet porridge fermented',
 'Masi, mahi':'Masi~Mahi fermented breadfruit',
 'Pickles [ 12 ]':'Fermented pickles~Fermented cucumber~Pickled cucumber',
 'Portuguese ground red pepper (Pimenta Moida) a.k.a. Massa de pimentão':'Massa de pimentão~Pimenta moida',
 'Tianjin preserved vegetable (tung tsai)':'Tianjin preserved vegetable~Tung tsai',
 'Cod liver oil (Traditional preparation method)':'Fermented cod liver oil',
 'Hákarl':'Hakarl~Hákarl',
 "Ni'owuru":"Ni'owuru",
 'Shrimp paste (Belacan)':'Shrimp paste~Belacan',
 'Taba ng Talangka , aligi':'Taba ng talangka~Aligi',
 'Borș (bran)':'Bors~Borș',
 'Kanji (drink)':'Kanji',
 'Kumis':'Kumis~Kumys~Koumiss',
 'Tibicos (water kefir)':'Tibicos~Water kefir',
 'Žinčica':'Zincica~Žinčica',
 'Tungrymbai':'Tungrymbai~Tungrumbai',
 'Sumbala':'Soumbala~Sumbala~Dawadawa',
 'Fermented bean curd':'Fermented bean curd~Sufu~Furu~Fermented tofu',
 'Tapai':'Tapai~Tape',
 'Garri':'Garri~Gari',
 'Suan cai':'Suan cai~Suancai~Suan tsai',
 'Hongeohoe':'Hongeohoe~Hongeo-hoe',
 'Kombucha':'Kombucha~Kombucha tea',
 'Yogurt':'Yogurt~Yoghurt',
 'Kefir':'Kefir~Milk kefir',
 }
}
extras={
 'cookie-biscuit-types':{
 '10':'Oreo~Oreos|Snickerdoodle|Sugar cookie|Chocolate chip cookie~Chocolate chip|Peanut butter cookie~Peanut butter cookies|Shortbread~Shortbread cookie|Gingerbread|Oatmeal cookie|Gingersnap~Ginger snaps~Ginger nut~Gingernut',
 '30':'Biscoff~Lotus Biscoff|Chips Ahoy!|Milano|Nutter Butter|Chocolate digestive|Chocolate Hobnob|Hobnob~Hobnobs|Tim Tam|Penguin biscuit|Club biscuit|Nilla wafer~Vanilla wafer|Fig Newton~Newtons|Jaffa cake|Thin Mints|Samoas~Caramel deLites|Tagalongs~Peanut Butter Patties|Do-si-dos~Peanut Butter Sandwiches|Trefoils|Toll House cookie|White chocolate macadamia cookie|Chocolate crinkle~Crinkle cookie',
 '60':'Adventurefuls|Lemon-Ups|Lemonades|Toffee-tastic|Famous Amos|Keebler Fudge Stripes~Fudge Stripes|Lorna Doone|Teddy Grahams|Hello Panda|Koala\'s March|Pocky|Pepero|Viennese whirl|Benne wafer|Rum ball|Chocolate-coated marshmallow treat~Chocolate teacake|Peanut butter blossom cookie|Kourabiedes|Macaron|Macaroon',
 '85':'Hallongrotta~Hallongrottor|Drömmar~Drommar|Brunkager|Vanillekranse|Pfeffernusse|Baci di dama|Ricciarelli|Pizzelle',
 '100':'Ghoriba bahla'},
 'named-pies':{
 '10':'Apple pie|Pumpkin pie|Pecan pie|Cherry pie|Blueberry pie|Chicken pot pie~Chicken pie|Shepherd\'s pie~Shepherds pie|Key lime pie',
 '30':'Lemon meringue pie|Banoffee pie|Cottage pie|Steak and kidney pie|Pork pie|Fish pie~Fisherman\'s pie|Mince pie~Mincemeat pie|Peach pie|Strawberry pie|Rhubarb pie|Sweet potato pie|Coconut cream pie|Banana cream pie|Chocolate cream pie|Custard pie|Chess pie|Meat pie|Tourtière~Tourtiere|Quiche|Pot pie|Tart|Flan|Fruit tart|Lemon tart|Chocolate tart|Apple tart|Bakewell tart|Treacle tart',
 '60':'Chicken and mushroom pie|Chicken and leek pie|Steak and ale pie|Steak pie|Corned beef pie|Bacon and egg pie|Game pie|Venison pie|Rabbit pie|Mutton pie|Scotch pie|Fidget pie|Stargazy pie~Stargazey pie|Homity pie|Cumberland pie|Rappie pie|Salmon pie|Tuna pie|Clam pie|Oyster pie|Cheese and onion pie|Spinach and feta pie|Spanakopita~Spinach pie|Tiropita~Greek cheese pie|Burek|Pastilla~Bisteeya~Bastilla|Coulibiac~Kulebyaka|Pirog|Kurnik|Cornish pasty|Hand pie|Turnover|Fried pie|Shoofly pie|Buttermilk pie|Vinegar pie|Raisin pie|Saskatoon berry pie|Huckleberry pie|Blackberry pie|Loganberry pie|Boysenberry pie|Mixed berry pie|Strawberry rhubarb pie|Gooseberry pie|Cranberry pie|Apricot pie|Plum pie|Pear pie|Grape pie|Pineapple pie|Mango pie|Passion fruit pie|Peanut butter pie|Grasshopper pie|Mississippi mud pie|French silk pie|Chocolate chess pie|Lemon chess pie|Derby pie|Fudge pie|Brownie pie|Ice cream pie|Millionaire pie|Hula pie|Flapper pie|Green tomato pie|Mock apple pie|Frito pie|Tamale pie|Spaghetti pie|Peanut pie|Walnut pie|Maple pie|Maple sugar pie~Tarte au sucre|Butter pie|Butter tart|Egg custard pie|Manchester tart|Gypsy tart|Ecclefechan tart|Dutch apple pie|Apple slab pie|Deep-dish pie|Double-crust pie|Lattice pie|Chiffon pie|Lemon chiffon pie|Chocolate chiffon pie|Coconut custard pie|Impossible pie|Lemon icebox pie~Lemon ice box pie|Tomato tart|Onion tart|Pecan tart|Raspberry tart|Strawberry tart|Fruit flan',
 '85':'Marlborough pie|Atlantic Beach pie|Shaker lemon pie|Jefferson Davis pie|Bean pie|Bedfordshire clanger|Devon squab pie|Pithivier|Flamiche|Tarte Tatin|Torta pasqualina|Erbazzone|Soparnik|Torta della nonna|Vlaai|Buko pie|Egg pie|Queijada|Karelian pasty~Karelian pasties~Karjalanpiirakka|Kalakukko|Echpochmak~Öçpoçmaq|Zwiebelkuchen|Zelnik|Banitsa|Galatopita|Plăcintă~Placinta|Osterchüechli|Sour cream raisin pie|Concord grape pie|Guapple pie|Bumbleberry pie|Black bottom pie',
 '100':'Aloo pie'},
 'breakfast-cereal-products':{
 '10':'Cheerios|Froot Loops~Fruit Loops|Frosted Flakes~Frosties|Rice Krispies~Rice Bubbles|Cinnamon Toast Crunch|Lucky Charms|Cocoa Puffs|Corn Flakes~Cornflakes|Raisin Bran|Weetabix',
 '30':'Honey Nut Cheerios|Chex|Trix|Cookie Crisp|Cap\'n Crunch~Captain Crunch|Cap\'n Crunch Crunch Berries~Crunch Berries|Golden Grahams|Reese\'s Puffs|Apple Jacks|Special K|Shredded Wheat|Frosted Mini-Wheats~Mini Wheats|Honey Smacks~Sugar Smacks|Golden Crisp~Sugar Crisp|Honeycomb|Grape-Nuts|Fruity Pebbles|Cocoa Pebbles|Honey Bunches of Oats|Wheaties|Life|All-Bran|Shreddies|Coco Pops~Cocoa Krispies|Krave|Alpen|Quaker Oats|Ready Brek|Oatibix',
 '60':'Carmella Creeper|Monster Mash|Magic Spoon|Three Wishes|Catalina Crunch|Premier Protein cereal|Wonderworks|Seven Sundays|Surreal cereal|OffLimits|Weet-Bix|Milo cereal|Nesquik cereal|Chocapic|Chocos|Coco Roos|EnviroKidz|Gorilla Munch|Koala Crisp|Panda Puffs|Leapin\' Lemurs|Barbara\'s Puffins~Puffins cereal|Kashi GO~Kashi GoLean|Kashi Heart to Heart|Kashi Cinnamon Harvest|Kashi Island Vanilla|Kashi Autumn Wheat|Cascadian Farm cereal|Nature\'s Path cereal|Post cereal|Kellogg\'s cereal|General Mills cereal|Cream of Wheat|Cream of Rice|Maypo|Wheatena|Malt-O-Meal|CoCo Wheats|Shredded Ralston|Mornflake|Dorset Cereals|Jordans Country Crisp|Lizi\'s Granola|Bokomo ProNutro|Futurelife Smart Food|Jungle Oats|Morvite|Cerelac|Nestum',
 '85':'Quisp|Quake|King Vitaman|Mr. T cereal|C-3PO\'s|Nintendo Cereal System|Pac-Man cereal|Flutie Flakes|Urkel-Os|Waffelos|Freakies|Oreo Puffs|Oreo O\'s',
 '100':'Granula'},
 'fermentation-foods':{
 '10':'Yogurt~Yoghurt|Cheese|Bread|Beer|Wine|Kimchi|Sauerkraut|Kombucha~Kombucha tea|Soy sauce|Vinegar',
 '30':'Sourdough|Kefir~Milk kefir|Miso|Tempeh|Natto~Nattō|Sake|Cider|Mead|Kvass|Buttermilk|Sour cream|Crème fraîche~Creme fraiche|Lassi|Ayran|Kumis~Kumys~Koumiss|Lambic|Ale|Lager|Stout|Porter|Fish sauce|Tabasco sauce|Worcestershire sauce|Dosa|Idli|Injera|Salami|Pepperoni|Chorizo|Fermented pickles~Fermented cucumber~Pickled cucumber',
 '60':'Cheddar|Parmesan~Parmigiano Reggiano|Mozzarella|Brie|Camembert|Gouda|Roquefort|Stilton|Gorgonzola|Blue cheese|Feta|Emmental|Gruyere|Swiss cheese|Edam|Monterey Jack|Colby|Provolone|Manchego|Pecorino|Asiago|Taleggio|Limburger cheese|Havarti|Jarlsberg|Cottage cheese|Quark|Skyr|Labneh|Filmjölk~Filmjolk|Viili|Ryazhenka|Clabber|Dahi|Doogh|Shubat|Airag|Matzoon~Matsoni|Tarhana|Kashk|Boza|Tepache|Pulque|Chicha|Chicha de jora|Pozol|Tesguino|Palm wine|Toddy|Tuba|Arrack|Arak|Baijiu|Soju|Shochu|Awamori|Makgeolli|Huangjiu|Shaoxing wine|Mirin|Amazake|Koji|Shio koji|Doubanjiang|Douchi|Tianmianjiang|Gochujang|Doenjang|Cheonggukjang|Ssamjang|Tauco|Fermented bean curd~Sufu~Furu~Fermented tofu|Stinky tofu~Chou doufu|Meju|Kinema|Akhuni~Axone|Tungrymbai~Tungrumbai|Oncom|Tapai~Tape|Tapuy|Brem|Basi|Appam|Paniyaram|Uttapam|Dhokla|Khaman|Kisra|Lahoh|Jalebi|Sourdough pancake|Panettone|Pandoro|Brioche|Baguette|Bagel|Croissant|Pizza dough|Yeast doughnut|Baozi~Bao bun|Mantou|Pita|Naan|Babka|Borodinsky bread|Ogi|Uji|Mageu|Kenkey|Banku|Fufu|Garri~Gari|Attieke|Chikwangue|Bobolo|Iru|Ogiri|Soumbala~Sumbala~Dawadawa|Ugba|Pu-erh|Lahpet|Miang|Dark tea~Hei cha|Hakarl~Hákarl|Surstromming|Rakfisk|Fesikh|Kiviak|Igunaq|Hongeohoe~Hongeo-hoe|Pla ra|Padaek|Budu|Bagoong|Bagoong alamang|Bagoong isda|Patis|Mam nem|Nuoc mam|Ngapi|Shrimp paste~Belacan|Terasi~Trassi|Kapi|Jeotgal|Myeolchijeot|Saeujeot|Sikhae|Narezushi|Funazushi|Heshiko|Kusaya|Shottsuru|Ishiru|Pekasam|Nham|Nem chua|Som moo|Sai krok Isan|Sucuk~Sujuk|Summer sausage|Landjaeger|Mettwurst|Teewurst|Soppressata|Saucisson sec|Fuet|Chouriço|Finocchiona|Cacciatore salami|Fermented hot sauce|Sriracha|Douzhi|Suan cai~Suancai~Suan tsai|Paocai|Dongchimi|Kkakdugi|Baechu kimchi|Oi sobagi|Gat kimchi|Bossam kimchi|Nabak kimchi|Nukazuke|Takuan|Shibazuke|Suguki|Sunki|Red yeast rice~Angkak~Hongqu|Coffee|Cocoa|Chocolate|Vanilla beans|Whisky~Whiskey|Vodka|Rum|Gin|Tequila|Brandy|Cognac|Armagnac|Calvados|Pisco|Grappa|Rakia|Slivovitz|Kirsch|Absinthe|Aquavit|Ouzo|Poitín~Poitin|Raki|Chacha|Mezcal|Cachaça~Cachaca|Aguardiente|Sotol|Raicilla|Charanda|Bacanora|Vermouth|Port|Sherry|Madeira|Marsala|Champagne|Prosecco|Cava|Red wine|White wine|Rose wine|Orange wine|Rice wine|Fruit wine|Water kefir~Tibicos|Jun tea|Apple cider vinegar|Wine vinegar|Rice vinegar|Malt vinegar|Balsamic vinegar|Coconut vinegar|Cane vinegar|Black vinegar|Shanxi mature vinegar|Kurozu',
 '85':'Bikalga|Bambangan|Bosou|Burong isda|Burong mangga|Burong hipon|Hentak|Kanji|Ntoba mbodi|Pito|Pombe|Sauruben|Tella|Tejuino|Salgham~Şalgam|Burukutu|Gundruk|Sinki|Tempoyak|Meigan cai|Nata de coco|Nata de piña|Kawal|Dayok|Garum|Pon ye gyi',
 '100':'Yongfeng chili sauce'},
 'pastry-types':{
 '10':'Croissant|Danish pastry~Danish|Eclair~Éclair|Profiterole~Cream puff|Cinnamon roll~Cinnamon bun|Baklava|Pie|Tart|Turnover|Puff pastry',
 '30':'Pain au chocolat~Chocolate croissant|Pain aux raisins|Palmier|Mille-feuille~Mille feuille~Napoleon|Choux pastry|Shortcrust pastry|Filo pastry~Phyllo pastry~Phyllo|Strudel|Apple strudel~Apfelstrudel|Sausage roll|Pasty|Cornish pasty|Empanada|Samosa|Calzone|Cannoli~Cannolo~Cannoli siciliani|Sfogliatella~Sfogliatelle|Pastel de nata|Egg tart|Bakewell tart|Treacle tart|Jam tart|Fruit tart|Custard tart|Lemon tart|Quiche|Spinach pie~Spanakopita|Börek~Burek~Borek|Tiropita|Pithivier|Vol-au-vent|Bouchée|Choux à la crème~Choux bun|Paris-Brest|Saint-Honore~St Honore|Religieuse|Chouquette|Gougère~Gougere|Galette|Galette des rois|Cheese straw|Cheese twist|Cheese danish|Apple turnover|Cream horn|Krempita|Vanilla slice~Custard slice|Cremeschnitte|Kremna rezina',
 '60':'Cruffin|Cronut|Kouign-amann|Chausson aux pommes|Jésuite~Jesuite|Puits d\'amour|Oranais|Brioche feuilletée|Escargot pastry|Sacristain|Torsade au chocolat|Amandine tart|Bourdaloue tart|Tarte Tatin|Tartelette|Tarte aux fraises|Tarte aux pommes|Tarte au citron|Tarte au chocolat|Flan parisien~Flan pâtissier|Feuilleté~Feuillete|Croquembouche|Dartois|Croustade|Pastis gascon|Bichon au citron|Bear claw~Patte d\'ours|Kringle|Kanelsnegl|Tebirkes|Frøsnapper|Spandauer|Hindbærsnitte|Napoleonshat|Napoleonskage|Kartoffelkage|Træstamme|Studenterbrød|Kanelstang|Kanelbulle|Wienerbröd|Kardemummabulle|Punsch-roll~Punschrulle~Dammsugare|Mazarin|Joulutorttu|Korvapuusti|Karelian pasty|Lihapiirakka|Kalakukko|Vatrushka|Pirozhki|Pirog|Kurnik|Kulebyaka|Sloyka|Sochnik|Rugelach|Knish|Bourekas~Borekas|Boyoz|Bulema|Su böreği|Kol böreği|Sigara böreği|Gül böreği|Çiğ börek~Çibörek|Paçanga böreği|Saray böreği|Tepsi böreği|Kürt böreği|Talaş böreği|Laz böreği|Sirnica|Zeljanica|Krompirusa|Tikvenik|Zelnik|Gibanica|Prekmurska gibanica|Banitsa|Bougatsa|Galaktoboureko|Kataifi~Kadaif|Kanafeh~Knafeh~Kunafa|Şöbiyet|Tulumba|Lokma|Hanım göbeği~Hanim gobegi~Ladies\' navels|Dilber dudağı|Bülbül yuvası|Burma baklava|Havuç dilimi|Sütlü nuriye|Midye baklava|Fıstık dolama|Katmer|Kete|Qottab|Baghlava|Nan panjereh|Shirini zaban|Shirini danmarki|Nan khamei|Maamoul|Kleicha|Warbat|Shaabiyat|Sambousek|Sambusa|Sambouseh|Fatayer|Briouat|Mhancha|Kaab el ghazal~Cornes de gazelle|Makroud|Samsa|Brik|Pastilla~Bastilla|Kue sus~Kue soes|Kue pastel|Curry puff~Karipap|Epok-epok|Gujiya~Gujia|Karanji|Ghughra|Nevri|Pedakiya|Chandrakala|Suryakala|Lavang latika~Labang latika|Chiroti|Khaja|Khajla|Balushahi~Badusha|Mawa kachori|Kachori|Lukhmi|Khapse~Khabse|Sha phaley~Shabalay|Veg puff|Egg puff|Chicken puff|Beef puff|Paneer puff|Cream roll|Dilpasand|Dilkush|Khari|Khari biscuit|Butter khari|Jeera khari|Sausage plait|Salmon en croûte~Salmon en croute|Beef Wellington|Pâté en croûte~Pate en croute|Steak bake|Cheese and onion pasty|Chicken bake|Jamaican patty|Haitian patty~Pâté haïtien~Pate haitien|Pate kode|Empanadilla|Empada|Empadinha|Pastel de feira|Pastel de Belém~Pastéis de Belém|Pastel de Tentugal|Pastel de Santa Clara|Pastel de Vouzela|Travesseiro de Sintra|Queijada de Sintra|Folhado|Mil folhas|Jesuita portugues|Pastel de feijao|Pastel de Lorvão|Pampilho|Palmier recheado|Cornucópia|Sfogliatella riccia|Sfogliatella frolla|Coda d\'aragosta~Lobster tail pastry|Torta diplomatica~Diplomatica|Millefoglie|Cannoncino~Cannoncini|Bocconotto|Pasticciotto|Genovese ericina|Cartellate|Chiacchiere~Frappe~Crostoli~Galani~Bugie~Sfrappole~Cenci|Pignolata|Struffoli|Cicerchiata|Rustico leccese|Pidone~Pitoni|Scaccia ragusana|Scacciata catanese|Impanata|Cassatedda~Cassatella|Cassatella di Agira|Iris pastry|Zeppola~Zeppole|Bignè~Bigne|Tortelli dolci|Ravioli dolci|Seada~Seadas~Sebadas|Pardula~Pardulas|Pastizz~Pastizzi|Qassatat|Mqaret~Imqaret|Kannoli|Qagħaq tal-għasel~Qaghaq tal-ghasel|Catalan xuixo~Xuixo~Xuxo|Ensaimada~Ensaïmada|Napolitana de chocolate|Napolitana de crema|Palmera|Miguelito~Miguelitos|Hojaldre|Hojaldra|Hojaldrina|Pestiño~Pestiños|Casadiella~Casadielles|Pantxineta~Panchineta|Carolina pastry|Canutillo~Canutillos|Bayonesa~Bayonesas|Trenza de Almudévar|Costrada de Alcalá|Rosquilla de hojaldre|Coca de llardons|Coca de crema|Coca de Sant Joan|Coca de recapte|Coca de trempó|Cocarroi~Cocarrois|Panada~Panades|Robiol~Robiols~Rubiol~Rubiols|Formatjada~Formatjades|Flaó~Flao|Pastisset~Pastissets|Cachito~Cachitos|Medialuna|Factura argentina~Factura|Cañoncito~Canoncito|Librito|Cremona|Bizcocho uruguayo|Bizcocho de grasa|Bizcocho de queso',
 '85':'Carac|Nazook|Lek-tau-phong|Leipziger Lerche|Komaj sehen|Kolompeh|Mandryky|Naiyou subing|Masan|Torpil|Taro pastry|Suncake|Schaumrolle|Chatti Pathiri|Gâteau Basque|Pineapple cake|Rustico|Croline|Cornulețe|Banket|Birnbrot|Heong Peng|Flies graveyard|Banketstaaf',
 '100':'Communist bandit pastry'}
}
specs=[('cookie-biscuit-types','List_of_cookies','cookies'),('named-pies','List_of_pies,_tarts_and_flans','pies'),('pastry-types','List_of_pastries','pastries'),('breakfast-cereal-products','List_of_breakfast_cereals','cereals'),('fermentation-foods','List_of_fermented_foods','fermented')]
held=[]
# Source pages sometimes include adjacent food families. Hold those rather than
# making a cake into pastry, or treating fresh pickles as fermented by default.
skip={
 'cookies':{'Biscuit','Charcoal biscuit'},
 'pies':{'Cheesecake','Cobbler','Bündner Nusstorte','Bundevara','Hjónabandssæla','Kuchen','Tarta de Santiago','Watalappam','Whoopie pie','Tarta capuchina','Tocinillo de cielo [ es ]'},
 'pastries':{'Sacher Torte','Pannenkoek','Paper wrapped cake',"Pa de pessic, bescuit, pa d'En Pou",'Pan dulce','Papanași','Poffertjes ( Dutch ) Æbleskiver ( Danish )','Roti john','Roti tissue','Roze koek',"Runeberg's torte",'Sfenj','Sfințișori','Stutenkerl','Sufganiyah','Taiyaki','Tortita negra','Trdelník','Vetkoek','Zeeuwse bolus','Zlabia','Pizzelle','Komaj sehen','Bizcocho','Gustavus Adolphus pastry'},
 'fermented':{'lulu jardin','Felij','Kaymak','Atchara','Chinese pickles','Pickles [ 12 ]','Tsukemono','Sour cabbage','Cod liver oil (Traditional preparation method)','Shark meat','Gejang','Taba ng Talangka , aligi','Fermented milk products'},
 'cereals':set()
}
for key,page,kind in specs:
 q=byid[key];rows=[]
 if key=='named-pies':
  q['prompt']='Name a pie, tart or flan.'
  q['scope']='Named sweet and savory pies, tarts and flans count, including established dishes called pies with mash or crumb toppings. A food that is only a cake, cookie or pizza does not qualify simply because a broad food list mentions it.'
 for t,items in extras[key].items():
  for item in items.split('|')if isinstance(items,str)else items:
   name,*als=item.split('~');rows.append({'label':name,'aliases':als,'points':int(t),'evidence':'explicit familiar or traditional-food supplement'})
 for original in source['pages'][page]['names']:
  if original in skip[kind]:held.append({'question':key,'name':original,'reason':'Source category is broader or eligibility is uncertain'});continue
  cleaned=fix.get(kind,{}).get(original,original)
  if kind=='cereals':
   cleaned=re.split(r'\s+[–—]\s+|\s+-\s+|\s*\(',cleaned,1)[0].strip().rstrip(' .')
   cleaned=re.sub(r'\s*\[.*?\]','',cleaned)
   if len(cleaned)>85 or re.search(r'\b(?:Kellogg|Nabisco|General Mills|Malt-O-Meal|Harvest Morn|Post Cereals)\b',cleaned) and len(cleaned.split())>6:
    held.append({'question':key,'name':original[:180],'reason':'Flattened source list needs a manual label split'});continue
   if cleaned in ['Post','Kellogg\'s','Kellogg\'s 2026','General Mills','Tesco','Nabisco','Kelloggs','Barbara\'s Bakery','Quaker Oats','Harvest Morn','Crownfield']:
    # Brand names are permitted, but adding their actual cereal use avoids
    # silently accepting unrelated products sold by a supermarket.
    if cleaned in ['Tesco','Nabisco','Harvest Morn','Crownfield']:continue
   if cleaned in ["Porridge Flahavan's Progress Oatlets Kavanagh's Porridge",'Curves Fruit & Nut Crunch Curves Honey Crunch']:
    held.append({'question':key,'name':original,'reason':'Flattened parent list joins several different cereal products; the separate actual names are retained independently.'});continue
   for old,new in [('Total Cinnamon Crunch Total Corn','Total Cinnamon Crunch'),('Cracklin\' Oat Bran Kellogg\'s',"Cracklin' Oat Bran"),('Wheat Honeys Nabisco','Wheat Honeys'),('Bart Simpson \'s',"Bart Simpson's"),('Banana Nut Crunch - Post, Great Grains','Banana Nut Crunch'),('Cinnamon Grahams','Cinnamon Grahams~Curiously Cinnamon'),('Sugar Puffs','Sugar Puffs~Honey Monster Puffs')]:
    if cleaned==old:cleaned=new
  name,*als=cleaned.split('~')
  if not norm(name)or name=='Continent (or comparable)':continue
  rows.append({'label':name,'aliases':als,'points':85,'evidence':page})
 # Prefer deliberately supplied canonical identities and merge rows only if
 # an explicit name/alias identifies the same food. Never fuzzy-merge foods.
 groups=[];owners={}
 for row in rows:
  names=[row['label'],*row['aliases']];keys={norm(a)for a in names}
  found={owners[k]for k in keys if k in owners}
  if found:
   owner=min(found)
   if len(found)>1:
    held.append({'question':key,'name':row['label'],'reason':'Source synonyms bridge two distinct reviewed identities'});continue
   g=groups[owner]
   # A source row has unknown editorial familiarity; it must not erase a
   # deliberately reviewed common or rare tier assigned to the same food.
   if row['evidence']!=page:g['points']=min(g['points'],row['points'])
   g['aliases'].update(names)
  else:owner=len(groups);groups.append({'label':row['label'],'aliases':set(row['aliases']),'points':row['points']});g=groups[owner]
  for k in keys:owners[k]=owner
 tiers=collections.defaultdict(list)
 for g in groups:
  aliases=sorted(a for a in g['aliases']if norm(a)!=norm(g['label']))
  tiers[str(g['points'])].append({'label':g['label'],'aliases':aliases})
 q['answers']=dict(tiers)
 q['references']=list(dict.fromkeys(q['references']+[source['pages'][page]['url']]))
 q['answerSource']='Whole factual source inventory reconciled with named familiar additions; unresolved source-label and eligibility issues are held in a separate ledger.'
apply_food_repairs(batch['questions'])
out=json.dumps(batch,ensure_ascii=False,indent=2)+'\n'
if '--check'in sys.argv:assert target.read_text()==out,'Rebuild food inventories'
else:target.write_text(out)
hp=ROOT/'data-snapshots/authored/food-source-holds.json';ht=json.dumps(held,ensure_ascii=False,indent=2)+'\n'
if '--check'in sys.argv:assert hp.read_text()==ht,'Refresh food-source holds'
else:hp.write_text(ht)
print([(q['concept'],sum(len(x.split('|'))if isinstance(x,str)else len(x)for x in q['answers'].values()))for q in batch['questions']])
print(len(held),'source entries held for eligibility or label repair')

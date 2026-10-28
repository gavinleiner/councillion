#!/usr/bin/env python3
# Rebuild from the pinned released-game factual snapshot; no network needed.
import json,gzip,tarfile,pathlib,collections,re,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
snapshot=json.load(gzip.open(root/'data-snapshots/authored/sources/minecraft-26.3-facts.json.gz'))
raw=snapshot['definitions'];components={k:{'minecraft:cooking_fuel':{}}for k in snapshot['cookingFuelItems']}
used={};data_ref='https://github.com/misode/mcmeta/tree/5f312935898c8f75f64d185b9874b129d0c67287/data/minecraft';component_ref='https://github.com/misode/mcmeta/tree/d96c75fec200c4580dd75e033a76341521165461/item_components'
def source(path):used[path]=raw[path];return raw[path]
def tag(kind,key):
 result=set()
 for value in source('tags/'+kind+'/'+key+'.json')['values']:
  if isinstance(value,dict):value=value['id']
  if value.startswith('#'):result.update(tag(kind,value.split(':',1)[1]))
  else:result.add(value.removeprefix('minecraft:'))
 return result
def name(k):return snapshot['labels'][k]
def resultkeys(node):
 result=set()
 if isinstance(node,dict):
  if node.get('type')=='minecraft:item':
   key=node['name'].removeprefix('minecraft:');mods=node.get('modifier',[]);mods=mods if isinstance(mods,list)else[mods]
   if key=='book'and any(m.get('type')=='minecraft:enchant_with_levels'for m in mods):key='enchanted_book'
   if key=='potion'and any(m.get('type')=='minecraft:set_potion'and m.get('id')=='minecraft:water'for m in mods):key='water_potion'
   result.add(key)
  for v in node.values():result.update(resultkeys(v))
 elif isinstance(node,list):
  for v in node:result.update(resultkeys(v))
 return result
qs=[]
def add(key,topic,prompt,scope,keys,familiar,wrong,rare,common=(),aliases=None,refs=()):
 alias=aliases or {};rows=collections.defaultdict(list);fs=set(familiar.split('|'));cs=set(common)
 names={name(k)for k in keys}
 assert rare in names,(key,rare)
 # Familiar spellings can be aliases (Cod -> Raw Cod, Cooked Beef -> Steak).
 # They must retain the common tier of their actual canonical item.
 folded={re.sub('[^a-z0-9]','',a.lower())for a in fs|cs}
 easy={label for label in names if any(re.sub('[^a-z0-9]','',a.lower())in folded for a in [label,*alias.get(label,[])])}
 for label in sorted(names):
  tier=100 if label==rare else 10 if label in easy else 30 if label in ['Stick','Bowl','Oak Planks','Glass','Torchflower','Oxeye Daisy','Lily of the Valley','Anvil','TNT','Gravel','Dirt','Sand','Red Sand','Cactus','Clay','Pumpkin','Melon','Bamboo','Wool','Sponge','Iron Ingot','Gold Ingot','Cooked Porkchop','Cooked Chicken','Cooked Salmon','Baked Potato','Stone','Brick','Cracked Stone Bricks','Smooth Stone','Smooth Sandstone','Smooth Quartz','Terracotta','Dried Kelp','Nether Brick'] else 60 if len(label)<25 else 85
  rows[str(tier)].append('~'.join([label,*alias.get(label,[])]))
 q=dict(id='authored-'+key,concept=key,family='gaming',topic=topic,prompt=prompt,scope=scope+' Official Java 26.3 recipe, tag or component data defines the inventory; modded behavior does not count.',format='game-mechanics',rationale='A distinct, recognizable Minecraft activity with a complete membership rule from released game data, not a Steam-label combination or colored-title template.',familiar=familiar.split('|'),exclude=wrong.split('|'),references=[data_ref,*refs],answers=dict(rows),naturalFinite=len(names)<24)
 assert all(n in names or any(n in a for a in alias.values())for n in fs),(key,fs-names)
 qs.append(q)
keys=tag('block','enderman_holdable')
add('enderman-carry-blocks','Hands off','Name a block an Enderman can pick up in Minecraft.',
 'The actual block-pickup rule counts, including flowers. Endermen may pick up only certain blocks even if the player can carry other blocks.',keys,
 'Dirt|Grass Block|Sand|Gravel|TNT|Cactus','Obsidian|Bedrock','Closed Eyeblossom',aliases={'TNT':['Tnt'],'Grass Block':['Grass'],'Poppy':['Red flower']})
keys=tag('item','flowers')
# The flower tag contains block forms of the same flower; their official
# names are merged before counting, rather than pretending states are species.
add('minecraft-flowers','Flower power','Name a flower or flowering block found in Minecraft.',
 'Flower items and blocks count, including tall flowers and Nether-compatible flowers. Named crops and saplings do not become flowers merely because they are plants.',keys,
 'Dandelion|Poppy|Blue Orchid|Sunflower|Rose Bush|Allium','Oak Sapling|Wheat','Torchflower',aliases={'Rose Bush':['Rose'],'Poppy':['Red flower'],'Oxeye Daisy':['Daisy']})
fishing=set()
for path in raw:
 if path.startswith('loot_table/gameplay/fishing/'):
  fishing.update(resultkeys(source(path)))
add('minecraft-fishing-catches','On the line','Name an item you can catch by fishing in Minecraft.',
 'Fish, junk and treasure in the ordinary fishing loot tables count. Items merely carried by nearby mobs do not.',fishing,
 'Cod|Salmon|Pufferfish|Tropical Fish|Bow|Saddle|Fish|Book','Diamond|Netherite Ingot','Lily Pad',aliases={'Raw Cod':['Cod','Fish','Raw Fish'],'Raw Salmon':['Salmon'],'Tropical Fish':['Clownfish'],'Fishing Rod':['Enchanted Fishing Rod'],'Bow':['Enchanted Bow'],'Enchanted Book':['Book']})
smelt=set()
for path,item in raw.items():
 if path.startswith('recipe/')and item.get('type')=='minecraft:smelting':
  source(path);r=item['result'];smelt.add((r['id']if isinstance(r,dict)else r).removeprefix('minecraft:'))
add('minecraft-furnace-results','Fresh from the furnace','Name an item or block a furnace recipe can produce in Minecraft.',
 'Give the output, rather than the input, of an ordinary furnace smelting or cooking recipe.',smelt,
 'Glass|Iron Ingot|Gold Ingot|Charcoal|Cooked Beef|Smooth Stone|Iron|Gold|Copper','Obsidian|Crafting Table','Cracked Nether Bricks',aliases={'Steak':['Cooked Beef'],'Iron Ingot':['Iron'],'Gold Ingot':['Gold'],'Copper Ingot':['Copper'],'Brick':['Bricks item'],'Nether Brick':['Nether Brick item']})
fuel={k for k,v in components.items()if 'minecraft:cooking_fuel'in v}
add('minecraft-furnace-fuel','Keep it burning','Name an item that can be used as furnace fuel in Minecraft.',
 'Items actually accepted in the fuel slot count, rather than anything that merely looks flammable. Their fuel value need not be the same.',fuel,
 'Coal|Charcoal|Lava Bucket|Stick|Blaze Rod|Dried Kelp Block|Wood|Sticks|Logs','Gunpowder|Netherrack','Mangrove Propagule',common=['Oak Planks','Bamboo','Oak Log','Chest','Crafting Table','Bowl','Ladder','Wooden Sword','Wooden Pickaxe','Wooden Axe'],aliases={'Lava Bucket':['Bucket of Lava'],'Oak Planks':['Planks','Wood Planks','Wooden Planks'],'Oak Log':['Log','Wooden Log','Wood','Logs'],'Stick':['Sticks']},refs=[component_ref])
axe=set()
def blocks_in_if(node):
 result=set()
 if isinstance(node,dict):
  if 'if_true'in node:
   test=node['if_true']
   if test.get('type')=='minecraft:matching_blocks':
    values=test['blocks'];values=[values]if isinstance(values,str)else values
    result.update(v.removeprefix('minecraft:')for v in values)
  for v in node.values():result.update(blocks_in_if(v))
 elif isinstance(node,list):
  for v in node:result.update(blocks_in_if(v))
 return result
axe=blocks_in_if(source('block_transformer/axe.json'))
add('minecraft-axe-transformations','Axe action','Name a Minecraft block you can strip, scrape or unwax by using an axe on it.',
 'This asks for the right-click/use action. Merely chopping or breaking a block does not qualify. Both stripping wood and removing copper oxidation or wax count.',axe,
 'Oak Log|Birch Log|Spruce Log|Jungle Log|Acacia Log|Waxed Copper Block','Stone|Glass','Waxed Oxidized Copper Grate',aliases={'Oak Log':['Oak'],'Birch Log':['Birch'],'Spruce Log':['Spruce'],'Waxed Block of Copper':['Waxed Copper Block']})
target=root/'data-snapshots/authored/batches/02-minecraft-mechanics.json'
text=json.dumps({'version':1,'questions':qs},ensure_ascii=False,indent=2)+'\n'
if '--check'in __import__('sys').argv:assert target.read_text()==text,'Regenerate the Minecraft factual batch'
else:target.write_text(text)
print(str(len(qs))+' released-data Minecraft inventories checked.')

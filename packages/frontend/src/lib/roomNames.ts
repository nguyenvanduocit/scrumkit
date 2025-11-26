// User names: funny adjective + animal (e.g., "Crazy Cat", "Grumpy Panda")
const userAdjectives = [
  // Sleepy/Tired
  'Sleepy', 'Drowsy', 'Snoozy', 'Yawning', 'Napping',
  // Grumpy/Moody
  'Grumpy', 'Cranky', 'Moody', 'Salty', 'Hangry', 'Pouty', 'Sulky',
  // Crazy/Wild
  'Crazy', 'Wacky', 'Zany', 'Bonkers', 'Loopy', 'Nutty', 'Mental', 'Unhinged',
  // Silly/Goofy
  'Silly', 'Goofy', 'Dopey', 'Derpy', 'Dorky', 'Nerdy', 'Wonky',
  // Sneaky/Mysterious
  'Sneaky', 'Shifty', 'Shady', 'Sketchy', 'Sly', 'Cunning',
  // Lazy/Chill
  'Lazy', 'Chill', 'Mellow', 'Zen', 'Vibing', 'Cozy',
  // Hyper/Energetic
  'Hyper', 'Bouncy', 'Jumpy', 'Zippy', 'Peppy', 'Perky', 'Buzzy', 'Jittery',
  // Dizzy/Confused
  'Dizzy', 'Wobbly', 'Confused', 'Dazed', 'Baffled', 'Puzzled',
  // Happy/Cheerful
  'Giggly', 'Jolly', 'Cheery', 'Bubbly', 'Sparkly', 'Glowing',
  // Sassy/Bold
  'Sassy', 'Spicy', 'Feisty', 'Fierce', 'Bold', 'Cheeky', 'Snarky',
  // Soft/Cute
  'Fluffy', 'Fuzzy', 'Cuddly', 'Squishy', 'Chonky', 'Thicc', 'Smol', 'Tiny',
  // Quirky
  'Quirky', 'Weird', 'Odd', 'Strange', 'Funky', 'Freaky', 'Peculiar',
  // Food-related
  'Toasty', 'Crunchy', 'Crispy', 'Soggy', 'Mushy', 'Spicy', 'Saucy',
  // Misc fun
  'Chaotic', 'Dramatic', 'Extra', 'Basic', 'Boujee', 'Fancy', 'Clumsy',
  'Clunky', 'Rusty', 'Dusty', 'Crusty', 'Moldy', 'Stinky', 'Smelly',
  'Loud', 'Quiet', 'Shy', 'Noisy', 'Rowdy', 'Wild', 'Feral', 'Unhinged'
]

const animals = [
  // Classic pets
  'Cat', 'Dog', 'Hamster', 'Bunny', 'Goldfish', 'Parrot', 'Turtle',
  // Cute/Popular
  'Panda', 'Koala', 'Sloth', 'Otter', 'Raccoon', 'Penguin', 'Hedgehog',
  'Capybara', 'Quokka', 'Red Panda', 'Fennec', 'Chinchilla', 'Sugar Glider',
  // Farm animals
  'Chicken', 'Duck', 'Goose', 'Pig', 'Cow', 'Sheep', 'Goat', 'Donkey', 'Llama', 'Alpaca',
  // Dogs
  'Corgi', 'Shiba', 'Pug', 'Husky', 'Beagle', 'Dachshund', 'Poodle', 'Chihuahua',
  // Wild animals
  'Fox', 'Wolf', 'Bear', 'Moose', 'Elk', 'Deer', 'Beaver', 'Badger', 'Skunk',
  'Squirrel', 'Chipmunk', 'Opossum', 'Armadillo', 'Porcupine',
  // Exotic
  'Platypus', 'Narwhal', 'Axolotl', 'Lemur', 'Meerkat', 'Wombat', 'Tapir', 'Okapi',
  'Pangolin', 'Kiwi', 'Kakapo', 'Blobfish', 'Tardigrade',
  // Birds
  'Owl', 'Crow', 'Raven', 'Pigeon', 'Seagull', 'Pelican', 'Flamingo', 'Toucan',
  'Puffin', 'Peacock', 'Turkey', 'Ostrich', 'Emu',
  // Sea creatures
  'Dolphin', 'Whale', 'Shark', 'Octopus', 'Squid', 'Jellyfish', 'Crab', 'Lobster',
  'Shrimp', 'Seal', 'Walrus', 'Manatee', 'Starfish',
  // Reptiles/Amphibians
  'Frog', 'Toad', 'Gecko', 'Iguana', 'Chameleon', 'Tortoise', 'Croc', 'Gator',
  // Insects (fun ones)
  'Bee', 'Butterfly', 'Ladybug', 'Firefly', 'Moth', 'Beetle', 'Ant', 'Mantis',
  // Mythical/Meme
  'Dragon', 'Unicorn', 'Phoenix', 'Griffin', 'Yeti', 'Bigfoot', 'Nessie',
  // Meme tier
  'Dodo', 'Potato', 'Nugget', 'Bean', 'Blob', 'Gremlin', 'Goblin', 'Cryptid'
]

// Room names: funny adjective + location (e.g., "Shitty Forest", "Stinky Swamp")
const roomAdjectives = [
  // Gross/Funny
  'Shitty', 'Crappy', 'Stinky', 'Smelly', 'Funky', 'Musty', 'Dusty', 'Rusty',
  'Crusty', 'Moldy', 'Slimy', 'Grimy', 'Greasy', 'Soggy', 'Damp', 'Moist',
  // Spooky
  'Spooky', 'Creepy', 'Haunted', 'Cursed', 'Ghostly', 'Eerie', 'Gloomy', 'Shadowy',
  'Sinister', 'Ominous', 'Doomed', 'Forsaken', 'Wicked', 'Unholy',
  // Broken/Bad
  'Sketchy', 'Janky', 'Wonky', 'Broken', 'Busted', 'Crooked', 'Twisted', 'Warped',
  'Glitchy', 'Buggy', 'Laggy', 'Scuffed', 'Botched', 'Botched',
  // Weather/Atmosphere
  'Foggy', 'Misty', 'Stormy', 'Rainy', 'Muddy', 'Flooded', 'Frozen', 'Burning',
  'Windy', 'Dusty', 'Sandy', 'Snowy', 'Icy', 'Scorching',
  // Weird/Strange
  'Weird', 'Strange', 'Odd', 'Bizarre', 'Freaky', 'Trippy', 'Psychedelic', 'Surreal',
  'Absurd', 'Ridiculous', 'Nonsense', 'Chaotic', 'Random', 'Cursed',
  // Abandoned/Old
  'Abandoned', 'Forgotten', 'Lost', 'Hidden', 'Secret', 'Forbidden', 'Ancient',
  'Ruined', 'Decrepit', 'Crumbling', 'Overgrown', 'Desolate', 'Barren',
  // Size/Scale
  'Tiny', 'Huge', 'Giant', 'Massive', 'Colossal', 'Infinite', 'Endless', 'Bottomless',
  // Misc fun
  'Suspicious', 'Questionable', 'Dubious', 'Legendary', 'Mythical', 'Magical',
  'Enchanted', 'Bewitched', 'Possessed', 'Infested', 'Overrun', 'Lawless',
  'Ungovernable', 'Feral', 'Unhinged', 'Chaotic', 'Menacing', 'Ominous'
]

const locations = [
  // Nature - Forests/Woods
  'Forest', 'Woods', 'Grove', 'Thicket', 'Jungle', 'Rainforest', 'Woodland',
  // Nature - Water
  'Swamp', 'Marsh', 'Bog', 'Wetland', 'River', 'Lake', 'Pond', 'Creek', 'Stream',
  'Waterfall', 'Ocean', 'Sea', 'Beach', 'Lagoon', 'Bay', 'Reef', 'Delta',
  // Nature - Land
  'Mountain', 'Hill', 'Valley', 'Canyon', 'Gorge', 'Cliff', 'Mesa', 'Plateau',
  'Desert', 'Dunes', 'Tundra', 'Glacier', 'Volcano', 'Crater', 'Ravine',
  // Nature - Fields
  'Meadow', 'Prairie', 'Savanna', 'Steppe', 'Field', 'Pasture', 'Clearing', 'Glade',
  // Buildings - Grand
  'Castle', 'Palace', 'Fortress', 'Citadel', 'Tower', 'Spire', 'Cathedral', 'Temple',
  'Shrine', 'Monastery', 'Abbey', 'Mansion', 'Manor', 'Estate', 'Villa',
  // Buildings - Dark
  'Dungeon', 'Crypt', 'Tomb', 'Catacomb', 'Vault', 'Cellar', 'Pit', 'Abyss',
  'Lair', 'Den', 'Hideout', 'Bunker', 'Asylum', 'Prison', 'Gallows',
  // Buildings - Common
  'Village', 'Town', 'City', 'Hamlet', 'Outpost', 'Camp', 'Settlement', 'Colony',
  'Tavern', 'Inn', 'Pub', 'Bar', 'Saloon', 'Cantina', 'Casino', 'Arcade',
  // Buildings - Home
  'Basement', 'Attic', 'Garage', 'Shed', 'Barn', 'Warehouse', 'Factory', 'Mill',
  'Cabin', 'Cottage', 'Shack', 'Hut', 'Treehouse', 'Igloo', 'Tent', 'Trailer',
  // Underground
  'Cave', 'Cavern', 'Grotto', 'Mine', 'Tunnel', 'Burrow', 'Hole', 'Sewer', 'Subway',
  // Gross/Funny
  'Toilet', 'Bathroom', 'Dumpster', 'Landfill', 'Junkyard', 'Alley', 'Gutter',
  'Trashcan', 'Porta-Potty', 'Outhouse', 'Closet', 'Crawlspace',
  // Cosmic/Abstract
  'Void', 'Abyss', 'Realm', 'Dimension', 'Nexus', 'Portal', 'Rift', 'Vortex',
  'Limbo', 'Purgatory', 'Paradise', 'Utopia', 'Dystopia', 'Simulation',
  // Islands/Remote
  'Island', 'Archipelago', 'Oasis', 'Sanctuary', 'Refuge', 'Haven', 'Enclave',
  // Misc
  'Arena', 'Colosseum', 'Stadium', 'Circus', 'Zoo', 'Aquarium', 'Museum',
  'Library', 'Laboratory', 'Observatory', 'Greenhouse', 'Garden', 'Park',
  'Cemetery', 'Graveyard', 'Morgue', 'Hospital', 'Office', 'Cubicle'
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function generateUserName(): string {
  return `${pick(userAdjectives)} ${pick(animals)}`
}

export function generateRoomName(): string {
  return `${pick(roomAdjectives)}-${pick(locations)}`.toLowerCase()
}

export function toRoomId(roomName: string): string {
  return roomName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

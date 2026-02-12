const ADJECTIVES = [
  'Cosmic', 'Neon', 'Turbo', 'Fuzzy', 'Spicy', 'Groovy', 'Mega', 'Ultra',
  'Radical', 'Chill', 'Funky', 'Snappy', 'Zippy', 'Blazing', 'Mystic',
  'Jolly', 'Witty', 'Dapper', 'Sassy', 'Zesty', 'Breezy', 'Peppy',
  'Quirky', 'Wacky', 'Lucky', 'Mighty', 'Noble', 'Swift', 'Brave',
  'Clever', 'Fierce', 'Golden', 'Happy', 'Jazzy', 'Keen', 'Lively',
  'Plucky', 'Rapid', 'Savvy', 'Vivid', 'Bold', 'Crisp', 'Eager',
  'Grand', 'Hyper', 'Icy', 'Jumpy', 'Loud', 'Merry', 'Perky',
];

const NOUNS = [
  'Penguin', 'Taco', 'Sloth', 'Wizard', 'Pickle', 'Panda', 'Ninja',
  'Waffle', 'Dragon', 'Pirate', 'Llama', 'Donut', 'Phoenix', 'Otter',
  'Mango', 'Falcon', 'Koala', 'Pretzel', 'Tiger', 'Cactus', 'Badger',
  'Raven', 'Bison', 'Gecko', 'Moose', 'Squid', 'Yeti', 'Puffin',
  'Walrus', 'Cobra', 'Parrot', 'Lobster', 'Dingo', 'Ferret', 'Hawk',
  'Iguana', 'Jackal', 'Lemur', 'Narwhal', 'Osprey', 'Quokka', 'Toucan',
  'Viper', 'Wombat', 'Bobcat', 'Condor', 'Elk', 'Fox', 'Gopher',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a single fun player name like "Cosmic Penguin" */
export function generatePlayerName(): string {
  return `${randomItem(ADJECTIVES)} ${randomItem(NOUNS)}`;
}

/** Generate N unique player name suggestions */
export function generatePlayerNames(count: number): string[] {
  const names = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 10;
  while (names.size < count && attempts < maxAttempts) {
    names.add(generatePlayerName());
    attempts++;
  }
  return Array.from(names);
}

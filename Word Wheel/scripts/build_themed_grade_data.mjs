import { readFile, writeFile } from "node:fs/promises";

const TARGET_COUNTS = {
  1: 200,
  2: 300,
  3: 400,
  4: 500,
  5: 600
};

const THEME_DEFS = [
  {
    id: "animals",
    title: "Animals",
    description: "Words about animals, pets, and living creatures."
  },
  {
    id: "food",
    title: "Food",
    description: "Words for things we eat or drink."
  },
  {
    id: "home",
    title: "Home",
    description: "Words for home, rooms, and things around the house."
  },
  {
    id: "school",
    title: "School",
    description: "Words used in class, reading, and learning."
  },
  {
    id: "nature",
    title: "Nature",
    description: "Words about plants, land, water, and the outdoors."
  },
  {
    id: "actions",
    title: "Actions",
    description: "Words that describe what someone can do."
  },
  {
    id: "body",
    title: "Body",
    description: "Words for body parts and health ideas."
  },
  {
    id: "color-shape",
    title: "Colors and Shapes",
    description: "Words for colors, shapes, and visual features."
  },
  {
    id: "travel",
    title: "Travel",
    description: "Words about moving from place to place."
  },
  {
    id: "feelings",
    title: "Feelings",
    description: "Words that name emotions and moods."
  },
  {
    id: "community",
    title: "Community",
    description: "Words for people, jobs, and places in a town."
  },
  {
    id: "science",
    title: "Science",
    description: "Words about earth, space, and simple science topics."
  },
  {
    id: "arts",
    title: "Arts and Music",
    description: "Words used in drawing, songs, and creative work."
  },
  {
    id: "time-number",
    title: "Time and Number",
    description: "Words that describe time, order, and counting ideas."
  },
  {
    id: "weather",
    title: "Weather",
    description: "Words about weather and seasons."
  },
  {
    id: "technology",
    title: "Technology",
    description: "Words for tools, machines, and digital devices."
  },
  {
    id: "sports",
    title: "Sports",
    description: "Words for games, movement, and team play."
  },
  {
    id: "everyday-life",
    title: "Everyday Life",
    description: "Common words used in daily life and conversation."
  }
];

const KEYWORDS = {
  animals: new Set([
    "ant",
    "bat",
    "bear",
    "bee",
    "bird",
    "cat",
    "cow",
    "cricket",
    "deer",
    "dog",
    "duck",
    "eagle",
    "fox",
    "frog",
    "goat",
    "hen",
    "horse",
    "kitten",
    "lion",
    "mouse",
    "owl",
    "pet",
    "pig",
    "puppy",
    "rabbit",
    "shark",
    "sheep",
    "squirrel",
    "tiger",
    "turkey",
    "whale",
    "wolf",
    "zebra",
    "zoo"
  ]),
  food: new Set([
    "apple",
    "banana",
    "bean",
    "berry",
    "bread",
    "broccoli",
    "cake",
    "candy",
    "carrot",
    "cereal",
    "cheese",
    "cherry",
    "coffee",
    "corn",
    "cookie",
    "dinner",
    "egg",
    "garlic",
    "grape",
    "honey",
    "juice",
    "lemon",
    "milk",
    "noodle",
    "orange",
    "pancake",
    "pear",
    "pepper",
    "pie",
    "potato",
    "pumpkin",
    "rice",
    "salad",
    "sandwich",
    "snack",
    "soup",
    "tea",
    "tomato",
    "water"
  ]),
  home: new Set([
    "bed",
    "blanket",
    "book",
    "bottle",
    "broom",
    "bucket",
    "cabin",
    "candle",
    "carpet",
    "chair",
    "closet",
    "coat",
    "corner",
    "cotton",
    "couch",
    "curtain",
    "desk",
    "door",
    "drawer",
    "fan",
    "floor",
    "fork",
    "fridge",
    "garden",
    "home",
    "house",
    "jar",
    "kitchen",
    "lamp",
    "laundry",
    "mirror",
    "napkin",
    "pan",
    "pillow",
    "plate",
    "room",
    "shelf",
    "shoe",
    "sock",
    "spoon",
    "table",
    "towel",
    "wall",
    "window",
    "yard",
    "zipper"
  ]),
  school: new Set([
    "alphabet",
    "book",
    "chalk",
    "class",
    "crayon",
    "game",
    "journal",
    "key",
    "language",
    "learn",
    "lesson",
    "library",
    "map",
    "marker",
    "music",
    "note",
    "notebook",
    "paper",
    "pen",
    "pencil",
    "poem",
    "puzzle",
    "reader",
    "reading",
    "school",
    "song",
    "spell",
    "story",
    "student",
    "teacher",
    "test",
    "write",
    "writer"
  ]),
  nature: new Set([
    "beach",
    "blossom",
    "branch",
    "canyon",
    "cloud",
    "creek",
    "earth",
    "farm",
    "feather",
    "field",
    "flower",
    "forest",
    "grass",
    "hill",
    "island",
    "jungle",
    "leaf",
    "log",
    "moon",
    "mountain",
    "nest",
    "ocean",
    "park",
    "pond",
    "rain",
    "rainbow",
    "river",
    "rock",
    "sand",
    "seed",
    "sky",
    "snow",
    "star",
    "sun",
    "sunset",
    "tree",
    "valley",
    "wave",
    "wind"
  ]),
  actions: new Set([
    "act",
    "ask",
    "bake",
    "build",
    "catch",
    "change",
    "clap",
    "climb",
    "cook",
    "dance",
    "draw",
    "dream",
    "drive",
    "drop",
    "find",
    "fix",
    "help",
    "jump",
    "laugh",
    "listen",
    "look",
    "move",
    "open",
    "paint",
    "play",
    "read",
    "run",
    "share",
    "sing",
    "sit",
    "skip",
    "smile",
    "solve",
    "speak",
    "stand",
    "study",
    "swim",
    "talk",
    "think",
    "touch",
    "try",
    "wait",
    "walk",
    "watch",
    "write"
  ]),
  body: new Set([
    "arm",
    "back",
    "beard",
    "body",
    "ear",
    "elbow",
    "eye",
    "face",
    "finger",
    "foot",
    "hand",
    "head",
    "heart",
    "knee",
    "leg",
    "lip",
    "mouth",
    "nose",
    "skin",
    "teeth",
    "thumb"
  ]),
  "color-shape": new Set([
    "black",
    "blue",
    "brown",
    "circle",
    "color",
    "gold",
    "gray",
    "green",
    "orange",
    "pink",
    "purple",
    "red",
    "rectangle",
    "round",
    "shape",
    "silver",
    "square",
    "triangle",
    "white",
    "yellow"
  ]),
  travel: new Set([
    "airport",
    "bicycle",
    "boat",
    "border",
    "bridge",
    "bus",
    "car",
    "driver",
    "flight",
    "harbor",
    "highway",
    "map",
    "passenger",
    "path",
    "plane",
    "road",
    "rocket",
    "sailor",
    "ship",
    "station",
    "ticket",
    "train",
    "travel",
    "trip",
    "tunnel",
    "van",
    "wheel"
  ]),
  feelings: new Set([
    "angry",
    "brave",
    "calm",
    "careful",
    "cheerful",
    "fear",
    "gentle",
    "glad",
    "happy",
    "kind",
    "nervous",
    "proud",
    "quiet",
    "sad",
    "shy",
    "smile",
    "sorry",
    "sweet"
  ]),
  community: new Set([
    "captain",
    "city",
    "community",
    "cousin",
    "dad",
    "dentist",
    "doctor",
    "family",
    "farmer",
    "festival",
    "firefighter",
    "friend",
    "girl",
    "hospital",
    "kid",
    "mom",
    "neighbor",
    "office",
    "parent",
    "people",
    "police",
    "school",
    "sister",
    "teacher",
    "village"
  ]),
  science: new Set([
    "battery",
    "engine",
    "earth",
    "energy",
    "globe",
    "gravity",
    "internet",
    "machine",
    "magnet",
    "metal",
    "planet",
    "science",
    "scientist",
    "solar",
    "space",
    "star",
    "thunder"
  ]),
  arts: new Set([
    "artist",
    "camera",
    "color",
    "dance",
    "draw",
    "drum",
    "music",
    "orchestra",
    "paint",
    "paper",
    "photo",
    "poem",
    "song",
    "story",
    "violin"
  ]),
  "time-number": new Set([
    "about",
    "after",
    "before",
    "calendar",
    "clock",
    "day",
    "early",
    "eight",
    "evening",
    "first",
    "four",
    "later",
    "minute",
    "morning",
    "night",
    "one",
    "second",
    "season",
    "seven",
    "six",
    "spring",
    "summer",
    "third",
    "three",
    "time",
    "today",
    "tomorrow",
    "two",
    "week",
    "winter",
    "year"
  ]),
  weather: new Set([
    "autumn",
    "cloud",
    "cold",
    "rain",
    "rainbow",
    "rainy",
    "season",
    "snow",
    "spring",
    "storm",
    "summer",
    "sun",
    "sunny",
    "thunder",
    "warm",
    "weather",
    "wind",
    "winter"
  ]),
  technology: new Set([
    "battery",
    "camera",
    "computer",
    "engine",
    "internet",
    "keyboard",
    "machine",
    "phone",
    "screen",
    "tablet",
    "video"
  ]),
  sports: new Set([
    "ball",
    "bat",
    "catch",
    "goal",
    "play",
    "race",
    "score",
    "skate",
    "ski",
    "soccer",
    "sport",
    "swim",
    "team",
    "tennis",
    "throw"
  ])
};

const THEME_FALLBACK_ORDER = [
  "animals",
  "food",
  "home",
  "school",
  "nature",
  "actions",
  "body",
  "color-shape",
  "travel",
  "feelings",
  "community",
  "science",
  "arts",
  "time-number",
  "weather",
  "technology",
  "sports",
  "everyday-life"
];

const EXTRA_WORDS = [
  "ability",
  "above",
  "acorn",
  "across",
  "active",
  "advice",
  "afraid",
  "again",
  "agent",
  "air",
  "airplane",
  "alive",
  "allow",
  "alone",
  "already",
  "always",
  "amaze",
  "among",
  "answer",
  "anyone",
  "arrive",
  "aside",
  "awake",
  "backpack",
  "bake",
  "bamboo",
  "bank",
  "baseball",
  "basic",
  "basket",
  "bathroom",
  "because",
  "become",
  "before",
  "begin",
  "below",
  "better",
  "beyond",
  "birthday",
  "biscuit",
  "blow",
  "boil",
  "bottom",
  "brave",
  "bright",
  "bring",
  "broad",
  "broken",
  "brush",
  "buddy",
  "budget",
  "butter",
  "button",
  "care",
  "careful",
  "carry",
  "center",
  "certain",
  "choose",
  "circle",
  "clean",
  "clear",
  "clerk",
  "close",
  "collect",
  "college",
  "common",
  "complete",
  "connect",
  "corner",
  "correct",
  "count",
  "country",
  "cover",
  "create",
  "cross",
  "custom",
  "damage",
  "danger",
  "decide",
  "deep",
  "delight",
  "dense",
  "detail",
  "differ",
  "direct",
  "discover",
  "dish",
  "double",
  "drift",
  "during",
  "eager",
  "earth",
  "eastern",
  "easy",
  "effort",
  "either",
  "electric",
  "empty",
  "enjoy",
  "enough",
  "enter",
  "equal",
  "escape",
  "even",
  "exact",
  "except",
  "excite",
  "extra",
  "fabric",
  "famous",
  "fancy",
  "feature",
  "final",
  "finish",
  "flame",
  "flash",
  "focus",
  "follow",
  "future",
  "gather",
  "general",
  "glow",
  "ground",
  "handle",
  "happen",
  "heavy",
  "honest",
  "ideal",
  "image",
  "inside",
  "invite",
  "jolly",
  "judge",
  "jungle",
  "journey",
  "junior",
  "kindness",
  "ladder",
  "latest",
  "leader",
  "level",
  "likely",
  "lively",
  "local",
  "lucky",
  "magic",
  "manage",
  "marble",
  "matter",
  "middle",
  "minute",
  "modern",
  "moment",
  "mostly",
  "nature",
  "normal",
  "number",
  "object",
  "observe",
  "often",
  "option",
  "order",
  "outside",
  "owner",
  "perfect",
  "person",
  "picture",
  "piece",
  "place",
  "planet",
  "please",
  "point",
  "power",
  "practice",
  "present",
  "pretty",
  "problem",
  "quick",
  "quiet",
  "rapid",
  "ready",
  "reason",
  "record",
  "remain",
  "repeat",
  "result",
  "review",
  "right",
  "round",
  "safety",
  "sample",
  "satisfy",
  "school",
  "season",
  "secret",
  "select",
  "settle",
  "shallow",
  "simple",
  "single",
  "sister",
  "skill",
  "solid",
  "special",
  "spirit",
  "steady",
  "strong",
  "system",
  "target",
  "temple",
  "thank",
  "thick",
  "though",
  "through",
  "together",
  "travel",
  "truly",
  "trust",
  "under",
  "united",
  "useful",
  "value",
  "various",
  "voice",
  "volume",
  "warmth",
  "welcome",
  "wonder",
  "world"
];

function normalizeWord(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function difficultyScore(word) {
  const rarePenalty = (word.match(/[jqxz]/g) || []).length * 0.8;
  const blendPenalty = /(tion|sion|ough|eigh|ph|wh|ch|sh|th)/.test(word) ? 0.5 : 0;
  return word.length + rarePenalty + blendPenalty;
}

function classifyWord(word) {
  for (const themeId of THEME_FALLBACK_ORDER) {
    const set = KEYWORDS[themeId];
    if (set && set.has(word)) {
      return [themeId];
    }
  }

  return ["everyday-life"];
}

const SIMPLE_CLUE_OVERRIDES = {
  // Actions
  bake: "Make food in an oven.",
  change: "Make something different.",
  dance: "Move your body to music.",
  dream: "See stories in your sleep.",
  drive: "Make a car go.",
  jump: "Hop up into the air.",
  listen: "Use your ears to hear.",
  play: "Have fun with a game.",
  run: "Move fast on your feet.",
  sing: "Make music with your voice.",
  sit: "Rest on a chair.",
  smile: "Make a happy face.",
  study: "Learn by reading and practicing.",
  swim: "Move in water.",

  // Animals
  ant: "A tiny insect that walks in lines.",
  bat: "An animal that flies at night.",
  bee: "An insect that makes honey.",
  bird: "An animal with wings and feathers.",
  cat: "A pet that says meow.",
  cow: "A farm animal that says moo.",
  dog: "A pet that barks.",
  duck: "A bird that swims and says quack.",
  eagle: "A big bird that can soar.",
  fox: "A wild animal with a bushy tail.",
  frog: "A small animal that hops and swims.",
  goat: "A farm animal that can climb.",
  hen: "A mother chicken.",
  horse: "A big animal you can ride.",
  kitten: "A baby cat.",
  lion: "A big cat with a mane.",
  mouse: "A small animal that can squeak.",
  pet: "An animal that lives with a family.",
  pig: "A farm animal that says oink.",
  rabbit: "A small animal with long ears.",
  wolf: "A wild animal that howls.",
  zoo: "A place to see animals.",

  // Arts
  camera: "A tool that takes pictures.",

  // Body
  arm: "You lift things with it.",
  ear: "You hear with it.",
  eye: "You see with it.",
  hand: "You hold things with it.",
  heart: "It beats inside your chest.",
  leg: "You walk and run with it.",
  nose: "You smell with it.",

  // Colors and shapes
  blue: "The color of the sky.",
  circle: "A round shape like a coin.",
  color: "Red and blue are this.",
  gold: "A shiny yellow metal.",
  green: "The color of grass.",
  pink: "A light red color.",
  red: "The color of an apple.",
  round: "Shaped like a circle.",
  yellow: "The color of the sun.",

  // Community
  captain: "The leader of a team or ship.",
  dad: "A father.",
  doctor: "A person who helps sick people.",
  family: "The people who live with you.",
  farmer: "A person who grows food.",
  friend: "Someone you like and play with.",
  girl: "A young person who is a girl.",
  kid: "A child.",
  office: "A place where people work.",
  parent: "A mom or a dad.",
  people: "Men, women, and kids.",
  sister: "A girl in your family.",
  village: "A small town.",

  // Feelings
  brave: "Not scared when things are hard.",
  careful: "Doing things safely.",
  gentle: "Soft and kind.",
  happy: "Feeling glad.",
  quiet: "Not loud.",
  sorry: "What you say after a mistake.",

  // Food
  apple: "A round fruit that can be red.",
  bread: "Food made from flour.",
  cake: "A sweet dessert.",
  candy: "A sweet treat.",
  cereal: "Crunchy breakfast food.",
  dinner: "The meal you eat at night.",
  egg: "Food that comes from a chicken.",
  juice: "A drink made from fruit.",
  lemon: "A sour yellow fruit.",
  milk: "A white drink from a cow.",
  orange: "A sweet fruit and a color.",
  snack: "A small food between meals.",

  // Home
  bed: "You sleep on it.",
  book: "You read it.",
  bottle: "You drink from it.",
  candle: "Wax that makes a small light.",
  chair: "You sit on it.",
  coat: "You wear it to stay warm.",
  corner: "Where two walls meet.",
  cotton: "Soft cloth comes from it.",
  desk: "A table for work or school.",
  door: "You open it to go in.",
  fan: "It blows air to cool you.",
  floor: "You stand on it inside.",
  garden: "A place where plants grow.",
  home: "The place where you live.",
  house: "A building where people live.",
  jar: "A container with a lid.",
  kitchen: "A room where you cook.",
  mirror: "You see yourself in it.",
  pan: "You cook food in it.",
  pillow: "You rest your head on it.",
  shoe: "You wear it on your foot.",
  sock: "You wear it under a shoe.",
  wall: "A side of a room.",
  window: "Glass you look through.",
  yard: "Land next to a house.",

  // Nature
  beach: "Sand by the ocean.",
  branch: "A part of a tree.",
  canyon: "A deep crack in the land.",
  cloud: "A white shape in the sky.",
  earth: "The planet we live on.",
  farm: "A place where food is grown.",
  feather: "A soft part of a bird.",
  forest: "A place with many trees.",
  grass: "Green plants on the ground.",
  hill: "A small mountain.",
  island: "Land with water all around.",
  jungle: "A thick forest with many plants.",
  log: "A big piece of a tree trunk.",
  moon: "The bright thing in the night sky.",
  nest: "A bird's home.",
  ocean: "A very big sea.",
  park: "A place to play outside.",
  pond: "A small lake.",
  rain: "Water that falls from clouds.",
  river: "Water that flows like a long stream.",
  rock: "A hard stone.",
  sand: "Tiny bits on a beach.",
  seed: "A tiny thing that grows into a plant.",
  sky: "The space above you.",
  snow: "White flakes that fall in winter.",
  star: "A bright light in the night sky.",
  sun: "The big light in the day sky.",
  tree: "A tall plant with a trunk.",
  valley: "Low land between hills.",
  wave: "Water that moves up and down.",
  wind: "Moving air.",

  // School
  crayon: "A stick you color with.",
  game: "Something you play for fun.",
  journal: "A book where you write.",
  key: "You use it to open a lock.",
  learn: "To get new knowledge.",
  lesson: "Something you learn in school.",
  library: "A place with many books.",
  map: "A picture that shows places.",
  music: "Songs and sounds you hear.",
  note: "A short message you write.",
  paper: "You write or draw on it.",
  pen: "You write with it.",
  pencil: "You write and erase with it.",
  school: "A place where you learn.",
  song: "Music you can sing.",
  teacher: "A person who helps you learn.",

  // Science
  energy: "Power to move or work.",
  engine: "A machine that makes things go.",
  machine: "A tool that helps you do work.",
  magnet: "It can pull metal.",
  metal: "A hard, shiny material.",
  planet: "A big ball in space.",
  science: "Learning how things work.",
  weather: "Rain, wind, and sun outside.",

  // Sports
  ball: "A round thing you throw or kick.",
  soccer: "A game where you kick a ball.",

  // Time and number
  about: "A word that means \"around\" or \"near\".",
  after: "Later than.",
  before: "Earlier than.",
  clock: "It tells the time.",
  day: "Time when the sun is up.",
  evening: "Late time before bed.",
  minute: "A small bit of time on a clock.",
  morning: "Early time after you wake up.",
  night: "Dark time when you sleep.",
  season: "Spring, summer, fall, or winter.",
  second: "A tiny bit of time.",
  spring: "A season after winter.",
  summer: "A warm season.",
  winter: "A cold season.",

  // Travel
  airport: "A place where planes go.",
  boat: "A vehicle that goes on water.",
  bus: "A big vehicle that carries people.",
  car: "A vehicle you ride in.",
  harbor: "A safe place for boats.",
  plane: "A vehicle that flies in the sky.",
  road: "A path for cars to drive on.",
  rocket: "A vehicle that can go to space.",
  ship: "A big boat.",
  station: "A place to wait for a train or bus.",
  travel: "To go from place to place.",
  van: "A big car that carries people.",

  // Weather
  rainy: "With lots of rain.",
  sunny: "With lots of sun.",
  warm: "Not cold."
};

function clueFromLabels(word, labels) {
  const firstLetter = word[0].toUpperCase();
  const lastLetter = word[word.length - 1].toUpperCase();
  const letters = word.length;
  if (letters <= 3) {
    const base = `Starts with ${firstLetter}. It has ${letters} letters.`;
    const lead = SIMPLE_CLUE_OVERRIDES[word];
    return lead ? `${lead} ${base}` : base;
  }
  const base = `Starts with ${firstLetter}, ends with ${lastLetter}, and has ${letters} letters.`;
  const lead = SIMPLE_CLUE_OVERRIDES[word];
  return lead ? `${lead} ${base}` : base;
}

async function loadBaseWords() {
  const files = [1, 2, 3, 4, 5].map((grade) => new URL(`../src/data/grade${grade}.json`, import.meta.url));
  const all = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.words)
        ? parsed.words
        : [];
    arr.forEach((entry) => {
      if (typeof entry === "string") {
        all.push(entry);
      } else if (entry && typeof entry === "object" && typeof entry.word === "string") {
        all.push(entry.word);
      }
    });
  }
  EXTRA_WORDS.forEach((word) => all.push(word));

  const unique = [];
  const seen = new Set();
  all.forEach((rawWord) => {
    const word = normalizeWord(rawWord);
    if (!word || word.length < 3 || word.length > 12 || seen.has(word)) {
      return;
    }
    seen.add(word);
    unique.push(word);
  });

  unique.sort((a, b) => {
    const scoreDiff = difficultyScore(a) - difficultyScore(b);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.localeCompare(b);
  });

  if (unique.length < TARGET_COUNTS[5]) {
    throw new Error(`Not enough unique words to reach ${TARGET_COUNTS[5]} words. Found ${unique.length}.`);
  }

  return unique.slice(0, TARGET_COUNTS[5]);
}

function buildGradeData(grade, sortedWords) {
  const targetCount = TARGET_COUNTS[grade];
  const gradeWords = sortedWords.slice(0, targetCount);

  const words = gradeWords.map((word) => {
    const labels = classifyWord(word);
    return {
      word,
      clue: clueFromLabels(word, labels),
      labels
    };
  });

  return {
    grade,
    themes: THEME_DEFS,
    words
  };
}

async function main() {
  const sortedWords = await loadBaseWords();

  for (let grade = 1; grade <= 5; grade += 1) {
    const payload = buildGradeData(grade, sortedWords);
    const outFile = new URL(`../src/data/grade${grade}.json`, import.meta.url);
    await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }

  console.log("Wrote themed grade files with counts:");
  for (let grade = 1; grade <= 5; grade += 1) {
    console.log(`grade${grade}: ${TARGET_COUNTS[grade]}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const WORDS = [
  // Animals
  "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "tiger", "lion",
  "zebra", "kangaroo", "panda", "koala", "octopus", "butterfly", "eagle",
  "shark", "whale", "crocodile", "parrot", "flamingo", "gorilla", "cheetah",
  // Food
  "pizza", "burger", "sushi", "taco", "spaghetti", "donut", "cupcake",
  "watermelon", "strawberry", "pineapple", "broccoli", "avocado", "popcorn",
  "ice cream", "chocolate", "sandwich", "pancake", "waffle", "pretzel",
  // Objects
  "umbrella", "telescope", "backpack", "guitar", "trophy", "compass",
  "hourglass", "lantern", "magnifier", "anchor", "ladder", "balloon",
  "camera", "clock", "diamond", "hammer", "key", "lightbulb", "magnet",
  "mirror", "notebook", "paintbrush", "scissors", "telephone", "umbrella",
  // Places
  "beach", "mountain", "castle", "lighthouse", "volcano", "waterfall",
  "desert", "jungle", "igloo", "pyramid", "cave", "island", "forest",
  // Actions
  "swimming", "dancing", "cooking", "painting", "sleeping", "running",
  "jumping", "reading", "singing", "flying", "fishing", "skating",
  // Vehicles
  "rocket", "submarine", "helicopter", "bicycle", "train", "sailboat",
  "ambulance", "bulldozer", "motorcycle", "spaceship", "tractor",
  // Nature
  "rainbow", "tornado", "snowflake", "thunder", "sunset", "aurora",
  "earthquake", "tsunami", "meteor", "eclipse", "hurricane",
  // Misc
  "robot", "wizard", "dragon", "mermaid", "superhero", "zombie",
  "spaceman", "pirate", "ninja", "cowboy", "knight", "alien",
  "treasure", "crown", "sword", "shield", "potion", "wand",
  "firework", "candle", "campfire", "snowman", "scarecrow", "cactus"
];

function getRandomWords(count = 3) {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

module.exports = { WORDS, getRandomWords, getRandomWord };

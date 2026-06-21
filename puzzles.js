/**
 * puzzles.js - Puzzle Bank (500 puzzles total: 5 puzzles/day for 100 days)
 * Features child-friendly themes: Cats, Dogs, Unicorns, Raptors, T-Rex, Birds, Butterflies, Crafts.
 * Fully structured as JSON/JS Objects for database portability.
 */

// Hand-crafted initial puzzles for Days 1 to 5 (25 puzzles)
const HAND_CRAFTED_PUZZLES = [
  // ================= DAY 1 =================
  {
    id: "d1_q1",
    day: 1,
    number: 1,
    title: "The Unicorn's Rainbow Path",
    category: "Logical Thinking",
    theme: "Unicorns",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Rainbow Sparkle the Unicorn can only step on clouds that form a repeating pattern: Red, Blue, Yellow, Red, Blue, Yellow. She is standing on a Red cloud. What are the colors of the next three clouds she must step on to cross the sky?",
    type: "multiple-choice",
    options: [
      "Blue, Yellow, Red",
      "Red, Blue, Yellow",
      "Yellow, Red, Blue",
      "Blue, Red, Yellow"
    ],
    correctAnswer: "Blue, Yellow, Red",
    hints: [
      "Look at the repeating pattern: Red, then Blue, then Yellow, and then it starts over with Red.",
      "She is on Red now. What comes immediately after Red in the pattern?"
    ],
    explanation: "The pattern is Red -> Blue -> Yellow. Since she is currently standing on a Red cloud, the next three clouds in order must be Blue, Yellow, and then Red again."
  },
  {
    id: "d1_q2",
    day: 1,
    number: 2,
    title: "Bella the Cat's Yarn Basket",
    category: "Lateral Thinking",
    theme: "Cats",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Bella the Cat has a basket with 5 balls of colorful yarn. Five of her kitten friends each take 1 ball of yarn, but 1 ball of yarn is still left inside the basket! How is this possible?",
    type: "multiple-choice",
    options: [
      "One kitten took the basket with the last ball of yarn inside",
      "One kitten didn't want any yarn",
      "The basket has a secret double bottom holding a extra ball",
      "Bella hid a sixth ball of yarn behind her back"
    ],
    correctAnswer: "One kitten took the basket with the last ball of yarn inside",
    hints: [
      "Think about how the kittens took their yarn. Does a ball of yarn have to be empty-handed?",
      "If you take a basket that has a ball inside it, you have the ball, but where is the ball?"
    ],
    explanation: "The last kitten took the basket itself with the final ball of yarn still sitting inside it! So all 5 kittens got a ball of yarn, and one ball remains in the basket."
  },
  {
    id: "d1_q3",
    day: 1,
    number: 3,
    title: "Rocky's T-Rex Cave Sign",
    category: "Creative Crafting",
    theme: "T-Rex",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Rocky the T-Rex wants to make a welcome sign for his cave. Draw a giant dinosaur footprint with three big toes on the screen!",
    type: "drawing",
    options: [],
    correctAnswer: "A drawing of a 3-toed dinosaur footprint.",
    referenceSvg: `<svg viewBox="0 0 100 100" width="120" height="120" fill="var(--primary-color)"><path d="M50,85 C55,80 62,70 65,60 C68,50 78,35 85,25 C87,22 83,22 80,24 C72,29 64,35 60,40 C58,35 54,20 50,10 C46,20 42,35 40,40 C36,35 28,29 20,24 C17,22 13,22 15,25 C22,35 32,50 35,60 C38,70 45,80 50,85 Z" /></svg>`,
    hints: [
      "T-Rexes have three main toes pointing forward on their feet.",
      "Select a bright color like green or orange and draw a shape with three thick toe lines!"
    ],
    explanation: "Rocky is super excited to see your three-toed dinosaur print! It makes his cave look very friendly."
  },
  {
    id: "d1_q4",
    day: 1,
    number: 4,
    title: "Crafty Scissors",
    category: "Logical Thinking",
    theme: "Arts & Crafts",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Lily is cutting a long strip of paper. If she cuts the paper straight across exactly 4 times, how many separate pieces of paper will she have in the end?",
    type: "multiple-choice",
    options: [
      "4 pieces",
      "5 pieces",
      "3 pieces",
      "6 pieces"
    ],
    correctAnswer: "5 pieces",
    hints: [
      "Try drawing a line and putting cuts on it, or fold a piece of paper in your head.",
      "1 cut makes 2 pieces. 2 cuts make 3 pieces. Do you see a pattern?"
    ],
    explanation: "Each straight cut through a strip of paper creates one more piece than the number of cuts. So 4 cuts will yield 5 pieces."
  },
  {
    id: "d1_q5",
    day: 1,
    number: 5,
    title: "Three Little Birds",
    category: "Logical Thinking",
    theme: "Birds",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Three colorful birds—Ruby (red), Sky (blue), and Sunny (yellow)—live in three different trees: Oak, Pine, and Maple. The red bird does not live in the Oak tree. The blue bird lives in the Pine tree. Which bird lives in the Maple tree?",
    type: "text-input",
    correctAnswer: "Ruby",
    hints: [
      "We know the blue bird (Sky) lives in the Pine tree. That leaves Oak and Maple trees for Ruby and Sunny.",
      "If the red bird (Ruby) does not live in the Oak, she must live in the only other option left!"
    ],
    explanation: "Sky lives in the Pine tree. This leaves the Oak and Maple trees. Since Ruby (the red bird) does not live in the Oak tree, she must live in the Maple tree. (This leaves Sunny to live in the Oak tree!)."
  },

  // ================= DAY 2 =================
  {
    id: "d2_q1",
    day: 2,
    number: 1,
    title: "Rex the Raptor's Butterfly Chase",
    category: "Logical Thinking",
    theme: "Raptors",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Rex the Raptor is chasing a butterfly. Rex always turns left at every crossing. He starts by walking North. At the first crossing, he turns left. At the second crossing, he turns left again. Which direction is Rex facing now?",
    type: "multiple-choice",
    options: [
      "North",
      "South",
      "East",
      "West"
    ],
    correctAnswer: "South",
    hints: [
      "If you walk North and turn left, you face West.",
      "If you walk West and turn left again, which direction do you face?"
    ],
    explanation: "Starting North, a left turn puts Rex facing West. The second left turn from West puts him facing South."
  },
  {
    id: "d2_q2",
    day: 2,
    number: 2,
    title: "Butterfly Symmetry",
    category: "Creative Crafting",
    theme: "Butterflies",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Draw a beautiful butterfly! Try to make the left wing and the right wing look symmetrical (matching each other). Use lots of colors!",
    type: "drawing",
    options: [],
    correctAnswer: "A symmetrical drawing of a butterfly.",
    referenceSvg: `<svg viewBox="0 0 100 100" width="120" height="120" fill="var(--primary-color)"><path d="M50,30 C45,15 20,10 15,30 C12,42 22,55 45,55 C48,55 49,52 50,50 C51,52 52,55 55,55 C78,55 88,42 85,30 C80,10 55,15 50,30 Z M50,50 C45,62 25,65 20,75 C15,82 25,90 45,78 C48,76 49,72 50,70 C51,72 52,76 55,78 C75,90 85,82 80,75 C75,65 55,62 50,50 Z" /><rect x="48" y="20" width="4" height="60" rx="2" fill="var(--accent-text)" /><path d="M48,22 Q40,12 36,15" stroke="var(--accent-text)" stroke-width="2" fill="none" /><path d="M52,22 Q60,12 64,15" stroke="var(--accent-text)" stroke-width="2" fill="none" /></svg>`,
    hints: [
      "Draw the body in the middle first, then draw a wing on the left and a matching wing on the right.",
      "Add colorful dots or patterns on both sides!"
    ],
    explanation: "Symmetry means both sides look like mirror images. Your butterfly looks balanced and beautiful!"
  },
  {
    id: "d2_q3",
    day: 2,
    number: 3,
    title: "Whiskers' Secret Number Code",
    category: "Logical Thinking",
    theme: "Cats",
    difficulty: "Hard",
    coinsReward: 30,
    question: "Whiskers the Cat wrote a code using letters and numbers: CAT is written as 3-1-20. DOG is written as 4-15-7. Using Whiskers' secret rule, how would you write BIRD?",
    type: "multiple-choice",
    options: [
      "2-9-18-4",
      "1-8-17-3",
      "2-10-18-5",
      "2-9-19-4"
    ],
    correctAnswer: "2-9-18-4",
    hints: [
      "Look at the alphabet. A is 1, B is 2, C is 3... Z is 26.",
      "Check CAT: C=3, A=1, T=20. Yes, it matches! What are the letters for B, I, R, and D?"
    ],
    explanation: "The secret code matches each letter to its position in the alphabet. B is 2, I is 9, R is 18, and D is 4. So BIRD is 2-9-18-4."
  },
  {
    id: "d2_q4",
    day: 2,
    number: 4,
    title: "Max the Dog's Long Rope",
    category: "Lateral Thinking",
    theme: "Dogs",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Max the Dog is tied to a rope that is 3 meters long. A juicy bone is sitting 5 meters away from Max. Max easily walks over to the bone and starts chewing on it without breaking or stretching the rope. How is this possible?",
    type: "multiple-choice",
    options: [
      "The other end of the rope isn't tied to anything",
      "Max stretched the rope with his teeth",
      "The bone was tied to a string that Max pulled",
      "A friendly bird pushed the bone closer"
    ],
    correctAnswer: "The other end of the rope isn't tied to anything",
    hints: [
      "The question says Max is tied to a rope, but what is the rope tied to?",
      "If you tie a string to your shoe, but don't tie it to a chair, can you walk around?"
    ],
    explanation: "The rope is tied to Max, but the other end of the rope isn't tied to a tree or the ground! Max can walk as far as he wants."
  },
  {
    id: "d2_q5",
    day: 2,
    number: 5,
    title: "Origami Paper Folds",
    category: "Logical Thinking",
    theme: "Arts & Crafts",
    difficulty: "Easy",
    coinsReward: 10,
    question: "If you take a square sheet of craft paper, fold it in half exactly once, and then fold it in half again in the same direction, what shape do you have?",
    type: "multiple-choice",
    options: [
      "A long, thin rectangle",
      "A circle",
      "A triangle",
      "A star"
    ],
    correctAnswer: "A long, thin rectangle",
    hints: [
      "Fold a square in half once: it becomes a rectangle.",
      "If you fold that rectangle in half again along the same direction, it gets even narrower."
    ],
    explanation: "Folding it in half once divides the width by 2, making a rectangle. Folding it again in the same direction divides the width by 4, creating a longer, narrower rectangle."
  },

  // ================= DAY 3 =================
  {
    id: "d3_q1",
    day: 3,
    number: 1,
    title: "Dinosaur Leg Counting",
    category: "Logical Thinking",
    theme: "T-Rex",
    difficulty: "Medium",
    coinsReward: 20,
    question: "In the dino forest, a Triceratops has 4 legs, and a Raptor has 2 legs. You count exactly 12 dinosaur legs in total. If you know there are exactly 2 Triceratops, how many Raptors are there?",
    type: "text-input",
    correctAnswer: "2",
    hints: [
      "First, find out how many legs the 2 Triceratops have. (Each has 4 legs).",
      "Subtract those legs from 12. The remaining legs belong to the Raptors. How many legs does each Raptor have?"
    ],
    explanation: "2 Triceratops have 2 x 4 = 8 legs. Out of 12 legs, 12 - 8 = 4 legs remain. Since each Raptor has 2 legs, there must be 4 / 2 = 2 Raptors."
  },
  {
    id: "d3_q2",
    day: 3,
    number: 2,
    title: "Mia's Butterfly Painting",
    category: "Logical Thinking",
    theme: "Butterflies",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Mia is painting three butterfly models of different sizes: Big, Middle, and Small. She has three pots of paint: Pink, Purple, and Yellow. She paints each butterfly a different color. If the Big butterfly is not Yellow, and the Small butterfly is Pink, what color is the Middle butterfly?",
    type: "multiple-choice",
    options: [
      "Yellow",
      "Purple",
      "Pink",
      "Red"
    ],
    correctAnswer: "Yellow",
    hints: [
      "We know the Small butterfly is Pink. That leaves Purple and Yellow for the Big and Middle butterflies.",
      "If the Big butterfly cannot be Yellow, what color must it be? That leaves only one color for the Middle butterfly!"
    ],
    explanation: "Since the Small butterfly is Pink, we have Purple and Yellow left. The Big butterfly is not Yellow, so it must be Purple. That leaves Yellow for the Middle butterfly."
  },
  {
    id: "d3_q3",
    day: 3,
    number: 3,
    title: "Cute Kitten Portrait",
    category: "Creative Crafting",
    theme: "Cats",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Draw a cute cartoon kitten face! Make sure to include two triangle ears, round shiny eyes, a cute nose, and whiskers!",
    type: "drawing",
    options: [],
    correctAnswer: "A drawing of a kitten face.",
    referenceSvg: `<svg viewBox="0 0 100 100" width="120" height="120" stroke="var(--primary-color)" stroke-width="3" fill="none"><circle cx="50" cy="55" r="30" /><polygon points="25,35 20,10 40,28" fill="var(--secondary-color)" /><polygon points="75,35 80,10 60,28" fill="var(--secondary-color)" /><circle cx="40" cy="50" r="3" fill="var(--primary-color)" /><circle cx="60" cy="50" r="3" fill="var(--primary-color)" /><polygon points="48,58 52,58 50,60" fill="var(--primary-color)" /><path d="M50,60 Q47,64 44,62 M50,60 Q53,64 56,62" /><line x1="20" y1="55" x2="5" y2="53" /><line x1="20" y1="58" x2="3" y2="58" /><line x1="20" y1="61" x2="5" y2="63" /><line x1="80" y1="55" x2="95" y2="53" /><line x1="80" y1="58" x2="97" y2="58" /><line x1="80" y1="61" x2="95" y2="63" /></svg>`,
    hints: [
      "Draw a round circle for the head first.",
      "Add two triangles on top for ears, and draw three whiskers on each side of the face!"
    ],
    explanation: "That kitten looks super cute! It's purr-fect!"
  },
  {
    id: "d3_q4",
    day: 3,
    number: 4,
    title: "Feathers vs. Carving Tools",
    category: "Lateral Thinking",
    theme: "Arts & Crafts",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Which weighs more: a kilogram of colorful craft feathers or a kilogram of heavy steel carving tools?",
    type: "multiple-choice",
    options: [
      "They weigh exactly the same",
      "The steel carving tools",
      "The colorful craft feathers",
      "It depends on which box is larger"
    ],
    correctAnswer: "They weigh exactly the same",
    hints: [
      "A kilogram is a measure of weight. One feather is lighter than one tool, but what about a kilogram of both?",
      "If you put 1 kg of feathers on one side of a scale, and 1 kg of steel on the other, does one side push down more?"
    ],
    explanation: "Both weigh exactly one kilogram! Feathers are much lighter individually, so you would need a massive bag of feathers to make a kilogram, but the total weight is the same."
  },
  {
    id: "d3_q5",
    day: 3,
    number: 5,
    title: "Unicorn Horn Counting",
    category: "Logical Thinking",
    theme: "Unicorns",
    difficulty: "Hard",
    coinsReward: 30,
    question: "In Unicorn Land, Silver Unicorns have 1 gold horn. Golden Unicorns are special and have 2 silver horns! If there are 5 Silver Unicorns and 3 Golden Unicorns playing in a field, how many horns are there in total?",
    type: "text-input",
    correctAnswer: "11",
    hints: [
      "Calculate horns for Silver Unicorns: 5 unicorns times 1 horn.",
      "Calculate horns for Golden Unicorns: 3 unicorns times 2 horns. Then add them together."
    ],
    explanation: "5 Silver Unicorns have 5 x 1 = 5 horns. 3 Golden Unicorns have 3 x 2 = 6 horns. Total horns = 5 + 6 = 11 horns."
  },

  // ================= DAY 4 =================
  {
    id: "d4_q1",
    day: 4,
    number: 1,
    title: "Sarah's Beaded Dog Collar",
    category: "Logical Thinking",
    theme: "Dogs",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Sarah is making a dog collar out of beads. She strings them in a repeating pattern: Blue, Red, Green, Blue, Red, Green. If she has placed 14 beads on the string so far, what color will the 15th bead be?",
    type: "multiple-choice",
    options: [
      "Green",
      "Blue",
      "Red",
      "Yellow"
    ],
    correctAnswer: "Green",
    hints: [
      "The pattern repeats every 3 beads: 1st is Blue, 2nd is Red, 3rd is Green.",
      "Every bead that is a multiple of 3 (3, 6, 9, 12...) will be Green. Is 15 a multiple of 3?"
    ],
    explanation: "The pattern repeats every 3 beads: Blue (1), Red (2), Green (3). Since 15 is divisible by 3, the 15th bead will be Green (the last color of the pattern triplet)."
  },
  {
    id: "d4_q2",
    day: 4,
    number: 2,
    title: "Youngest Pup in the Pack",
    category: "Logical Thinking",
    theme: "Dogs",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Bingo the Pug is older than Cooper the Beagle. Cooper the Beagle is older than Daisy the Poodle. Who is the youngest dog in the group?",
    type: "multiple-choice",
    options: [
      "Daisy the Poodle",
      "Cooper the Beagle",
      "Bingo the Pug",
      "They are all the same age"
    ],
    correctAnswer: "Daisy the Poodle",
    hints: [
      "Bingo is older than Cooper. Cooper is older than Daisy.",
      "Think of it like a staircase of ages. Bingo is at the top. Who is at the bottom?"
    ],
    explanation: "If Bingo > Cooper and Cooper > Daisy, then Daisy is younger than both Cooper and Bingo, making Daisy the youngest."
  },
  {
    id: "d4_q3",
    day: 4,
    number: 3,
    title: "The Munching Caterpillar",
    category: "Creative Crafting",
    theme: "Butterflies",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Draw a green caterpillar crawling on a big leaf, taking a bite out of it!",
    type: "drawing",
    options: [],
    correctAnswer: "A drawing of a caterpillar on a leaf.",
    referenceSvg: `<svg viewBox="0 0 100 100" width="120" height="120" fill="none"><path d="M10,80 Q40,30 90,20 Q80,70 10,80 Z" fill="#4caf50" opacity="0.8" /><circle cx="90" cy="20" r="15" fill="#fcfbf7" /><path d="M10,80 L90,20" stroke="#388e3c" stroke-width="2" /><circle cx="30" cy="55" r="8" fill="#8bc34a" /><circle cx="42" cy="50" r="8" fill="#8bc34a" /><circle cx="54" cy="52" r="8" fill="#8bc34a" /><circle cx="66" cy="48" r="8" fill="#ffeb3b" /><circle cx="74" cy="42" r="9" fill="#ff5722" /><circle cx="76" cy="38" r="1" fill="black" /></svg>`,
    hints: [
      "Draw a big green leaf first, and maybe put a little bite mark (a gap) in it.",
      "Draw the caterpillar as a chain of little circles joined together!"
    ],
    explanation: "Delicious! That caterpillar looks very happy eating its green leaf lunch."
  },
  {
    id: "d4_q4",
    day: 4,
    number: 4,
    title: "Raptor Race",
    category: "Logical Thinking",
    theme: "Raptors",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Three raptors, Blue, Green, and Stripe, ran a race. Green finished ahead of Stripe. Blue finished behind Stripe. Who came in first place?",
    type: "multiple-choice",
    options: [
      "Green",
      "Stripe",
      "Blue",
      "It was a three-way tie"
    ],
    correctAnswer: "Green",
    hints: [
      "Green came before Stripe. So Stripe cannot be first.",
      "Blue came behind Stripe. That means Stripe beat Blue. Who beats them all?"
    ],
    explanation: "Green finished ahead of Stripe (Green > Stripe). Blue finished behind Stripe (Stripe > Blue). Combining these, we get Green > Stripe > Blue. So Green finished first."
  },
  {
    id: "d4_q5",
    day: 4,
    number: 5,
    title: "Milk on the Cabinet",
    category: "Lateral Thinking",
    theme: "Cats",
    difficulty: "Medium",
    coinsReward: 20,
    question: "A cat is only able to jump 2 meters high. There is a delicious bowl of milk sitting on top of a tall 3-meter cabinet. How does the cat get to the milk bowl without knocking the cabinet over?",
    type: "multiple-choice",
    options: [
      "The cat climbs up the cabinet sides",
      "The cat waits for the milk to fall down",
      "The cat calls a dog to push it down",
      "The cat uses a ladder"
    ],
    correctAnswer: "The cat climbs up the cabinet sides",
    hints: [
      "A cat cannot jump 3 meters, but cats have sharp claws. What else are cats famous for doing in trees?",
      "Jumping isn't the only way to go up."
    ],
    explanation: "Cats are excellent climbers! Even though it can't jump 3 meters in a single leap, it can easily climb up the front or sides of the wooden cabinet to reach the top."
  },

  // ================= DAY 5 =================
  {
    id: "d5_q1",
    day: 5,
    number: 1,
    title: "Baby T-Rex Teeth",
    category: "Logical Thinking",
    theme: "T-Rex",
    difficulty: "Hard",
    coinsReward: 30,
    question: "A baby T-Rex starts with 10 sharp teeth. Every day, it grows 2 brand new teeth, but loses 1 old tooth. How many teeth will the baby T-Rex have in total after 5 days?",
    type: "text-input",
    correctAnswer: "15",
    hints: [
      "Find out the net change of teeth per day. If it grows 2 and loses 1, how many teeth does it gain each day?",
      "Multiply that daily gain by 5 days, and add it to the starting number of teeth (10)."
    ],
    explanation: "Each day, the baby T-Rex gains 2 - 1 = 1 tooth. Over 5 days, it gains 5 x 1 = 5 teeth. Starting with 10 teeth, it ends up with 10 + 5 = 15 teeth."
  },
  {
    id: "d5_q2",
    day: 5,
    number: 2,
    title: "Parrots on a Branch",
    category: "Lateral Thinking",
    theme: "Birds",
    difficulty: "Medium",
    coinsReward: 20,
    question: "Five colorful parrots are sitting together on a branch. A loud thunderclap scares them, and 2 parrots fly away. How many parrots are left sitting on the branch?",
    type: "multiple-choice",
    options: [
      "0 parrots",
      "3 parrots",
      "5 parrots",
      "2 parrots"
    ],
    correctAnswer: "0 parrots",
    hints: [
      "If you were sitting on a branch with friends and a super loud scary sound happened, what would you do?",
      "If 2 of the birds fly away because they are scared, what do the other 3 do?"
    ],
    explanation: "If a loud scary sound occurs, all the parrots will be frightened and fly away, leaving 0 parrots on the branch!"
  },
  {
    id: "d5_q3",
    day: 5,
    number: 3,
    title: "Unicorn Sky",
    category: "Creative Crafting",
    theme: "Unicorns",
    difficulty: "Easy",
    coinsReward: 10,
    question: "Draw a magical sky scene containing a bright rainbow arching over a fluffy white cloud!",
    type: "drawing",
    options: [],
    correctAnswer: "A drawing of a rainbow and cloud.",
    referenceSvg: `<svg viewBox="0 0 100 100" width="120" height="120" fill="none"><path d="M15,70 A40,40 0 0,1 85,70" stroke="#ff5252" stroke-width="8" /><path d="M22,70 A30,30 0 0,1 78,70" stroke="#ffeb3b" stroke-width="8" /><path d="M29,70 A20,20 0 0,1 71,70" stroke="#2196f3" stroke-width="8" /><path d="M10,75 C5,75 5,65 15,65 C15,55 30,55 35,63 C40,55 55,60 50,75 Z" fill="white" stroke="#e0e0e0" stroke-width="2" /><path d="M50,75 C45,75 45,65 55,65 C55,55 70,55 75,63 C80,55 95,60 90,75 Z" fill="white" stroke="#e0e0e0" stroke-width="2" /></svg>`,
    hints: [
      "Choose red, yellow, and blue colors to draw a curved rainbow arch.",
      "Draw a bubbly cloud shape at the bottom of the rainbow!"
    ],
    explanation: "Magic is in the air! What a beautiful sky painting."
  },
  {
    id: "d5_q4",
    day: 5,
    number: 4,
    title: "Butterfly Magic Card",
    category: "Logical Thinking",
    theme: "Butterflies",
    difficulty: "Hard",
    coinsReward: 30,
    question: "In a craft game, there is a card with a picture on it. If you flip it once, the picture changes: a Butterfly changes into a Flower. If you flip a Flower card, it changes back into a Butterfly. If you start with a Butterfly card and flip it exactly 101 times, what picture will be showing?",
    type: "multiple-choice",
    options: [
      "A Flower",
      "A Butterfly",
      "A Caterpillar",
      "An Empty Card"
    ],
    correctAnswer: "A Flower",
    hints: [
      "Start with Butterfly. 1st flip = Flower. 2nd flip = Butterfly. 3rd flip = Flower.",
      "Notice that odd flips (1, 3, 5...) show the Flower, and even flips (2, 4, 6...) show the Butterfly. Is 101 odd or even?"
    ],
    explanation: "Every odd-numbered flip (1, 3, 5, ..., 101) turns the card into a Flower. Every even-numbered flip turns it back into a Butterfly. Since 101 is an odd number, the showing picture will be a Flower."
  },
  {
    id: "d5_q5",
    day: 5,
    number: 5,
    title: "Creases of a Boat",
    category: "Logical Thinking",
    theme: "Arts & Crafts",
    difficulty: "Easy",
    coinsReward: 10,
    question: "To make an origami paper boat, you fold a square paper many times. If you take a finished paper boat and unfold it completely flat again, what will you see on the paper?",
    type: "multiple-choice",
    options: [
      "A grid pattern of crease lines",
      "A colored drawing of a boat",
      "A shredded piece of paper",
      "A completely smooth paper with no marks"
    ],
    correctAnswer: "A grid pattern of crease lines",
    hints: [
      "Folding paper presses lines into it. What are those lines called?",
      "The paper doesn't print images on itself just by folding, nor does it shred unless you tear it."
    ],
    explanation: "Folding paper leaves permanent indentations called crease lines. Unfolding it flat reveals a beautiful geometric map of all the folds you made!"
  }
];

// Procedural Generator for Days 6 to 100 (Puzzles 26 to 500)
// To keep the game dynamic and full of 100 days of content.
const THEMES = ["Cats", "Dogs", "Unicorns", "Raptors", "T-Rex", "Birds", "Butterflies", "Arts & Crafts"];
const CATEGORIES = ["Logical Thinking", "Lateral Thinking", "Pattern Match", "Spatial Logic", "Math Riddle"];

function generatePuzzlesForDays6To100() {
  const generated = [];
  let puzzleIndex = 26;

  for (let day = 6; day <= 100; day++) {
    for (let num = 1; num <= 5; num++) {
      const theme = THEMES[(day + num) % THEMES.length];
      const category = CATEGORIES[(day * num) % CATEGORIES.length];
      const difficulty = num === 5 ? "Hard" : (num >= 3 ? "Medium" : "Easy");
      const coins = difficulty === "Easy" ? 10 : (difficulty === "Medium" ? 20 : 30);
      const id = `d${day}_q${num}`;

      let question = "";
      let options = [];
      let correctAnswer = "";
      let type = "multiple-choice";
      let hints = [];
      let explanation = "";
      let referenceSvg = "";

      // We generate variations based on combinations
      if (num === 3) {
        // Let's generate a drawing puzzle for slot 3 of each day, to keep creative tasks regular
        type = "drawing";
        question = `Draw something fun for today! Theme: ${theme}. Prompt: Create a beautiful sketch of ${getDrawingSubject(theme)}.`;
        correctAnswer = `A drawing related to ${theme}.`;
        referenceSvg = getThemeReferenceSvg(theme);
        hints = [
          `Pick your favorite colors and draw a lovely ${theme} themed picture!`,
          "Think about what shapes make up this object or animal."
        ];
        explanation = `Parent verification puzzle. That is a wonderful drawing of a ${theme} subject!`;
      } else if (num === 2 || num === 5) {
        // Numeric/text riddle
        type = "text-input";
        const riddle = getTextRiddle(day, num, theme);
        question = riddle.question;
        correctAnswer = riddle.answer;
        options = [];
        hints = riddle.hints;
        explanation = riddle.explanation;
      } else {
        // Multiple choice logic
        type = "multiple-choice";
        const mc = getMCRiddle(day, num, theme);
        question = mc.question;
        options = mc.options;
        correctAnswer = mc.answer;
        hints = mc.hints;
        explanation = mc.explanation;
      }

      generated.push({
        id,
        day,
        number: num,
        title: `${theme} Quest: Part ${num}`,
        category,
        theme,
        difficulty,
        coinsReward: coins,
        question,
        type,
        options,
        correctAnswer,
        referenceSvg,
        hints,
        explanation
      });

      puzzleIndex++;
    }
  }

  return generated;
}

function getDrawingSubject(theme) {
  switch (theme) {
    case "Cats": return "a cozy cat sleeping on a fluffy cushion";
    case "Dogs": return "a puppy playing fetch with a bright red ball";
    case "Unicorns": return "a happy unicorn jumping over a sparkling cloud";
    case "Raptors": return "a friendly raptor peek-a-booing out of a jungle fern";
    case "T-Rex": return "a baby T-Rex wearing a colorful party hat";
    case "Birds": return "two little colorful birds sitting on a flowery branch";
    case "Butterflies": return "a giant butterfly drinking nectar from a yellow flower";
    default: return "a nice origami paper heart with beautiful patterns";
  }
}

function getTextRiddle(day, num, theme) {
  const sum = (day + num) % 10 + 2;
  const product = sum * 2;

  if (theme === "Unicorns" || theme === "Cats" || theme === "Dogs") {
    return {
      question: `In a pet group, there are some animals. If you count ${product} ears in total, how many animals are there? (Type the number)`,
      answer: String(sum),
      hints: [
        "Each animal has exactly 2 ears.",
        `Divide the total number of ears (${product}) by 2.`
      ],
      explanation: `Since each animal has 2 ears, we divide the total ears (${product}) by 2, which gives us ${sum} animals.`
    };
  } else if (theme === "T-Rex" || theme === "Raptors") {
    return {
      question: `Rocky has a set of dinosaur cards. If he shares them equally with 3 friends, everyone (including Rocky) gets exactly ${sum} cards. How many cards does Rocky have in total? (Type the number)`,
      answer: String(sum * 4),
      hints: [
        "There are 4 people in total: Rocky and his 3 friends.",
        `Multiply ${sum} by 4.`
      ],
      explanation: `Rocky plus 3 friends makes 4 people. Since each person gets ${sum} cards, the total cards = 4 x ${sum} = ${sum * 4}.`
    };
  } else {
    return {
      question: `A craft box has red and blue buttons. There are ${sum} red buttons. The number of blue buttons is double the red buttons. What is the total number of buttons in the box? (Type the number)`,
      answer: String(sum + sum * 2),
      hints: [
        `First find the blue buttons: 2 x ${sum}.`,
        "Then add the red and blue buttons together."
      ],
      explanation: `Red buttons = ${sum}. Blue buttons = ${sum * 2}. Total buttons = ${sum} + ${sum * 2} = ${sum + sum * 2}.`
    };
  }
}

function getMCRiddle(day, num, theme) {
  const choices = ["Option A", "Option B", "Option C", "Option D"];
  
  if (theme === "Cats") {
    return {
      question: "Three cats are sitting in a row. Muffin is to the left of Biscuit. Mittens is to the right of Biscuit. Who is sitting in the middle?",
      options: ["Biscuit", "Muffin", "Mittens", "No one"],
      answer: "Biscuit",
      hints: ["Draw or visualize the cats. Muffin is on the left, Biscuit is in the middle of Muffin and someone else...", "Look at the order: Muffin -> Biscuit -> Mittens."],
      explanation: "Since Muffin is to the left of Biscuit and Mittens is to the right, Biscuit must be in the middle of them."
    };
  } else if (theme === "Dogs") {
    return {
      question: "If a dog hears a bell ring 3 times, it gets 1 treat. If the dog got 4 treats today, how many times did the bell ring?",
      options: ["12 times", "8 times", "3 times", "6 times"],
      answer: "12 times",
      hints: ["For 1 treat, it needs 3 rings. For 2 treats, it needs 6 rings.", "Multiply the number of treats (4) by the number of rings per treat (3)."],
      explanation: "4 treats x 3 rings per treat = 12 bell rings in total."
    };
  } else if (theme === "Unicorns") {
    return {
      question: "Unicorn Star has a magic horn that glows. It glows Blue for 10 minutes, then Purple for 10 minutes, then stops. If she starts the glow at 3:00 PM, what color will the horn be at 3:15 PM?",
      options: ["Purple", "Blue", "Not glowing", "Pink"],
      answer: "Purple",
      hints: ["From 3:00 to 3:10, it glows Blue.", "From 3:10 to 3:20, it glows Purple. What time is 3:15?"],
      explanation: "At 3:15 PM, it is in the second 10-minute window (3:10 to 3:20 PM), so the horn glows Purple."
    };
  } else if (theme === "T-Rex" || theme === "Raptors") {
    return {
      question: "A T-Rex is running. It takes 3 steps to cover 6 meters. How many meters does it cover in 1 step?",
      options: ["2 meters", "3 meters", "1 meter", "6 meters"],
      answer: "2 meters",
      hints: ["Divide the total distance (6 meters) by the number of steps (3).", "How many times does 3 go into 6?"],
      explanation: "6 meters divided by 3 steps = 2 meters per step."
    };
  } else if (theme === "Butterflies") {
    return {
      question: "A caterpillar climbs up a 5-meter wall. Every day it climbs up 2 meters, but every night it slides down 1 meter. How many days does it take to reach the top?",
      options: ["4 days", "5 days", "3 days", "2 days"],
      answer: "4 days",
      hints: [
        "Day 1: climbs to 2m, slips to 1m. Day 2: starts at 1m, climbs to 3m, slips to 2m.",
        "Day 3: starts at 2m, climbs to 4m, slips to 3m. What happens on Day 4 when it climbs 2m?"
      ],
      explanation: "On Day 3, it ends at 3m. On Day 4, it climbs 2 meters, reaching 5 meters (the top) during the day! Once it reaches the top, it doesn't slide down anymore. So it takes 4 days."
    };
  } else {
    return {
      question: "You want to make a paper chain link. Each strip of paper adds 8 cm to the length, but 2 cm is used for the glue overlap. How much length does each new strip add to the chain?",
      options: ["6 cm", "8 cm", "10 cm", "2 cm"],
      answer: "6 cm",
      hints: ["Subtract the glue overlap length from the strip's total length.", "8 cm minus 2 cm is..."],
      explanation: "8 cm strip - 2 cm glue overlap = 6 cm added to the chain length."
    };
  }
}

function getThemeReferenceSvg(theme) {
  switch (theme) {
    case "Cats":
      return `<svg viewBox="0 0 100 100" width="120" height="120" stroke="var(--primary-color)" stroke-width="3" fill="none"><circle cx="50" cy="55" r="30" /><polygon points="25,35 20,10 40,28" fill="var(--secondary-color)" /><polygon points="75,35 80,10 60,28" fill="var(--secondary-color)" /><circle cx="40" cy="50" r="3" fill="var(--primary-color)" /><circle cx="60" cy="50" r="3" fill="var(--primary-color)" /><polygon points="48,58 52,58 50,60" fill="var(--primary-color)" /><path d="M50,60 Q47,64 44,62 M50,60 Q53,64 56,62" /><line x1="20" y1="55" x2="5" y2="53" /><line x1="20" y1="58" x2="3" y2="58" /><line x1="20" y1="61" x2="5" y2="63" /><line x1="80" y1="55" x2="95" y2="53" /><line x1="80" y1="58" x2="97" y2="58" /><line x1="80" y1="61" x2="95" y2="63" /></svg>`;
    case "Dogs":
      return `<svg viewBox="0 0 100 100" width="120" height="120" fill="none" stroke="var(--primary-color)" stroke-width="3"><circle cx="50" cy="55" r="28" /><path d="M18,35 C15,20 30,15 32,32" fill="var(--secondary-color)" /><path d="M82,35 C85,20 70,15 68,32" fill="var(--secondary-color)" /><circle cx="40" cy="50" r="3" fill="var(--primary-color)" /><circle cx="60" cy="50" r="3" fill="var(--primary-color)" /><ellipse cx="50" cy="58" rx="4" ry="3" fill="var(--primary-color)" /><path d="M50,61 Q47,65 44,63 M50,61 Q53,65 56,63" /></svg>`;
    case "Unicorns":
      return `<svg viewBox="0 0 100 100" width="120" height="120" fill="none" stroke="var(--primary-color)" stroke-width="3"><path d="M20,80 Q40,80 50,55 Q55,42 50,30 Q45,22 55,20 L65,22 Q75,25 78,35 Q78,50 68,58 Q58,65 55,80 Z" fill="var(--secondary-color)" /><polygon points="52,22 75,5 58,16" fill="gold" stroke="darkgoldenrod" stroke-width="1" /><circle cx="65" cy="32" r="2.5" fill="black" /></svg>`;
    case "Raptors":
    case "T-Rex":
      return `<svg viewBox="0 0 100 100" width="120" height="120" fill="none" stroke="var(--primary-color)" stroke-width="3"><path d="M15,80 C30,78 40,68 40,55 Q40,40 55,35 H75 Q85,35 85,20 H65 Q50,22 45,30 Q35,35 30,50 C25,60 10,65 15,80 Z" fill="var(--secondary-color)" /><circle cx="75" cy="27" r="2" fill="black" /></svg>`;
    case "Birds":
      return `<svg viewBox="0 0 100 100" width="120" height="120" fill="none" stroke="var(--primary-color)" stroke-width="3"><path d="M25,65 Q35,68 45,55 Q55,40 68,40 Q78,40 82,30 Q80,48 70,55 C60,62 45,63 35,75 Z" fill="var(--secondary-color)" /><circle cx="75" cy="35" r="2" fill="black" /><polygon points="82,30 88,32 82,35" fill="orange" /></svg>`;
    case "Butterflies":
      return `<svg viewBox="0 0 100 100" width="120" height="120" fill="var(--primary-color)"><path d="M50,30 C45,15 20,10 15,30 C12,42 22,55 45,55 C48,55 49,52 50,50 C51,52 52,55 55,55 C78,55 88,42 85,30 C80,10 55,15 50,30 Z M50,50 C45,62 25,65 20,75 C15,82 25,90 45,78 C48,76 49,72 50,70 C51,72 52,76 55,78 C75,90 85,82 80,75 C75,65 55,62 50,50 Z" /><rect x="48" y="20" width="4" height="60" rx="2" fill="var(--accent-text)" /><path d="M48,22 Q40,12 36,15" stroke="var(--accent-text)" stroke-width="2" fill="none" /><path d="M52,22 Q60,12 64,15" stroke="var(--accent-text)" stroke-width="2" fill="none" /></svg>`;
    default:
      return `<svg viewBox="0 0 100 100" width="120" height="120" fill="var(--accent-color)" stroke="var(--primary-color)" stroke-width="3"><path d="M50,30 C50,15 15,10 15,35 C15,55 50,85 50,85 C50,85 85,55 85,35 C85,10 50,15 50,30 Z" /><line x1="50" y1="30" x2="50" y2="85" stroke="var(--white)" stroke-width="2" stroke-dasharray="3,3" /></svg>`;
  }
}

// Export combined puzzles
export const PUZZLES = [
  ...HAND_CRAFTED_PUZZLES,
  ...generatePuzzlesForDays6To100()
];

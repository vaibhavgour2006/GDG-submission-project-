import { Checkpoint, Question, EventConfig, BranchOption } from '../types/game';

export const DEFAULT_BRANCHES: BranchOption[] = [
  'Computer Science and Business Systems',
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electronics and Instrumentation',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other'
];

export const TECHNICAL_WRONG_JOKES = [
  "Access denied! Your answer failed to compile.",
  "Bhai, itna confidence aur output galat?",
  "Wrong output. Please update your brain's firmware.",
  "Shabash! Compiler bhi tumse explanation maang raha hai.",
  "Request rejected. Your logic is currently under maintenance.",
  "Interesting answer. Confidence toh hai, bas logic vacation par hai.",
  "Ye logic dekh ke compiler ne sick leave maang li.",
  "Error 404: Correct logic not found in your cache.",
  "StackOverflow won't save you from this syntax error!",
  "Logic exception caught. Try clearing your browser and brain cookies."
];

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  id: "iet-davv-orientation-2026",
  eventName: "Campus Quest: The GDG Application Key",
  collegeName: "Institute of Engineering and Technology, DAVV, Indore",
  status: "active",
  mode: "individual",
  defaultLives: 3,
  pointsPerStage: 100,
  timeBonusPoints: 30,
  radiusBoostMeters: 25,
  radiusBoostDurationSec: 60,
  applicationUrl: "https://gdg.community.dev/events/details/developer-student-clubs-iet-davv-indore/",
  adminPasscode: "GDG2026ADMIN",
  secretFinalKey: "GDG-IET-DAVV-QUEST-2026-KEY",
  keyAssemblyOrder: ["GDG-", "IET-", "DAVV-", "QUEST-", "2026-KEY"]
};

// Configurable checkpoints for IET DAVV Indore campus
export const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  {
    id: "checkpoint_1",
    stageNumber: 1,
    name: "The Gatekeeper",
    shortLocation: "Main College Gate, IET DAVV",
    characterName: "Ramesh Bhaiya",
    characterRole: "Campus Security Officer & Senior Logic Validator",
    characterAvatar: "👮‍♂️",
    latitude: 22.680800,
    longitude: 75.879000,
    radiusMeters: 30,
    active: true,
    introDialogue: [
      { speaker: "GUARD", text: "Ruko, fresher! Kahan ja rahe ho bina ID scan ke?" },
      { speaker: "PLAYER", text: "Sir, main first year ka student hoon. GDG quest join karne aaya hoon!" },
      { speaker: "GUARD", text: "Achha? Toh pehle prove karo ki tumhe pata bhi hai tum aaye kahan ho. College ka naam tak nahi pata hua toh seedha recursion loop mein bhej dunga." }
    ],
    successDialogue: {
      speaker: "GUARD",
      text: "Verification successful. Ab tum officially thode kam suspicious ho. Pehla code fragment tumhara hua!"
    },
    failureDialogue: {
      speaker: "GUARD",
      text: "Security alert! Fresher detected with insufficient debugging skills. Gate pass revoked!"
    },
    fragmentText: "GDG-",
    fragmentName: "Fragment 1 of 5 (Security Token)",
    fragmentCode: "GDG-"
  },
  {
    id: "checkpoint_2",
    stageNumber: 2,
    name: "The Professor",
    shortLocation: "M Block, Faculty Corridor",
    characterName: "Dr. A. Sharma",
    characterRole: "Professor of Computing & Logic Stress-Tester",
    characterAvatar: "👨‍🏫",
    latitude: 22.681600,
    longitude: 75.879800,
    radiusMeters: 30,
    active: true,
    introDialogue: [
      { speaker: "PROFESSOR", text: "Achha, tum first year mein ho. Sabse pehle batao, tumhari branch kya hai?" },
      { speaker: "PLAYER", text: "Sir, branch select kar li hai. Ready for the challenge!" },
      { speaker: "PROFESSOR", text: "Bahut badhiya. Dekhte hain tumhare concepts kitne sound hain. Basic engineering aur programming questions ka test hoga!" }
    ],
    successDialogue: {
      speaker: "PROFESSOR",
      text: "Academic clearance granted! Tumhari conceptual understanding solid hai. Ab jao library mein kisi senior se milo."
    },
    failureDialogue: {
      speaker: "PROFESSOR",
      text: "Let's try again later. Pehle apni logic ko revise karo. Gatekeeper bhaiya se milke aao!"
    },
    fragmentText: "IET-",
    fragmentName: "Fragment 2 of 5 (Academic Sigil)",
    fragmentCode: "IET-"
  },
  {
    id: "checkpoint_3",
    stageNumber: 3,
    name: "The Senior Student",
    shortLocation: "Central Library Entrance",
    characterName: "Priya Didi",
    characterRole: "Final Year Senior & GDG Lead Mentor",
    characterAvatar: "👩‍💻",
    latitude: 22.681100,
    longitude: 75.880400,
    radiusMeters: 30,
    active: true,
    introDialogue: [
      { speaker: "SENIOR", text: "Freshers library mein padhne aaye ho ya koi secret mission chal raha hai?" },
      { speaker: "PLAYER", text: "Actually, mujhe GDG application unlock karna hai!" },
      { speaker: "SENIOR", text: "GDG application? Interesting! Pehle kuch real campus knowledge aur culture test karte hain. Canteen se lekar community tak sab pata hona chahiye!" }
    ],
    successDialogue: {
      speaker: "SENIOR",
      text: "Toh tum sach mein GDG join karne aaye ho! M Block ke third floor par computer lab mein ek GDG member milega. Usse baat karo!"
    },
    failureDialogue: {
      speaker: "SENIOR",
      text: "Lagta hai abhi campus life explore karni bachi hai! Samosa khao aur dobara try karo."
    },
    fragmentText: "DAVV-",
    fragmentName: "Fragment 3 of 5 (Culture Emblem)",
    fragmentCode: "DAVV-"
  },
  {
    id: "checkpoint_4",
    stageNumber: 4,
    name: "The GDG Member",
    shortLocation: "M Block, 3rd Floor Computer Lab",
    characterName: "Kabir",
    characterRole: "GDG Core Team Member & Git Aficionado",
    characterAvatar: "🧑‍💻",
    latitude: 22.681700,
    longitude: 75.880000,
    radiusMeters: 30,
    active: true,
    introDialogue: [
      { speaker: "GDG MEMBER", text: "Hey, fresher! Toh tum GDG join karna chahte ho?" },
      { speaker: "PLAYER", text: "Haan, bilkul! I want to learn, build, and contribute!" },
      { speaker: "GDG MEMBER", text: "Nice! Pehle batao, GDG aur developer communities ke baare mein kya jaante ho? Git, collaboration, aur developer mindset ka test!" }
    ],
    successDialogue: {
      speaker: "GDG MEMBER",
      text: "Nice! Tumhari curiosity production-ready lag rahi hai. Ab final level bacha hai: CSE Block mein GDG Head se milo!"
    },
    failureDialogue: {
      speaker: "GDG MEMBER",
      text: "Don't worry, fresher. Every developer starts somewhere. Debugging your knowledge is part of the job!"
    },
    fragmentText: "QUEST-",
    fragmentName: "Fragment 4 of 5 (Dev Cipher)",
    fragmentCode: "QUEST-"
  },
  {
    id: "checkpoint_5",
    stageNumber: 5,
    name: "The GDG Head",
    shortLocation: "CSE Block, Innovation Hall",
    characterName: "Ananya",
    characterRole: "GDG Campus Lead & Community Architect",
    characterAvatar: "🚀",
    latitude: 22.682300,
    longitude: 75.881200,
    radiusMeters: 30,
    active: true,
    introDialogue: [
      { speaker: "GDG HEAD", text: "So, you made it all the way here. Ready for the final level?" },
      { speaker: "PLAYER", text: "Ready!" },
      { speaker: "GDG HEAD", text: "Relax. No advanced DSA, no machine learning exam. Bas programming ki foundational concepts aur coding logic check karenge!" }
    ],
    successDialogue: {
      speaker: "GDG HEAD",
      text: "ACCESS GRANTED! You have conquered all five campus trials and earned the final GDG Key Fragment!"
    },
    failureDialogue: {
      speaker: "GDG HEAD",
      text: "Compilation failed, but your developer career is not over. Take a deep breath and give it another shot!"
    },
    fragmentText: "2026-KEY",
    fragmentName: "Fragment 5 of 5 (Master Application Key)",
    fragmentCode: "2026-KEY"
  }
];

export const DEFAULT_QUESTIONS: Question[] = [
  // ===================== STAGE 1: GATEKEEPER =====================
  {
    id: "q_1_1",
    stageNumber: 1,
    questionNumber: 1,
    prompt: "What is the full official name of our premier engineering institute?",
    options: [
      { id: "opt_a", text: "Institute of Engineering and Technology, Devi Ahilya Vishwavidyalaya" },
      { id: "opt_b", text: "Indore Engineering Tribe & Data Analytics Venture" },
      { id: "opt_c", text: "Indian Educational Technology & Digital Audio Village" },
      { id: "opt_d", text: "International Engineering Terminal, Division of Advanced Vectors" },
      { id: "opt_e", text: "Indore Electrical Training Center for Autonomous Vehicles" }
    ],
    correctAnswerId: "opt_a",
    hint: "Think of DAVV's official engineering faculty on Khandwa Road.",
    explanation: "IET DAVV stands for Institute of Engineering and Technology, Devi Ahilya Vishwavidyalaya."
  },
  {
    id: "q_1_2",
    stageNumber: 1,
    questionNumber: 2,
    prompt: "In which year was IET DAVV established as the engineering arm of the university?",
    options: [
      { id: "opt_a", text: "1996" },
      { id: "opt_b", text: "1947" },
      { id: "opt_c", text: "2008" },
      { id: "opt_d", text: "1982" },
      { id: "opt_e", text: "2020" }
    ],
    correctAnswerId: "opt_a",
    hint: "It was founded in the mid-90s, exactly 1996.",
    explanation: "IET DAVV was established in 1996 by Devi Ahilya Vishwavidyalaya."
  },
  {
    id: "q_1_3",
    stageNumber: 1,
    questionNumber: 3,
    prompt: "On which major artery/road of Indore is the main IET DAVV campus located?",
    options: [
      { id: "opt_a", text: "Khandwa Road" },
      { id: "opt_b", text: "Cybertron Highway" },
      { id: "opt_c", text: "Silicon Valley Boulevard" },
      { id: "opt_d", text: "Bhanwarkuan Flyover Rooftop" },
      { id: "opt_e", text: "Chhappan Dukan Food Street" }
    ],
    correctAnswerId: "opt_a",
    hint: "It shares the route with the university's Takshashila campus.",
    explanation: "IET DAVV is situated on Khandwa Road, Indore."
  },
  {
    id: "q_1_4",
    stageNumber: 1,
    questionNumber: 4,
    prompt: "In college academic lingo, what does 'CGPA' universally stand for?",
    options: [
      { id: "opt_a", text: "Cumulative Grade Point Average" },
      { id: "opt_b", text: "Chai, Gossip, PUBG & Attendance" },
      { id: "opt_c", text: "Continuous Gaming Protocol Algorithm" },
      { id: "opt_d", text: "College Graduate Pressure Accelerator" },
      { id: "opt_e", text: "Computer Graphics Pixel Analyzer" }
    ],
    correctAnswerId: "opt_a",
    hint: "It reflects your cumulative academic grade points across semesters.",
    explanation: "CGPA means Cumulative Grade Point Average."
  },
  {
    id: "q_1_5",
    stageNumber: 1,
    questionNumber: 5,
    prompt: "What does 'debugging' actually mean in real-world engineering?",
    options: [
      { id: "opt_a", text: "Finding and fixing defects or errors in code." },
      { id: "opt_b", text: "Asking a mosquito to leave the computer lab politely." },
      { id: "opt_c", text: "Installing RGB lights until the bug gets scared." },
      { id: "opt_d", text: "Restarting the laptop until the universe apologizes." },
      { id: "opt_e", text: "Calling the compiler and asking it to solve your assignment." }
    ],
    correctAnswerId: "opt_a",
    hint: "It involves locating defects and resolving them.",
    explanation: "Debugging is the systematic process of finding and removing bugs/errors in code."
  },

  // ===================== STAGE 2: THE PROFESSOR =====================
  {
    id: "q_2_1",
    stageNumber: 2,
    questionNumber: 1,
    prompt: "What is the primary fundamental purpose of computer programming?",
    options: [
      { id: "opt_a", text: "Instructing computers to solve problems and automate processes." },
      { id: "opt_b", text: "Pressing keys loudly to intimidate nearby classmates." },
      { id: "opt_c", text: "Making fans spin at maximum velocity to cool the room." },
      { id: "opt_d", text: "Convincing your laptop that you know what you are doing." },
      { id: "opt_e", text: "Writing secret spells that only dark-mode terminals understand." }
    ],
    correctAnswerId: "opt_a",
    hint: "It is about giving step-by-step instructions to solve problems.",
    explanation: "Programming is providing instructions to computational systems to execute tasks."
  },
  {
    id: "q_2_2",
    stageNumber: 2,
    questionNumber: 2,
    prompt: "In programming, what is a 'variable'?",
    options: [
      { id: "opt_a", text: "A named storage location in memory that holds a value." },
      { id: "opt_b", text: "A student who changes their mind about attending class." },
      { id: "opt_c", text: "A hardware resistor that fluctuates with campus temperature." },
      { id: "opt_d", text: "A magical spell that randomly mutates into a semicolon." },
      { id: "opt_e", text: "A folder that automatically deletes itself on assignment deadlines." }
    ],
    correctAnswerId: "opt_a",
    hint: "It holds data that can be referenced and modified.",
    explanation: "A variable is a symbolic container associated with an allocated memory address."
  },
  {
    id: "q_2_3",
    stageNumber: 2,
    questionNumber: 3,
    prompt: "In Python, what is the exact function of the print() statement?",
    options: [
      { id: "opt_a", text: "Displays specified text or evaluated output to the console." },
      { id: "opt_b", text: "Sends physical paper printouts to the nearest college printer." },
      { id: "opt_c", text: "Reads secret keystrokes from the professor's computer." },
      { id: "opt_d", text: "Draws pixel art on the GPU framebuffer." },
      { id: "opt_e", text: "Cleans the dust off your laptop screen." }
    ],
    correctAnswerId: "opt_a",
    hint: "It writes data to stdout (the terminal screen).",
    explanation: "print() outputs formatted representations of objects to the standard output stream."
  },
  {
    id: "q_2_4",
    stageNumber: 2,
    questionNumber: 4,
    prompt: "Why is systematic debugging an essential engineering skill?",
    options: [
      { id: "opt_a", text: "It isolates root causes rather than making blind guesses." },
      { id: "opt_b", text: "It lets you blame the operating system with official terminology." },
      { id: "opt_c", text: "It turns all red error logs into green text magically." },
      { id: "opt_d", text: "It automatically generates excuses for missed project reviews." },
      { id: "opt_e", text: "It increases keyboard lifespan by reducing typing speed." }
    ],
    correctAnswerId: "opt_a",
    hint: "Good debugging finds the root cause methodically.",
    explanation: "Systematic debugging isolates defects efficiently through testing hypotheses."
  },
  {
    id: "q_2_5",
    stageNumber: 2,
    questionNumber: 5,
    prompt: "Why do professional software engineers write automated tests for their code?",
    options: [
      { id: "opt_a", text: "To verify expected behavior and prevent regressions when updating code." },
      { id: "opt_b", text: "Because compilers get lonely without extra test files." },
      { id: "opt_c", text: "To prove to clients that code is 100% bug-free for eternity." },
      { id: "opt_d", text: "To increase file size and make repositories look huge." },
      { id: "opt_e", text: "To avoid drinking water during long coding sessions." }
    ],
    correctAnswerId: "opt_a",
    hint: "Tests verify correctness and ensure changes don't break existing functionality.",
    explanation: "Testing verifies software specifications and prevents regression defects."
  },

  // ===================== STAGE 3: THE SENIOR STUDENT =====================
  {
    id: "q_3_1",
    stageNumber: 3,
    questionNumber: 1,
    prompt: "How many core building blocks are featured in this GDG Campus Quest event?",
    options: [
      { id: "opt_a", text: "3 designated campus zones (M Block, Library, CSE Block)" },
      { id: "opt_b", text: "50 skyscrapers across Indore" },
      { id: "opt_c", text: "Only 1 single virtual zoom room" },
      { id: "opt_d", text: "10 underground quantum bunkers" },
      { id: "opt_e", text: "Zero, it takes place in the metaverse" }
    ],
    correctAnswerId: "opt_a",
    hint: "Think about the story locations: Main Gate/M Block, Library, and CSE Block.",
    explanation: "The quest connects M Block, Library, and CSE Block across the campus."
  },
  {
    id: "q_3_2",
    stageNumber: 3,
    questionNumber: 2,
    prompt: "What is the legendary student-friendly price of a piping hot samosa at the canteen?",
    options: [
      { id: "opt_a", text: "₹15 (standard campus fuel)" },
      { id: "opt_b", text: "₹500 (plus 18% GST)" },
      { id: "opt_c", text: "Free if you solve a LeetCode hard problem" },
      { id: "opt_d", text: "1 Bitcoin per bite" },
      { id: "opt_e", text: "Paid in Git pull requests only" }
    ],
    correctAnswerId: "opt_a",
    hint: "Affordable and classic Indore campus rate around ₹15.",
    explanation: "Campus canteen samosas are typically priced around ₹15."
  },
  {
    id: "q_3_3",
    stageNumber: 3,
    questionNumber: 3,
    prompt: "How many interactive technical workshop tracks does GDG typically organize?",
    options: [
      { id: "opt_a", text: "Multiple specialized tracks (Web, Cloud, Android, AI/ML)" },
      { id: "opt_b", text: "Only typewriter maintenance" },
      { id: "opt_c", text: "None, only theoretical lectures on chalkboards" },
      { id: "opt_d", text: "Exactly 100 simultaneous daily hackathons" },
      { id: "opt_e", text: "Secret training for space missions only" }
    ],
    correctAnswerId: "opt_a",
    hint: "GDG covers domains like Web, Cloud, Mobile, and AI.",
    explanation: "GDG offers hands-on tracks covering Cloud, Web, Android, AI, and DevOps."
  },
  {
    id: "q_3_4",
    stageNumber: 3,
    questionNumber: 4,
    prompt: "Where can students find verified announcements and RSVP for upcoming GDG events?",
    options: [
      { id: "opt_a", text: "The official GDG community platform page and student community channels." },
      { id: "opt_b", text: "Carrier pigeons sent from the library terrace." },
      { id: "opt_c", text: "Telepathic vibrations during math lectures." },
      { id: "opt_d", text: "Carved into the bark of campus neem trees." },
      { id: "opt_e", text: "Encrypted radio signals on AM 1440 kHz." }
    ],
    correctAnswerId: "opt_a",
    hint: "Check the official GDG Community page and community groups.",
    explanation: "Events are listed on gdg.community.dev and official student community channels."
  },
  {
    id: "q_3_5",
    stageNumber: 3,
    questionNumber: 5,
    prompt: "Fresher, why are you currently undertaking this thrilling campus quest?",
    options: [
      { id: "opt_a", text: "I am here to complete the GDG quest and unlock the GDG application." },
      { id: "opt_b", text: "I came here because someone mentioned free samosas." },
      { id: "opt_c", text: "I am actively avoiding an assignment deadline." },
      { id: "opt_d", text: "I accidentally followed a glowing GPS marker." },
      { id: "opt_e", text: "I heard the library has a secret 120 FPS gaming server." }
    ],
    correctAnswerId: "opt_a",
    hint: "Your mission is the GDG application key!",
    explanation: "Unlocking the GDG application key is the ultimate objective of this quest."
  },

  // ===================== STAGE 4: THE GDG MEMBER =====================
  {
    id: "q_4_1",
    stageNumber: 4,
    questionNumber: 1,
    prompt: "What is the primary mission of Google Developer Groups (GDG) on campus?",
    options: [
      { id: "opt_a", text: "To learn, build, collaborate, and grow tech skills in an inclusive community." },
      { id: "opt_b", text: "To replace all human teachers with automated shell scripts." },
      { id: "opt_c", text: "To win international monopoly tournaments." },
      { id: "opt_d", text: "To enforce dark mode on every phone by law." },
      { id: "opt_e", text: "To turn all college assignments into memes." }
    ],
    correctAnswerId: "opt_a",
    hint: "Developer communities foster peer learning and real-world collaboration.",
    explanation: "GDG empowers developers through peer learning, workshops, and community projects."
  },
  {
    id: "q_4_2",
    stageNumber: 4,
    questionNumber: 2,
    prompt: "What is Git primarily used for in modern software engineering?",
    options: [
      { id: "opt_a", text: "Distributed version control and tracking changes in source code." },
      { id: "opt_b", text: "Downloading free RAM into your graphics card." },
      { id: "opt_c", text: "Generating automated apologies when bugs reach production." },
      { id: "opt_d", text: "A social media platform for arguing about code indentation." },
      { id: "opt_e", text: "Testing how fast you can type 'git push --force'." }
    ],
    correctAnswerId: "opt_a",
    hint: "It tracks history, branches, and merges changes.",
    explanation: "Git is a distributed version control system designed to handle projects with speed."
  },
  {
    id: "q_4_3",
    stageNumber: 4,
    questionNumber: 3,
    prompt: "Why is open-source collaboration considered a superpower for junior developers?",
    options: [
      { id: "opt_a", text: "It provides real code reviews, community mentorship, and portfolio impact." },
      { id: "opt_b", text: "It lets you copy code without understanding how it works." },
      { id: "opt_c", text: "It guarantees an instant job offer after 1 pull request." },
      { id: "opt_d", text: "It makes your terminal font turn gold." },
      { id: "opt_e", text: "It exempts you from taking college exams." }
    ],
    correctAnswerId: "opt_a",
    hint: "Working with others sharpens code quality and architectural insight.",
    explanation: "Open source allows learning from experienced peers and contributing to real systems."
  },
  {
    id: "q_4_4",
    stageNumber: 4,
    questionNumber: 4,
    prompt: "What makes hands-on technical workshops more effective than passive video watching?",
    options: [
      { id: "opt_a", text: "Active coding builds muscle memory and real debugging problem-solving." },
      { id: "opt_b", text: "You get free stickers, which boosts processing speed." },
      { id: "opt_c", text: "You can fall asleep while pretending to type." },
      { id: "opt_d", text: "Workshop chairs are scientifically proven to increase IQ." },
      { id: "opt_e", text: "Videos don't have enough dramatic sound effects." }
    ],
    correctAnswerId: "opt_a",
    hint: "Building and breaking things hands-on leads to real understanding.",
    explanation: "Experiential learning and debugging build genuine problem-solving capabilities."
  },
  {
    id: "q_4_5",
    stageNumber: 4,
    questionNumber: 5,
    prompt: "When you get stuck on a difficult programming bug, what should you do first?",
    options: [
      { id: "opt_a", text: "Read error logs, isolate the failing piece, and consult docs or peers." },
      { id: "opt_b", text: "Push directly to production and pray to the cloud gods." },
      { id: "opt_c", text: "Rename the bug and officially call it an undocumented feature." },
      { id: "opt_d", text: "Blame the compiler and throw your laptop into the fountain." },
      { id: "opt_e", text: "Add 100 lines of console.log('here') without reading any of them." }
    ],
    correctAnswerId: "opt_a",
    hint: "Isolate the issue and analyze the stack trace carefully.",
    explanation: "Careful diagnosis, reading stack traces, and consulting documentation solves bugs."
  },

  // ===================== STAGE 5: THE GDG HEAD =====================
  {
    id: "q_5_1",
    stageNumber: 5,
    questionNumber: 1,
    prompt: "Which of the following Python statements correctly prints 'Hello, World!'?",
    options: [
      { id: "opt_a", text: "print(\"Hello, World!\")" },
      { id: "opt_b", text: "echo(\"Hello, World!\")" },
      { id: "opt_c", text: "console.log(\"Hello, World!\")" },
      { id: "opt_d", text: "show Hello, World!" },
      { id: "opt_e", text: "display = world" }
    ],
    correctAnswerId: "opt_a",
    hint: "Python 3 uses the print() function with parentheses.",
    explanation: "In Python 3, print(\"Hello, World!\") is the valid syntax."
  },
  {
    id: "q_5_2",
    stageNumber: 5,
    questionNumber: 2,
    prompt: "What is a 'variable' in computer programming?",
    options: [
      { id: "opt_a", text: "A named reference used to store or refer to a value in memory." },
      { id: "opt_b", text: "A computer cooling fan that changes speed." },
      { id: "opt_c", text: "A folder that deletes itself every morning." },
      { id: "opt_d", text: "A fatal programming crash." },
      { id: "opt_e", text: "A keyboard shortcut for eating samosas." }
    ],
    correctAnswerId: "opt_a",
    hint: "It stores and references values in your program.",
    explanation: "A variable is an identifier bound to a memory location storing a value."
  },
  {
    id: "q_5_3",
    stageNumber: 5,
    questionNumber: 3,
    prompt: "In programming data types, what is a 'string'?",
    options: [
      { id: "opt_a", text: "An ordered sequence of characters, usually enclosed in quotes." },
      { id: "opt_b", text: "A physical nylon thread holding the motherboard together." },
      { id: "opt_c", text: "A musical chord played by your CPU speaker." },
      { id: "opt_d", text: "A mathematical number that cannot have decimals." },
      { id: "opt_e", text: "A wire connecting the mouse to the wall socket." }
    ],
    correctAnswerId: "opt_a",
    hint: "Text such as \"hello\" or 'GDG' is represented as a string.",
    explanation: "A string is a primitive/composite data type representing textual data."
  },
  {
    id: "q_5_4",
    stageNumber: 5,
    questionNumber: 4,
    prompt: "What does a 'conditional statement' (such as if/else) do in code?",
    options: [
      { id: "opt_a", text: "Executes different blocks of code depending on whether a condition is true or false." },
      { id: "opt_b", text: "Randomly chooses an answer when the developer is undecided." },
      { id: "opt_c", text: "Forces the computer to ask permission before turning on." },
      { id: "opt_d", text: "Deletes code that was written after midnight." },
      { id: "opt_e", text: "Slows down code execution during hot weather." }
    ],
    correctAnswerId: "opt_a",
    hint: "It controls branching logic based on boolean evaluation.",
    explanation: "Conditionals allow branching execution paths based on boolean evaluations."
  },
  {
    id: "q_5_5",
    stageNumber: 5,
    questionNumber: 5,
    prompt: "What is the exact output of this code snippet?\n\nx = 2\ny = 3\nprint(x + y)",
    options: [
      { id: "opt_a", text: "5" },
      { id: "opt_b", text: "\"23\"" },
      { id: "opt_c", text: "Error: Math module not imported" },
      { id: "opt_d", text: "6" },
      { id: "opt_e", text: "None" }
    ],
    correctAnswerId: "opt_a",
    hint: "x and y are integers; 2 + 3 equals 5.",
    explanation: "2 and 3 are integer literals. The addition operator computes 2 + 3 = 5."
  }
];

// Special final motivation question asked by GDG Head after completing stage 5
export const FINAL_MOTIVATION_QUESTION = {
  prompt: "Why do you want to join GDG?",
  options: [
    { id: "m_1", text: "No, I don't want to. I just wanted to play the game." },
    { id: "m_2", text: "I want to be good at programming." },
    { id: "m_3", text: "I want to learn more." },
    { id: "m_4", text: "I want to build something cool." },
    { id: "m_5", text: "I want more!" }
  ],
  responses: {
    m_1: "Fair enough! You completed the quest with true gamer energy. The developer side quest remains unlocked whenever you're ready!",
    m_2: "Excellent. Every expert developer was once a beginner staring at a blank editor. GDG is the perfect launchpad!",
    m_3: "Curiosity detected! Lifelong learning is the number one trait of great engineers. Your learning journey has officially started.",
    m_4: "Now we're talking! Ideas are exciting, but turning them into working products with a team is even better.",
    m_5: "MORE? More projects, more learning, more debugging, more hackathons? Now THAT is true developer energy!"
  }
};

# Campus Quest: The GDG Application Key

**A Real-World GPS-Linked, Story-Driven Campus Adventure Web Game for First-Year Engineering Students at IET DAVV, Indore.**

Built for orientation, induction, and recruitment for **Google Developer Groups (GDG) On-Campus** at the **Institute of Engineering and Technology, Devi Ahilya Vishwavidyalaya (IET DAVV)**, Khandwa Road, Indore, Madhya Pradesh.

---

## 1. Executive Summary & Game Concept

**Campus Quest** transforms the physical campus of IET DAVV into an interactive RPG-style treasure hunt. Freshers navigate campus landmarks using GPS-enabled geofencing, converse with distinct college NPCs (Non-Player Characters) rendered in a retro Pokémon/RPG dialogue frame, solve timed technical & campus culture challenges, collect cryptographic code fragments, assemble the virtual golden key, and unlock the official GDG recruitment application.

### Key Highlights
- **100% Web-Based (Zero Native App Store Friction)**: Runs natively in any mobile browser over HTTPS with full PWA (Progressive Web App) offline caching and home screen install capability.
- **Real-Time GPS & Haversine Geofencing**: Real-time position tracking with custom Leaflet dark/satellite tiles, dynamic geofence radius checks, and an integrated GPS Simulator for indoor/demo testing.
- **Dynamic Fog of War**: Checkpoints whose tasks have not yet appeared are hidden from the map; cleared checkpoints shrink, fade, and turn slate grey.
- **Smooth Cinematic Zoom-to-Marker**: Interactive task list with Leaflet `flyTo` camera curves (1.5s easing) and tactile CSS focus-bounce animations.
- **Dual-Timer Progressive Hardening Engine**: Per-question countdowns and character-specific quiz time limits with adaptive speed adjustments.
- **Safeguard Hearts & Total Wipeout Mechanics**: 3 hearts protect players from a complete reset. Losing all 3 hearts wipes stage progression and resets the entire game back to Stage 1 (The Gatekeeper).
- **Timeout Breaks & "Arre tum fir aa gaye?!" Comebacks**: Failing on timeout locks the character on a 10-second chai/class break with disabled map markers and unique witty comeback dialogue upon return.
- **Confetti & Procedural Audio**: Native Web Audio API synthesizer for retro Game Boy style sound effects and `canvas-confetti` celebrations.

- Quick play link https://ai.studio/apps/5541714b-abf2-41da-9946-506fda53a821

---

## 2. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Browser (PWA)                          │
├────────────────────────────────────────────────────────────────────────┤
│  UI Framework: React 19 + TypeScript (Strict Type Safety)             │
│  Styling Engine: Tailwind CSS v4 + Lucide React Icons                  │
│  Map Visualization: Leaflet.js (CARTO Dark Matter, OSM, Satellite)     │
│  Particle Engine: Canvas-Confetti (Custom stage celebration bursts)   │
│  Sound Synthesizer: Native Web Audio API (Zero external MP3 assets)   │
├────────────────────────────────────────────────────────────────────────┤
│                            Client State Layer                          │
│  • Participant Session (Roll number, lives, score, fragments, cooldowns)│
│  • Dual-Timer State (Question countdown + Stage budget countdown)      │
│  • Device Sensors (Geolocation API + DeviceOrientation Compass API)    │
├────────────────────────────────────────────────────────────────────────┤
│                           Data & Storage Layer                         │
│  • Local Persistence: LocalStorage (Offline instant sync)             │
│  • Cloud Database: Google Firebase Cloud Firestore (Live Leaderboard) │
│  • Hosting & CDN: Firebase Hosting (HTTP/2 Edge Cached)                │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Tech Stack Specifications
| Component | Technology | Rationale |
|---|---|---|
| **Core Framework** | React 19 + TypeScript | Component modularity, reactive state hooks, strict compiler safety |
| **Styling** | Tailwind CSS v4 (`@import "tailwindcss"`) | Zero runtime overhead, responsive utility styling, dark aesthetic |
| **Maps & Tiles** | Leaflet 1.9 + CARTO Dark Matter / ESRI Satellite | High-performance interactive geospatial rendering |
| **Geolocation** | HTML5 Geolocation API + Haversine Formula | High-accuracy GPS distance calculation and boundary detection |
| **Compass** | Web `DeviceOrientationEvent` API | Hardware compass heading & target azimuth bearing tracking |
| **Sound Synthesis** | Web Audio API (`AudioContext`) | Zero latency, procedural 8-bit blips, chimes, and fail buzzers |
| **FX & Celebration** | `canvas-confetti` | High-FPS canvas-based particle bursts on stage completions |
| **Database** | Firebase Firestore | Real-time participant state sync and live campus leaderboard |
| **PWA & Offline** | Service Worker (`sw.js`) + Manifest (`manifest.json`) | Installable on iOS/Android home screens; offline asset caching |

---

## 3. Game Story & The 5 Checkpoints

| Stage | Checkpoint | Campus Location | NPC Character & Role | Challenge Focus | Fragment |
|:---:|---|---|---|---|:---:|
| **1** | **The Gatekeeper** | Main College Entrance Gate | **Ramesh Bhaiya** (Security Officer & Logic Validator) | IET DAVV history (Est. 1996), campus layout, debugging concepts | `GDG-` (Token 1) |
| **2** | **The Professor** | M Block Faculty Corridor | **Dr. A. Sharma** (Computing & Logic Stress-Tester) | Algorithmic thinking, data types, unit testing, binary search | `IET-` (Sigil 2) |
| **3** | **The Senior** | Central Library Entrance | **Priya Didi** (Placement Mentor & Campus Guide) | Department blocks, canteen economics (₹15 samosa), campus culture | `DAVV-` (Emblem 3) |
| **4** | **The GDG Member** | M Block 3rd Floor Lab | **Kabir** (Core Developer & Git Aficionado) | Version control, Git branching, open source collaboration, APIs | `QUEST-` (Cipher 4) |
| **5** | **The GDG Head** | CSE Block Innovation Hall | **Ananya** (Campus Lead & Community Architect) | Code compilation logic + Narrative Motivation Question | `2026-KEY` (Master Key) |

---

## 4. Gameplay Engine & Mechanics

### 4.1 Fog of War & Progressive Map Discovery
- **Stealth Initialization**: Only Stage 1 (**Ramesh Bhaiya**, The Gatekeeper) is visible when the game begins.
- **Sequential Unlocking**: Subsequent characters remain completely hidden from the map until their respective predecessor stage is passed.
- **Completed Checkpoint State**: Once claimed, completed checkpoint circles shrink to **35% of their original radius** (min 8m), fade in opacity (`0.35`), turn muted slate grey (`#64748b`), and display a checkmark badge (`✓`).

### 4.2 Smooth Zoom-to-Marker Animation (`flyTo`)
- Tapping any checkpoint in the compact Task List triggers a Leaflet `flyTo` camera animation (`duration: 1.5s`, `zoom: 18.5`, `easeLinearity: 0.25`).
- The target DOM marker plays a custom `.marker-focus-bounce` CSS keyframe animation (`translateY(-16px)` with cyan glow drop-shadow) and presents a top HUD notification displaying live GPS distance.

### 4.3 Dual-Timer Progressive Hardening Engine
Every stage features two concurrent countdown timers:
1. **Per-Question Countdown**: Starts at a base allocation and decreases on higher stages.
2. **Total Stage Quiz Budget**: An overall countdown for all 5 questions that tightens progressively:
   - **Stage 1 (Guard)**: 80 seconds total budget
   - **Stage 2 (Professor)**: 70 seconds total budget
   - **Stage 3 (Senior)**: 60 seconds total budget
   - **Stage 4 (GDG Member)**: 50 seconds total budget
   - **Stage 5 (GDG Head)**: 40 seconds total budget
3. **Adaptive Pace Modifier**: Answering quickly awards a **+2s speed bonus** for the next question; sluggish answers tighten the timer by **-2s**.

### 4.4 Safeguard Hearts & The Total Wipeout Rule
- Players begin with **3 Hearts (Lives)** (`❤️ ❤️ ❤️`).
- Submitting an incorrect answer or letting a timer expire deducts **1 Life**.
- **Quiz Restart Requirement**: An incorrect answer locks advancement to the next question. The player must restart that character's quiz from Question 1.
- **The Safeguard Rule**: The 3 hearts act as shields protecting the player from losing overall quest progress.
- **Total Wipeout (0 Lives)**: If all 3 hearts are exhausted, the player suffers a total wipeout:
  - All collected fragments and completed stages are wiped.
  - The game resets back to **Stage 1 (The Gatekeeper)** with 3 fresh hearts.
  - The player is required to complete everything again from Ramesh Bhaiya at the Main Gate.

### 4.5 10-Second Character Timeout Cooldown & Map Disabling
When a quiz fails due to a timeout:
1. **Character-Specific Timeout Quote**:
   - **Guard**: *"You wasted my time! I want to go on my chai break. Chai thandi ho rahi hai meri canteen par!"*
   - **Professor**: *"You wasted my precious time! I want to go to my next class now. Come back when your logic is actually prepared!"*
   - **Senior Priya**: *"Arre yaar, pura placement prep ka time barbaad kar diya! I want to go to the canteen and library now!"*
   - **Member Kabir**: *"Server timed out waiting for your thoughts! I want to go to my GDG sprint sync meeting now!"*
   - **Lead Ananya**: *"The keynote auditorium doors are opening! I want to go to the stage now, no time for slow debuggers!"*
2. **10-Second Disabling on Map**:
   - The character marker switches to an amber badge (`☕ ON BREAK (00:0Xs)`).
   - The character is styled with a disabled cursor (`cursor: not-allowed`) and amber ring.
   - Tapping the marker plays an error sound, triggers a tactile shake, and presents a map notice preventing entry.
   - The HUD `ENTER` button is replaced with a locked `ON BREAK` status.
3. **"Arre tum fir aa gaye?!" Comeback Dialogues**:
   - Re-engaging the character once the 10-second break expires plays a character-specific witty comeback line (e.g., *"Arre tum fir aa gaye?! Abhi toh ek ghunt chai pi thi maine! Chalo jaldi batao ab, is baar mera time mat khana!"*) before presenting the quiz.

### 4.6 Master Key Assembly & GDG Application Unlock
- Once all 5 fragments are collected (`GDG-`, `IET-`, `DAVV-`, `QUEST-`, `2026-KEY`), players access the **Virtual Key Assembler**.
- Validating the key triggers high-volume celebratory confetti explosions (`canvas-confetti`) with retro fanfare synthesizers and unlocks the official Google Form application link.

---

## 5. Geospatial Mathematics (Haversine Formula)

Geofence detection calculates spherical great-circle distance between the user's live coordinates $(\phi_1, \lambda_1)$ and the checkpoint $(\phi_2, \lambda_2)$:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c \quad (R = 6,371,000 \text{ meters})$$

Effective geofence radius incorporates active player power-ups:

$$r_{\text{effective}} = r_{\text{base}} + r_{\text{boost}}$$

---

## 6. Project Directory Structure

```
├── .firebaserc                     # Firebase Project Target (gdg-quest-game)
├── firebase.json                   # Firebase Hosting & Firestore Rules Deployment
├── firestore.rules                 # Production Firestore Security Rules
├── index.html                      # HTML5 Shell with Leaflet & Google Fonts
├── manifest.json                   # Web App Manifest for PWA Installability
├── metadata.json                   # AI Studio Applet Specification
├── package.json                    # Dependencies & Scripts
├── public/
│   ├── sw.js                       # PWA Service Worker (Cache-first asset strategy)
│   └── favicon.svg                 # Application Vector Icon
├── src/
│   ├── main.tsx                    # React Root Entry & Service Worker Registration
│   ├── App.tsx                     # Main Game Controller & Orchestrator
│   ├── index.css                   # Tailwind CSS v4 & Custom Leaflet Animation Styles
│   ├── config/
│   │   ├── characterDialogues.ts   # Timeout quotes, comeback lines, cooldown constants
│   │   ├── defaultData.ts          # Default 5 checkpoints, 25 MCQs, hints, motivation Q
│   │   ├── firebase.ts             # Firebase Firestore initialization & fallback
│   │   └── mapConfig.ts            # Map layers (CARTO Dark Matter, OSM, ESRI Satellite)
│   ├── types/
│   │   └── game.ts                 # TypeScript types (Participant, Checkpoint, Question, etc.)
│   ├── services/
│   │   ├── geofenceService.ts      # Haversine distance, boundary checks, heading math
│   │   ├── soundEffects.ts         # Procedural Web Audio API sound synthesizer
│   │   └── storageService.ts       # Storage layer (Firestore sync + localStorage fallback)
│   ├── components/
│   │   ├── CampusMap.tsx           # Leaflet map, GPS simulator, tasks list, geo compass
│   │   ├── DialogueModal.tsx       # RPG typewriter conversation frame & scolding scene
│   │   ├── QuizModal.tsx           # 5-question rectangular challenge box, dual timers, fail HUD
│   │   ├── VirtualKeyAssembler.tsx # Master key assembly, confetti, application unlock
│   │   ├── FragmentInventory.tsx   # 5-slot persistent inventory bar
│   │   ├── CheckpointCard.tsx      # Checkpoint navigation card & cooldown status
│   │   ├── PowerUpBar.tsx          # Hint Reveal, Radius Boost (+25m), Time Bonus (+30pts)
│   │   ├── RollNumberScreen.tsx    # Registration screen with demo profiles & branch selector
│   │   ├── Navbar.tsx              # Top HUD (Hearts, score, audio toggle, admin link)
│   │   ├── LeaderboardModal.tsx    # Live real-time participant ranking board
│   │   ├── TeamModal.tsx           # Squad creation & invite code join flow
│   │   ├── HowToPlayModal.tsx      # Rules, safety, and campus orientation guidelines
│   │   └── AdminDashboard.tsx      # Organizer console (Passcode: GDG2026ADMIN)
│   └── tests/
│       └── runTests.ts             # Automated unit and integration test suite
└── tsconfig.json
```

---

## 7. Data Models & TypeScript Interfaces

```typescript
export interface Participant {
  id: string;
  rollNumber: string;
  displayName: string;
  branch: BranchOption;
  teamId?: string;
  currentStage: number;              // 1 to 5
  currentQuestionIndex: number;
  lives: number;                     // 0 to 3 safeguard hearts
  score: number;
  completedStages: number[];         // Array of completed stage numbers
  collectedFragments: string[];      // Array of unlocked key tokens
  powerUps: {
    hint_reveal: number;
    radius_boost: number;
    time_bonus: number;
  };
  characterCooldowns?: Record<string, number>;      // checkpointId -> epoch ms
  characterTimeoutFailures?: Record<string, boolean>; // checkpointId -> boolean
  hasValidatedFinalKey: boolean;
  isGatekeeperScolding?: boolean;
  joinedAt: number;
  lastActiveAt: number;
}

export interface Checkpoint {
  id: string;
  stageNumber: number;
  name: string;
  shortLocation: string;
  characterName: string;
  characterRole: string;
  characterAvatar: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  fragmentKeyName: string;
  introDialogue: DialogueLine[];
  failureDialogue: DialogueLine;
}
```

---

## 8. Installation & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Commands
```bash
# 1. Clone repository
git clone https://github.com/tellstoryaihindi/campus-quest-gdg-davv.git
cd campus-quest-gdg-davv

# 2. Install dependencies
npm install

# 3. Run automated test suite
npm test

# 4. Start local development server (Port 3000)
npm run dev

# 5. Type-check / Lint
npm run lint

# 6. Build optimized production bundle
npm run build
```

---

## 9. Organizer & Administrator Console

Click **Organizer** in the top navigation bar.
- **Default Master Passcode**: `GDG2026ADMIN`

### Admin Capabilities
1. **Live Checkpoint Tuning**: Reposition any checkpoint latitude, longitude, and geofence radius on the fly without redeploying code.
2. **Question Management**: Edit all 25 questions, modify choices, assign correct answer IDs, and write customized clues.
3. **Event Rules**: Toggle between Individual and Squad modes, adjust default lives, and tweak stage time budgets.
4. **Application Link**: Update the Google Form / RSVP link that is revealed upon validating the Master Key.
5. **Publish Verification**: Runs an automated 5-point sanity audit verifying valid GPS coordinates, single-correct-answer options, and active target links.

---

## 10. Security & Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;

      match /checkpoints/{checkpointId} {
        allow read: if true;
        allow write: if request.auth != null;
      }

      match /questions/{questionId} {
        allow read: if true;
        allow write: if request.auth != null;
      }

      match /participants/{participantId} {
        allow read, write: if true;
      }

      match /teams/{teamId} {
        allow read, write: if true;
      }

      match /leaderboard/{entry} {
        allow read, write: if true;
      }
    }
  }
}
```

---

## 11. Testing & Verification

Automated test suites can be executed via `npm test`:
- **Haversine Geofencing Tests**: Verifies boundary calculations at sub-meter precision.
- **Fog of War Tests**: Verifies subsequent checkpoint visibility suppression.
- **Heart Loss & Wipeout Tests**: Validates that 3 life losses trigger complete progression reset to Stage 1.
- **Cooldown Tests**: Asserts that 10s cooldown locks re-entry and activates comeback dialogue.
- **Key Assembler Tests**: Verifies ordering validation for the 5-part cryptographic key.

---

## 12. License & Attribution

Developed with ❤️ for the student community of **IET DAVV, Indore** by **GDG On-Campus Core Team**.
Distributed under the MIT License.

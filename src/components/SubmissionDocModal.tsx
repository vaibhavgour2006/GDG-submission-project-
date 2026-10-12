import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Play, 
  Trophy, 
  KeyRound 
} from 'lucide-react';

interface SubmissionDocModalProps {
  appUrl: string;
  onClose: () => void;
}

export const SubmissionDocModal: React.FC<SubmissionDocModalProps> = ({ appUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const downloadZipUrl = `${appUrl}/campus-quest-davv-repo.zip`;

  const docMarkdown = `# Task 3 Submission: Campus Quest — Geofenced Clue Hunt
**Project Title:** Campus Quest: The GDG Application Key  
**Target Institution:** Institute of Engineering and Technology, Devi Ahilya Vishwavidyalaya (IET DAVV), Indore  
**Live Deployed Prototype URL:** ${appUrl}  
**Repository ZIP Download:** ${downloadZipUrl}  

---

## 1. Executive Summary & Core Requirements Matrix

| Core Requirement | Implementation in Campus Quest | Verification Status |
|---|---|---|
| **1. Web App / PWA with Geolocation** | Browser Geolocation API + Leaflet.js with dark OSM map tiles, PWA manifest, and offline service worker. | **Fully Functional** |
| **2. At least 5 Geofenced Checkpoints** | 5 real IET DAVV stations (Main Gate, M Block, Library, 3rd Fl Lab, CSE Block) with 30m geofences calculated via Haversine formula. | **Fully Functional** |
| **3. Clue & Power-Up System** | 5 code fragments, 3 lives/stage, compiler humor, Hint Reveal, Radius Boost (+25m for 60s), and Time Bonus (+30 pts). | **Fully Functional** |
| **4. Teams or Individual Players & Live Leaderboard** | Support for personal roll numbers or team squads with invite codes, backed by persistent Firestore leaderboard. | **Fully Functional** |
| **5. Organizer Admin Controls** | Passcode-protected console (passcode: GDG2026ADMIN) to edit coordinates, geofences, 25 MCQs, dialogue, and app URL. | **Fully Functional** |

---

## 2. Technical Architecture

### Frontend & Geolocation Engine
- **Framework**: React 19, TypeScript, Tailwind CSS v4, Lucide icons, Canvas Confetti.
- **Geofencing**: Haversine great-circle distance algorithm calculates the real-time distance between player \`(lat, lon)\` and checkpoint \`(cpLat, cpLon)\`.
- **GPS Testing Simulator**: A built-in simulator allows testing and demonstration anywhere without physical travel.

### Backend & Real-Time Sync
- **Firebase Firestore**: Stores event configurations, checkpoints, participant scores, and team progress.
- **Security Rules**: Authoritative validation prevents score manipulation and unauthorized writes.

---

## 3. The 5 Campus Checkpoints & Story Narrative

1. **Stage 1: The Gatekeeper (Main College Gate)**
   - Character: Ramesh Bhaiya (Campus Security Officer)
   - Topic: IET DAVV history (Est. 1996), Khandwa Road location, debugging basics.
   - Reward: Fragment 1 of 5 (\`GDG-\`).

2. **Stage 2: The Professor (M Block)**
   - Character: Dr. A. Sharma (Computing Faculty)
   - Topic: Programming concepts, variables, Python print(), automated testing.
   - Story Consequence: Failing Stage 2 returns player to Gatekeeper scolding scene with retry option; Stage 1 fragment is preserved.
   - Reward: Fragment 2 of 5 (\`IET-\`).

3. **Stage 3: The Senior Student (Central Library)**
   - Character: Priya Didi (Lead Mentor)
   - Topic: Campus zones, canteen samosa economics (₹15), workshop tracks.
   - Reward: Fragment 3 of 5 (\`DAVV-\`).

4. **Stage 4: The GDG Member (3rd Floor Computer Lab, M Block)**
   - Character: Kabir (Core Developer)
   - Topic: Git version control, open source collaboration, error logs.
   - Reward: Fragment 4 of 5 (\`QUEST-\`).

5. **Stage 5: The GDG Head (CSE Block)**
   - Character: Ananya (GDG Campus Lead)
   - Topic: Python syntax, code snippet output reasoning, and narrative motivation question.
   - Reward: Fragment 5 of 5 (\`2026-KEY\`).

---

## 4. The Power-Up System
- **Hint Reveal**: Consumes 1 charge to reveal an insightful clue for the active quiz question.
- **Radius Boost**: Temporarily increases geofence allowance by +25 meters for 60 seconds with live countdown timer.
- **Time Bonus**: Grants an instant +30 score points bonus.

---

## 5. Prototype Video Demonstration Script
1. Open the game in mobile or desktop browser.
2. Enter roll number (e.g. 24CS101) or click 1-Click Demo identity.
3. Observe player radar marker on the IET DAVV campus map.
4. Move within 30m or click "Teleport Here" simulator button.
5. Interact with Gatekeeper, answer questions, demonstrate wrong answer compiler humor.
6. Progress through M Block, Library, Computer Lab, and CSE Block.
7. Assemble all 5 fragments on the Virtual Golden Key.
8. Validate key to unlock the official GDG Application Form.
9. Open the Admin Dashboard (passcode: GDG2026ADMIN) and edit a checkpoint.
`;

  const handleCopyMarkdown = () => {
    sounds.playClick();
    navigator.clipboard.writeText(docMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-cyan-950/80 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-2xl shadow-md">
              📄
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Task 3: Google Docs Solution Guide & Repository</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ready-to-submit documentation & offline repository archive
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Download & Submission Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 shrink-0">
          {/* Download Zip CTA */}
          <a
            href="/campus-quest-davv-repo.zip"
            download="campus-quest-davv-repo.zip"
            onClick={() => sounds.playCorrect()}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>DOWNLOAD COMPLETE REPOSITORY (.ZIP)</span>
          </a>

          {/* Copy to Google Docs CTA */}
          <button
            onClick={handleCopyMarkdown}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>COPY FOR GOOGLE DOCS</span>
              </>
            )}
          </button>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-4 font-sans leading-relaxed">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-cyan-900/40 space-y-2">
            <div className="text-base font-extrabold text-white">
              Task 3: Campus Quest — Geofenced Clue Hunt
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <strong className="text-cyan-400">Prototype URL:</strong>{' '}
                <a href={appUrl} target="_blank" rel="noreferrer" className="text-slate-300 underline font-mono text-[11px] truncate block">
                  {appUrl}
                </a>
              </div>
              <div>
                <strong className="text-cyan-400">Repo Zip Download:</strong>{' '}
                <a href="/campus-quest-davv-repo.zip" download className="text-slate-300 underline font-mono text-[11px] truncate block">
                  /campus-quest-davv-repo.zip
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1 mb-2">
              1. Core Task Coverage
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
              <li><strong>Web App & PWA:</strong> Built on React 19, Leaflet.js, and browser Geolocation API with service worker.</li>
              <li><strong>5 Geofenced Checkpoints:</strong> Main Gate, M Block, Library, 3rd Fl Lab, and CSE Block with 30m Haversine radius.</li>
              <li><strong>Clue & Power-Up System:</strong> 5 secret fragments, 3 lives/stage, Hint Reveal, Radius Boost (+25m for 60s), Time Bonus (+30 pts).</li>
              <li><strong>Teams & Live Leaderboard:</strong> Roll number identity, squad codes, and real-time Firestore rankings.</li>
              <li><strong>Organizer Controls:</strong> Admin console (passcode: <code>GDG2026ADMIN</code>) to edit coordinates, questions, and forms.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1 mb-2">
              2. How to Open in Google Docs
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs">
              <li>Click the <strong>"COPY FOR GOOGLE DOCS"</strong> button above.</li>
              <li>Open a blank document at <a href="https://docs.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">docs.google.com</a>.</li>
              <li>Paste (Ctrl+V / Cmd+V) to get formatted headings, tables, and submission links.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>The repository ZIP includes all source files, configurations, and tests.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

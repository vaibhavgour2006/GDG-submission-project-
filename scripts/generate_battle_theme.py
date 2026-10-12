import math
import struct
import wave
import subprocess
import os

# Generates the iconic Pokémon Game Boy Trainer Battle theme
# (plays right when the trainer challenges you / quiz starts)
SAMPLE_RATE = 44100
BPM = 160.0
BEAT = 60.0 / BPM          # ~0.375s
EIGHTH = BEAT / 2.0        # ~0.1875s
SIXTEENTH = BEAT / 4.0     # ~0.09375s
TRIPLET_16 = BEAT / 6.0    # ~0.0625s

def note_freq(name):
    if not name or name in ('_', 'REST', 'R'):
        return 0.0
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    n_part = name[:-1].upper()
    octave = int(name[-1])
    # Handle flat enharmonics
    flat_map = {'BB': 'A#', 'EB': 'D#', 'AB': 'G#', 'DB': 'C#', 'GB': 'F#'}
    if n_part in flat_map:
        n_part = flat_map[n_part]
    idx = notes.index(n_part)
    n = idx + (octave - 4) * 12 - 9
    return 440.0 * (2.0 ** (n / 12.0))

class AudioTrack:
    def __init__(self):
        self.events = [] # (time, duration, freq, volume, duty, wave_type)
        self.current_time = 0.0

    def rest(self, dur):
        self.current_time += dur

    def note(self, name, dur, gate=0.88, vol=0.6, duty=0.5, wave_type='pulse'):
        f = note_freq(name) if isinstance(name, str) else float(name)
        if f > 0:
            self.events.append((self.current_time, dur * gate, f, vol, duty, wave_type))
        self.current_time += dur

    def slide(self, start_f, end_f, dur, gate=0.95, vol=0.6, duty=0.5):
        # Glissando / slide
        steps = 16
        step_dur = dur / steps
        for i in range(steps):
            t_ratio = i / (steps - 1)
            f = start_f * (end_f / start_f) ** t_ratio
            self.events.append((self.current_time + i * step_dur, step_dur * gate, f, vol, duty, 'pulse'))
        self.current_time += dur

lead = AudioTrack()
harmony = AudioTrack()
bass = AudioTrack()
noise = AudioTrack()

# ==============================================================
# INTRO: The dramatic Trainer Battle encounter screech and arpeggios
# ==============================================================
# Iconic descending rapid trill / high screech
lead.slide(note_freq('B6'), note_freq('B4'), BEAT * 1.5, gate=0.98, vol=0.6, duty=0.5)
harmony.slide(note_freq('G6'), note_freq('G4'), BEAT * 1.5, gate=0.98, vol=0.45, duty=0.25)
bass.rest(BEAT * 1.5)

# Fast intro fanfare build-up:
# F#4, G4, G#4, A4, A#4, B4, C5, C#5, D5, D#5, E5, F5, F#5, G5, G#5, A5
intro_scale = ['F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5']
for n in intro_scale:
    lead.note(n, SIXTEENTH * 0.5, gate=0.9, vol=0.65, duty=0.5)
    harmony.note(n, SIXTEENTH * 0.5, gate=0.8, vol=0.4, duty=0.25)
    bass.note('D3', SIXTEENTH * 0.5, gate=0.7, vol=0.5, duty=0.5, wave_type='triangle')

# Staccato dramatic hits: B5 - A#5 - A5 - G#5
for hit in ['B5', 'A#5', 'A5', 'G#5']:
    lead.note(hit, SIXTEENTH, gate=0.7, vol=0.7, duty=0.5)
    harmony.note(hit, SIXTEENTH, gate=0.7, vol=0.45, duty=0.25)
    bass.note('E3', SIXTEENTH, gate=0.7, vol=0.6, wave_type='triangle')

lead.note('G5', EIGHTH, gate=0.85, vol=0.7, duty=0.5)
lead.note('F#5', EIGHTH, gate=0.85, vol=0.7, duty=0.5)
harmony.note('E5', EIGHTH, gate=0.85, vol=0.5, duty=0.25)
harmony.note('D#5', EIGHTH, gate=0.85, vol=0.5, duty=0.25)
bass.note('G2', EIGHTH, gate=0.8, vol=0.6, wave_type='triangle')
bass.note('F#2', EIGHTH, gate=0.8, vol=0.6, wave_type='triangle')

lead.rest(BEAT * 0.5)
harmony.rest(BEAT * 0.5)
bass.rest(BEAT * 0.5)

# ==============================================================
# MAIN BATTLE LOOP (Section A & Section B)
# Fast, pulsing 16th-note driving chiptune battle rhythm
# ==============================================================
def add_bass_driving_measure(root_note, high_note):
    # Driving 16th note bass: Root, high, Root, high...
    for _ in range(4):
        bass.note(root_note, SIXTEENTH, gate=0.75, vol=0.65, wave_type='triangle')
        bass.note(high_note, SIXTEENTH, gate=0.7, vol=0.55, wave_type='triangle')

def add_battle_riff():
    # Measure 1: D minor driving battle motif
    # Lead: D4, F4, G4, G#4, A4, C5, D5, C5, A4, G4, F4, D4
    lead.note('D4', SIXTEENTH, gate=0.8, vol=0.6, duty=0.5)
    lead.note('F4', SIXTEENTH, gate=0.8, vol=0.6, duty=0.5)
    lead.note('G4', SIXTEENTH, gate=0.8, vol=0.6, duty=0.5)
    lead.note('G#4', SIXTEENTH, gate=0.8, vol=0.65, duty=0.5)
    lead.note('A4', SIXTEENTH, gate=0.85, vol=0.7, duty=0.5)
    lead.note('C5', SIXTEENTH, gate=0.85, vol=0.7, duty=0.5)
    lead.note('D5', EIGHTH, gate=0.9, vol=0.75, duty=0.5)
    lead.note('C5', SIXTEENTH, gate=0.8, vol=0.65, duty=0.5)
    lead.note('A4', SIXTEENTH, gate=0.8, vol=0.65, duty=0.5)
    lead.note('F4', SIXTEENTH, gate=0.8, vol=0.6, duty=0.5)
    lead.note('D4', SIXTEENTH, gate=0.8, vol=0.6, duty=0.5)

    harmony.note('A3', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('D4', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('E4', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('F4', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('F#4', SIXTEENTH, gate=0.8, vol=0.5, duty=0.25)
    harmony.note('A4', SIXTEENTH, gate=0.8, vol=0.5, duty=0.25)
    harmony.note('B4', EIGHTH, gate=0.85, vol=0.55, duty=0.25)
    harmony.note('A4', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('F#4', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('D4', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)
    harmony.note('A3', SIXTEENTH, gate=0.75, vol=0.45, duty=0.25)

    add_bass_driving_measure('D3', 'D4')

    # Measure 2: Accent hits & chromatic descent
    lead.note('D5', SIXTEENTH, gate=0.75, vol=0.7, duty=0.5)
    lead.note('C#5', SIXTEENTH, gate=0.75, vol=0.68, duty=0.5)
    lead.note('C5', SIXTEENTH, gate=0.75, vol=0.65, duty=0.5)
    lead.note('B4', SIXTEENTH, gate=0.75, vol=0.65, duty=0.5)
    lead.note('A#4', SIXTEENTH, gate=0.8, vol=0.7, duty=0.5)
    lead.note('A4', SIXTEENTH, gate=0.8, vol=0.7, duty=0.5)
    lead.note('G4', EIGHTH, gate=0.85, vol=0.75, duty=0.5)
    lead.note('A4', EIGHTH, gate=0.85, vol=0.75, duty=0.5)
    lead.note('D5', EIGHTH, gate=0.9, vol=0.8, duty=0.5)

    harmony.note('B4', SIXTEENTH, gate=0.75, vol=0.5, duty=0.25)
    harmony.note('A#4', SIXTEENTH, gate=0.75, vol=0.5, duty=0.25)
    harmony.note('A4', SIXTEENTH, gate=0.75, vol=0.48, duty=0.25)
    harmony.note('G#4', SIXTEENTH, gate=0.75, vol=0.48, duty=0.25)
    harmony.note('G4', SIXTEENTH, gate=0.8, vol=0.52, duty=0.25)
    harmony.note('F#4', SIXTEENTH, gate=0.8, vol=0.52, duty=0.25)
    harmony.note('E4', EIGHTH, gate=0.85, vol=0.55, duty=0.25)
    harmony.note('F#4', EIGHTH, gate=0.85, vol=0.55, duty=0.25)
    harmony.note('A4', EIGHTH, gate=0.9, vol=0.6, duty=0.25)

    add_bass_driving_measure('C3', 'C4')

    # Measure 3: Counter-melody high punch
    lead.note('F5', EIGHTH, gate=0.85, vol=0.75, duty=0.5)
    lead.note('E5', SIXTEENTH, gate=0.8, vol=0.7, duty=0.5)
    lead.note('D5', SIXTEENTH, gate=0.8, vol=0.7, duty=0.5)
    lead.note('C#5', EIGHTH, gate=0.85, vol=0.7, duty=0.5)
    lead.note('D5', EIGHTH, gate=0.85, vol=0.75, duty=0.5)
    lead.note('E5', SIXTEENTH, gate=0.8, vol=0.7, duty=0.5)
    lead.note('F5', SIXTEENTH, gate=0.8, vol=0.75, duty=0.5)
    lead.note('G5', SIXTEENTH, gate=0.8, vol=0.75, duty=0.5)
    lead.note('A5', SIXTEENTH, gate=0.85, vol=0.8, duty=0.5)

    harmony.note('D5', EIGHTH, gate=0.85, vol=0.55, duty=0.25)
    harmony.note('C#5', SIXTEENTH, gate=0.8, vol=0.5, duty=0.25)
    harmony.note('B4', SIXTEENTH, gate=0.8, vol=0.5, duty=0.25)
    harmony.note('A#4', EIGHTH, gate=0.85, vol=0.5, duty=0.25)
    harmony.note('B4', EIGHTH, gate=0.85, vol=0.55, duty=0.25)
    harmony.note('C#5', SIXTEENTH, gate=0.8, vol=0.5, duty=0.25)
    harmony.note('D5', SIXTEENTH, gate=0.8, vol=0.55, duty=0.25)
    harmony.note('E5', SIXTEENTH, gate=0.8, vol=0.55, duty=0.25)
    harmony.note('F#5', SIXTEENTH, gate=0.85, vol=0.6, duty=0.25)

    add_bass_driving_measure('Bb2', 'Bb3')

    # Measure 4: Big turnaround cadence
    lead.note('A5', EIGHTH, gate=0.8, vol=0.8, duty=0.5)
    lead.note('G5', EIGHTH, gate=0.8, vol=0.75, duty=0.5)
    lead.note('F5', EIGHTH, gate=0.8, vol=0.7, duty=0.5)
    lead.note('E5', EIGHTH, gate=0.8, vol=0.65, duty=0.5)
    lead.note('D5', BEAT, gate=0.9, vol=0.75, duty=0.5)

    harmony.note('F#5', EIGHTH, gate=0.8, vol=0.6, duty=0.25)
    harmony.note('E5', EIGHTH, gate=0.8, vol=0.55, duty=0.25)
    harmony.note('D5', EIGHTH, gate=0.8, vol=0.5, duty=0.25)
    harmony.note('C#5', EIGHTH, gate=0.8, vol=0.48, duty=0.25)
    harmony.note('B4', BEAT, gate=0.9, vol=0.55, duty=0.25)

    add_bass_driving_measure('A2', 'A3')

# Repeat the battle loop twice for an awesome energetic loop (~24 seconds)
add_battle_riff()
add_battle_riff()

# Total duration calculation
total_duration = max(lead.current_time, harmony.current_time, bass.current_time)
print(f"Trainer Battle Music duration: {total_duration:.2f}s")

total_samples = int(total_duration * SAMPLE_RATE)
output_samples = [0.0] * total_samples

def render_track(track):
    for (start_t, dur, freq, vol, duty, w_type) in track.events:
        start_idx = int(start_t * SAMPLE_RATE)
        end_idx = min(int((start_t + dur) * SAMPLE_RATE), total_samples)
        sample_len = end_idx - start_idx
        if sample_len <= 0 or freq <= 0:
            continue

        for i in range(sample_len):
            t = i / SAMPLE_RATE
            phase = (t * freq) % 1.0

            # Retro Wave generation
            if w_type == 'triangle':
                # Triangle wave (Game Boy 4-bit wave channel)
                if phase < 0.5:
                    raw = 4.0 * phase - 1.0
                else:
                    raw = 3.0 - 4.0 * phase
                val = raw
            elif w_type == 'noise':
                # Noise channel
                val = ((math.sin(t * freq * 13.0) + math.sin(t * freq * 31.0)) % 2.0) - 1.0
            else: # pulse / square wave
                val = 1.0 if phase < duty else -1.0

            # Envelope: attack & slight decay
            attack_dur = 0.005
            rel_t = i / sample_len
            env = min(t / attack_dur, 1.0) * (1.0 - rel_t * 0.25)

            output_samples[start_idx + i] += val * vol * env * 0.26

render_track(lead)
render_track(harmony)
render_track(bass)

# Write to WAV
wav_path = 'public/audio/battle-theme.wav'
os.makedirs('public/audio', exist_ok=True)
with wave.open(wav_path, 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    for s in output_samples:
        # soft limiter / clamp
        clamped = max(-0.95, min(0.95, s))
        val_int = int(clamped * 32767.0)
        wf.writeframes(struct.pack('<h', val_int))

print(f"Generated WAV file at {wav_path}")

# Convert to MP3 using ffmpeg
mp3_path = 'public/audio/battle-theme.mp3'
try:
    subprocess.run(['ffmpeg', '-y', '-i', wav_path, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3_path], check=True)
    print(f"Successfully generated MP3 at {mp3_path}")
except Exception as e:
    print(f"ffmpeg conversion warning: {e}")

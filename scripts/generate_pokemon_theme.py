import math
import struct
import wave
import subprocess
import os

SAMPLE_RATE = 44100
BPM = 150
BEAT = 60.0 / BPM # ~0.4s
EIGHTH = BEAT / 2.0
SIXTEENTH = BEAT / 4.0

def note_freq(note_name):
    # e.g., C4, D#4, Gb4
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    flat_map = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'}
    if note_name == 'REST':
        return 0.0
    name = note_name[:-1]
    octave = int(note_name[-1])
    if name in flat_map:
        name = flat_map[name]
    idx = notes.index(name)
    # A4 is index 9 in octave 4 = 440 Hz
    semitones = (octave - 4) * 12 + (idx - 9)
    return 440.0 * (2.0 ** (semitones / 12.0))

# Game Boy sound generators
def square_wave(freq, t, duty=0.5):
    if freq <= 0:
        return 0.0
    phase = (freq * t) % 1.0
    return 1.0 if phase < duty else -1.0

def triangle_wave(freq, t):
    if freq <= 0:
        return 0.0
    phase = (freq * t) % 1.0
    # Game Boy 4-bit stepped triangle or smooth triangle
    return 2.0 * abs(2.0 * phase - 1.0) - 1.0

def noise_sample(seed):
    # Fast pseudo-random noise
    seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
    val = ((seed >> 16) & 0x7FFF) / 16384.0 - 1.0
    return val, seed

# Route 1 Melody sequence (note, duration_in_eighths)
lead_notes = [
    # Intro (2 bars)
    ('D4', 1), ('G4', 1), ('B4', 1), ('D5', 2), ('B4', 1), ('G4', 1), ('D4', 1),
    ('C5', 2), ('A4', 1), ('F#4', 1), ('D4', 4),

    # Part A (8 bars)
    ('G4', 2), ('G4', 1), ('A4', 1), ('B4', 2), ('B4', 1), ('C5', 1),
    ('D5', 2), ('D5', 1), ('C5', 1), ('B4', 2), ('A4', 2),
    ('G4', 2), ('G4', 1), ('A4', 1), ('B4', 2), ('G4', 2),
    ('A4', 4), ('D4', 2), ('F#4', 2),

    ('G4', 2), ('G4', 1), ('A4', 1), ('B4', 2), ('B4', 1), ('C5', 1),
    ('D5', 2), ('D5', 1), ('E5', 1), ('D5', 2), ('C5', 2),
    ('B4', 2), ('D5', 2), ('A4', 2), ('D5', 2),
    ('G4', 4), ('D5', 1), ('B4', 1), ('G4', 1), ('REST', 1),

    # Part B (8 bars)
    ('E5', 2), ('E5', 1), ('F#5', 1), ('G5', 2), ('G5', 1), ('F#5', 1),
    ('E5', 2), ('D5', 1), ('C5', 1), ('D5', 4),
    ('C5', 2), ('C5', 1), ('D5', 1), ('E5', 2), ('E5', 1), ('D5', 1),
    ('C5', 2), ('B4', 1), ('A4', 1), ('B4', 4),

    ('E5', 2), ('E5', 1), ('F#5', 1), ('G5', 2), ('G5', 1), ('F#5', 1),
    ('E5', 2), ('D5', 1), ('E5', 1), ('F#5', 4),
    ('G5', 2), ('D5', 2), ('B4', 2), ('A4', 2),
    ('G4', 6), ('REST', 2)
]

# Harmony sequence (Pulse 2)
harmony_notes = [
    # Intro
    ('B3', 1), ('D4', 1), ('G4', 1), ('B4', 2), ('G4', 1), ('D4', 1), ('B3', 1),
    ('A4', 2), ('F#4', 1), ('D4', 1), ('F#3', 4),

    # Part A
    ('D4', 2), ('D4', 1), ('F#4', 1), ('G4', 2), ('G4', 1), ('A4', 1),
    ('B4', 2), ('B4', 1), ('A4', 1), ('G4', 2), ('F#4', 2),
    ('D4', 2), ('D4', 1), ('F#4', 1), ('G4', 2), ('E4', 2),
    ('F#4', 4), ('A3', 2), ('D4', 2),

    ('D4', 2), ('D4', 1), ('F#4', 1), ('G4', 2), ('G4', 1), ('A4', 1),
    ('B4', 2), ('B4', 1), ('C5', 1), ('B4', 2), ('A4', 2),
    ('G4', 2), ('B4', 2), ('F#4', 2), ('A4', 2),
    ('D4', 4), ('B4', 1), ('G4', 1), ('D4', 1), ('REST', 1),

    # Part B
    ('C5', 2), ('C5', 1), ('D5', 1), ('E5', 2), ('E5', 1), ('D5', 1),
    ('C5', 2), ('B4', 1), ('A4', 1), ('B4', 4),
    ('A4', 2), ('A4', 1), ('B4', 1), ('C5', 2), ('C5', 1), ('B4', 1),
    ('A4', 2), ('G4', 1), ('F#4', 1), ('G4', 4),

    ('C5', 2), ('C5', 1), ('D5', 1), ('E5', 2), ('E5', 1), ('D5', 1),
    ('C5', 2), ('B4', 1), ('C5', 1), ('D5', 4),
    ('D5', 2), ('B4', 2), ('G4', 2), ('F#4', 2),
    ('D4', 6), ('REST', 2)
]

# Bassline sequence (Triangle)
bass_notes = [
    # Intro
    ('G3', 2), ('D3', 2), ('G3', 2), ('B2', 2),
    ('D3', 2), ('F#3', 2), ('D3', 4),

    # Part A
    ('G3', 2), ('D3', 2), ('G3', 2), ('D3', 2),
    ('G3', 2), ('D3', 2), ('D3', 2), ('F#3', 2),
    ('G3', 2), ('D3', 2), ('E3', 2), ('B2', 2),
    ('D3', 2), ('A2', 2), ('D3', 2), ('F#3', 2),

    ('G3', 2), ('D3', 2), ('G3', 2), ('D3', 2),
    ('G3', 2), ('D3', 2), ('A3', 2), ('D3', 2),
    ('G3', 2), ('E3', 2), ('D3', 2), ('F#3', 2),
    ('G3', 4), ('G3', 2), ('REST', 2),

    # Part B
    ('C3', 2), ('G3', 2), ('C3', 2), ('E3', 2),
    ('G3', 2), ('D3', 2), ('G3', 2), ('B2', 2),
    ('A2', 2), ('E3', 2), ('A2', 2), ('C3', 2),
    ('G3', 2), ('D3', 2), ('G3', 2), ('B2', 2),

    ('C3', 2), ('G3', 2), ('C3', 2), ('E3', 2),
    ('D3', 2), ('A2', 2), ('D3', 2), ('F#3', 2),
    ('G3', 2), ('B2', 2), ('D3', 2), ('D3', 2),
    ('G3', 4), ('G2', 2), ('REST', 2)
]

def render_track():
    total_eighths = sum(n[1] for n in lead_notes)
    total_seconds = total_eighths * EIGHTH
    total_samples = int(total_seconds * SAMPLE_RATE)
    print(f"Rendering {total_seconds:.2f} seconds ({total_samples} samples) of Pokémon Chiptune...")

    lead_events = []
    t_cursor = 0.0
    for note, dur_eighths in lead_notes:
        dur_sec = dur_eighths * EIGHTH
        freq = note_freq(note)
        lead_events.append((t_cursor, dur_sec, freq))
        t_cursor += dur_sec

    harmony_events = []
    t_cursor = 0.0
    for note, dur_eighths in harmony_notes:
        dur_sec = dur_eighths * EIGHTH
        freq = note_freq(note)
        harmony_events.append((t_cursor, dur_sec, freq))
        t_cursor += dur_sec

    bass_events = []
    t_cursor = 0.0
    for note, dur_eighths in bass_notes:
        dur_sec = dur_eighths * EIGHTH
        freq = note_freq(note)
        bass_events.append((t_cursor, dur_sec, freq))
        t_cursor += dur_sec

    samples = [0.0] * total_samples
    seed = 42

    lead_idx = 0
    harmony_idx = 0
    bass_idx = 0

    for i in range(total_samples):
        t = i / SAMPLE_RATE

        # Advance events
        while lead_idx < len(lead_events) - 1 and t >= lead_events[lead_idx][0] + lead_events[lead_idx][1]:
            lead_idx += 1
        while harmony_idx < len(harmony_events) - 1 and t >= harmony_events[harmony_idx][0] + harmony_events[harmony_idx][1]:
            harmony_idx += 1
        while bass_idx < len(bass_events) - 1 and t >= bass_events[bass_idx][0] + bass_events[bass_idx][1]:
            bass_idx += 1

        # Lead Channel (Square 50% duty with short release)
        l_start, l_dur, l_freq = lead_events[lead_idx]
        l_time = t - l_start
        l_amp = 0.0
        if l_freq > 0 and 0 <= l_time < l_dur:
            gate = 0.85 * l_dur
            if l_time < gate:
                env = 1.0 - 0.25 * (l_time / gate)
            else:
                env = 0.75 * (1.0 - (l_time - gate) / (l_dur - gate + 1e-6))
            l_amp = square_wave(l_freq, t, 0.5) * max(0.0, env) * 0.22

        # Harmony Channel (Square 25% duty)
        h_start, h_dur, h_freq = harmony_events[harmony_idx]
        h_time = t - h_start
        h_amp = 0.0
        if h_freq > 0 and 0 <= h_time < h_dur:
            gate = 0.80 * h_dur
            if h_time < gate:
                env = 1.0 - 0.3 * (h_time / gate)
            else:
                env = 0.7 * (1.0 - (h_time - gate) / (h_dur - gate + 1e-6))
            h_amp = square_wave(h_freq, t, 0.25) * max(0.0, env) * 0.14

        # Bass Channel (Triangle wave)
        b_start, b_dur, b_freq = bass_events[bass_idx]
        b_time = t - b_start
        b_amp = 0.0
        if b_freq > 0 and 0 <= b_time < b_dur:
            env = 1.0 - 0.15 * (b_time / b_dur)
            b_amp = triangle_wave(b_freq, t) * max(0.0, env) * 0.25

        # Drum / Noise channel: 8-bit hi-hat & snare
        beat_pos = (t / BEAT) % 1.0
        beat_idx = int(t / BEAT) % 4 # 0, 1, 2, 3
        drum_amp = 0.0
        if beat_idx in [1, 3] and beat_pos < 0.2: # Snare on 2 and 4
            noise_val, seed = noise_sample(seed)
            drum_amp = noise_val * (1.0 - beat_pos / 0.2) * 0.12
        elif (t / EIGHTH) % 1.0 < 0.08: # Hi-hat tick on every eighth
            noise_val, seed = noise_sample(seed)
            drum_amp = noise_val * 0.04

        mix = l_amp + h_amp + b_amp + drum_amp
        samples[i] = max(-0.95, min(0.95, mix))

    # Write WAV file
    wav_path = 'public/audio/pokemon-theme.wav'
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        raw_bytes = bytearray()
        for s in samples:
            val = int(s * 32767.0)
            raw_bytes.extend(struct.pack('<h', val))
        wf.writeframes(raw_bytes)

    print(f"Saved {wav_path}")

    # Convert to MP3 using ffmpeg
    mp3_path = 'public/audio/pokemon-theme.mp3'
    cmd = ['ffmpeg', '-y', '-i', wav_path, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3_path]
    subprocess.run(cmd, check=True)
    print(f"Converted to {mp3_path}")

if __name__ == '__main__':
    render_track()

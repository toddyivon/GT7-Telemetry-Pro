# LucasSynth 🎹

A polyphonic virtual-analogue **synthesizer plugin** that runs in **any DAW**.
Built with [JUCE](https://juce.com), it compiles to:

- **VST3** — Windows, macOS, Linux (Ableton Live, FL Studio, Reaper, Bitwig, Cubase, Studio One…)
- **Audio Unit (AU)** — macOS (Logic Pro, GarageBand)
- **Standalone app** — play it without a DAW

> No paid SDKs required. JUCE is fetched automatically by CMake on the first build.

---

## Features

- **16-voice polyphony**
- **2 super-oscillators** with band-limited (PolyBLEP, anti-aliased) Sine / Saw / Square / Triangle waves
- **Unison** up to 7 voices per oscillator with detune + stereo width (classic "supersaw")
- **Sub oscillator** and **white noise** generator
- **Resonant filter** (Low / High / Band pass, TPT state-variable) with its own **ADSR envelope**, **key-tracking** and **LFO** modulation
- **Amplitude ADSR envelope**
- **LFO** (4 shapes) routable to pitch (vibrato), cutoff and amplitude (tremolo)
- **Portamento / glide**
- Full **preset state saving** (your DAW saves every knob)
- Modern UI with an on-screen keyboard for the Standalone build

---

## Build

You need a C++20 compiler and [CMake ≥ 3.22](https://cmake.org/). Then:

```bash
cd LucasSynth
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release --parallel
```

### Platform toolchains
- **macOS** — Xcode command-line tools (`xcode-select --install`)
- **Windows** — Visual Studio 2022 (Desktop C++)
- **Linux** — `sudo apt install build-essential libasound2-dev libx11-dev libxext-dev libxrandr-dev libxinerama-dev libxcursor-dev libfreetype6-dev libgl1-mesa-dev libcurl4-openssl-dev`

The built plugins land in `build/LucasSynth_artefacts/Release/` and, because
`COPY_PLUGIN_AFTER_BUILD` is on, are also copied into your system plugin folders
so your DAW finds them automatically.

---

## Where to find it in your DAW

| Format | Install location |
|--------|------------------|
| VST3 (macOS) | `~/Library/Audio/Plug-Ins/VST3/` |
| VST3 (Windows) | `C:\Program Files\Common Files\VST3\` |
| VST3 (Linux) | `~/.vst3/` |
| AU (macOS) | `~/Library/Audio/Plug-Ins/Components/` |

Rescan plugins in your DAW and look for **LucasSynth** under instruments.

---

## Project layout

```
LucasSynth/
├── CMakeLists.txt          # build + JUCE fetch
└── Source/
    ├── Oscillators.h       # PolyBLEP + super (unison) oscillators
    ├── Parameters.h        # parameter IDs + shared pointers
    ├── SynthSound.h        # SynthesiserSound
    ├── SynthVoice.h/.cpp   # the DSP voice (the synth engine)
    ├── PluginProcessor.*   # plugin + parameter layout
    └── PluginEditor.*      # the GUI
```

Made with ❤️.

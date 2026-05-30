#pragma once

#include <JuceHeader.h>

/**
    Central place for every parameter ID so the processor, the editor and the
    voice all agree on the same strings.
*/
namespace ParamID
{
    // Oscillator 1
    static constexpr auto osc1Wave   = "osc1Wave";
    static constexpr auto osc1Oct    = "osc1Oct";
    static constexpr auto osc1Level  = "osc1Level";

    // Oscillator 2
    static constexpr auto osc2Wave   = "osc2Wave";
    static constexpr auto osc2Oct    = "osc2Oct";
    static constexpr auto osc2Detune = "osc2Detune";
    static constexpr auto osc2Level  = "osc2Level";

    // Unison (applies to both main oscillators)
    static constexpr auto uniVoices  = "uniVoices";
    static constexpr auto uniDetune  = "uniDetune";
    static constexpr auto uniWidth   = "uniWidth";

    // Sub & noise
    static constexpr auto subLevel   = "subLevel";
    static constexpr auto noiseLevel = "noiseLevel";

    // Amplitude envelope
    static constexpr auto ampAttack  = "ampAttack";
    static constexpr auto ampDecay   = "ampDecay";
    static constexpr auto ampSustain = "ampSustain";
    static constexpr auto ampRelease = "ampRelease";

    // Filter
    static constexpr auto filterType    = "filterType";
    static constexpr auto filterCutoff  = "filterCutoff";
    static constexpr auto filterReso    = "filterReso";
    static constexpr auto filterEnvAmt  = "filterEnvAmt";
    static constexpr auto filterKeytrack= "filterKeytrack";

    // Filter envelope
    static constexpr auto fAttack    = "fAttack";
    static constexpr auto fDecay     = "fDecay";
    static constexpr auto fSustain   = "fSustain";
    static constexpr auto fRelease   = "fRelease";

    // LFO
    static constexpr auto lfoWave    = "lfoWave";
    static constexpr auto lfoRate    = "lfoRate";
    static constexpr auto lfoToPitch = "lfoToPitch";
    static constexpr auto lfoToCutoff= "lfoToCutoff";
    static constexpr auto lfoToAmp   = "lfoToAmp";

    // Master
    static constexpr auto masterGain = "masterGain";
    static constexpr auto glide      = "glide";
}

/**
    Plain pointers to the atomic parameter values. One instance lives in the
    processor and is handed to every voice so the audio thread can read
    parameters without any locking.
*/
struct SynthParameters
{
    std::atomic<float>* osc1Wave   = nullptr;
    std::atomic<float>* osc1Oct    = nullptr;
    std::atomic<float>* osc1Level  = nullptr;

    std::atomic<float>* osc2Wave   = nullptr;
    std::atomic<float>* osc2Oct    = nullptr;
    std::atomic<float>* osc2Detune = nullptr;
    std::atomic<float>* osc2Level  = nullptr;

    std::atomic<float>* uniVoices  = nullptr;
    std::atomic<float>* uniDetune  = nullptr;
    std::atomic<float>* uniWidth   = nullptr;

    std::atomic<float>* subLevel   = nullptr;
    std::atomic<float>* noiseLevel = nullptr;

    std::atomic<float>* ampAttack  = nullptr;
    std::atomic<float>* ampDecay   = nullptr;
    std::atomic<float>* ampSustain = nullptr;
    std::atomic<float>* ampRelease = nullptr;

    std::atomic<float>* filterType    = nullptr;
    std::atomic<float>* filterCutoff  = nullptr;
    std::atomic<float>* filterReso    = nullptr;
    std::atomic<float>* filterEnvAmt  = nullptr;
    std::atomic<float>* filterKeytrack= nullptr;

    std::atomic<float>* fAttack    = nullptr;
    std::atomic<float>* fDecay     = nullptr;
    std::atomic<float>* fSustain   = nullptr;
    std::atomic<float>* fRelease   = nullptr;

    std::atomic<float>* lfoWave    = nullptr;
    std::atomic<float>* lfoRate    = nullptr;
    std::atomic<float>* lfoToPitch = nullptr;
    std::atomic<float>* lfoToCutoff= nullptr;
    std::atomic<float>* lfoToAmp   = nullptr;

    std::atomic<float>* masterGain = nullptr;
    std::atomic<float>* glide      = nullptr;

    void connect (juce::AudioProcessorValueTreeState& apvts)
    {
        auto get = [&apvts] (const char* id) { return apvts.getRawParameterValue (id); };

        osc1Wave   = get (ParamID::osc1Wave);
        osc1Oct    = get (ParamID::osc1Oct);
        osc1Level  = get (ParamID::osc1Level);

        osc2Wave   = get (ParamID::osc2Wave);
        osc2Oct    = get (ParamID::osc2Oct);
        osc2Detune = get (ParamID::osc2Detune);
        osc2Level  = get (ParamID::osc2Level);

        uniVoices  = get (ParamID::uniVoices);
        uniDetune  = get (ParamID::uniDetune);
        uniWidth   = get (ParamID::uniWidth);

        subLevel   = get (ParamID::subLevel);
        noiseLevel = get (ParamID::noiseLevel);

        ampAttack  = get (ParamID::ampAttack);
        ampDecay   = get (ParamID::ampDecay);
        ampSustain = get (ParamID::ampSustain);
        ampRelease = get (ParamID::ampRelease);

        filterType    = get (ParamID::filterType);
        filterCutoff  = get (ParamID::filterCutoff);
        filterReso    = get (ParamID::filterReso);
        filterEnvAmt  = get (ParamID::filterEnvAmt);
        filterKeytrack= get (ParamID::filterKeytrack);

        fAttack    = get (ParamID::fAttack);
        fDecay     = get (ParamID::fDecay);
        fSustain   = get (ParamID::fSustain);
        fRelease   = get (ParamID::fRelease);

        lfoWave    = get (ParamID::lfoWave);
        lfoRate    = get (ParamID::lfoRate);
        lfoToPitch = get (ParamID::lfoToPitch);
        lfoToCutoff= get (ParamID::lfoToCutoff);
        lfoToAmp   = get (ParamID::lfoToAmp);

        masterGain = get (ParamID::masterGain);
        glide      = get (ParamID::glide);
    }
};

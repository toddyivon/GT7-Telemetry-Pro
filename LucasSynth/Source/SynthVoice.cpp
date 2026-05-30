#include "SynthVoice.h"
#include "SynthSound.h"

SynthVoice::SynthVoice (SynthParameters& sharedParams)
    : params (sharedParams)
{
}

bool SynthVoice::canPlaySound (juce::SynthesiserSound* sound)
{
    return dynamic_cast<SynthSound*> (sound) != nullptr;
}

PolyBlepOscillator::Wave SynthVoice::waveFromChoice (float v) noexcept
{
    switch (juce::roundToInt (v))
    {
        case 0:  return PolyBlepOscillator::Wave::Sine;
        case 1:  return PolyBlepOscillator::Wave::Saw;
        case 2:  return PolyBlepOscillator::Wave::Square;
        case 3:  return PolyBlepOscillator::Wave::Triangle;
        default: return PolyBlepOscillator::Wave::Saw;
    }
}

void SynthVoice::prepare (double sampleRate, int samplesPerBlock, int numChannels)
{
    currentSampleRate = sampleRate;

    osc1.setSampleRate (sampleRate);
    osc2.setSampleRate (sampleRate);
    subOsc.setSampleRate (sampleRate);
    subOsc.setWaveform (PolyBlepOscillator::Wave::Sine);
    lfo.setSampleRate (sampleRate);

    ampEnv.setSampleRate (sampleRate);
    filterEnv.setSampleRate (sampleRate);

    juce::dsp::ProcessSpec spec;
    spec.sampleRate       = sampleRate;
    spec.maximumBlockSize = static_cast<juce::uint32> (samplesPerBlock);
    spec.numChannels      = static_cast<juce::uint32> (juce::jmax (1, numChannels));

    filter.prepare (spec);
    filter.setType (juce::dsp::StateVariableTPTFilterType::lowpass);

    prepared = true;
}

void SynthVoice::startNote (int midiNoteNumber, float velocity,
                            juce::SynthesiserSound*, int /*pitchWheel*/)
{
    midiNote      = midiNoteNumber;
    velocityLevel  = juce::jmax (0.05f, velocity);

    targetFrequency = juce::MidiMessage::getMidiNoteInHertz (midiNoteNumber);

    // First note on a fresh voice should not glide up from a stale frequency.
    const bool glideOn = params.glide != nullptr && params.glide->load() > 0.001f;
    if (! glideOn || currentFrequency <= 0.0)
        currentFrequency = targetFrequency;

    osc1.reset();
    osc2.reset();
    subOsc.reset();
    lfo.reset();
    filter.reset();

    ampEnv.noteOn();
    filterEnv.noteOn();
}

void SynthVoice::stopNote (float /*velocity*/, bool allowTailOff)
{
    if (allowTailOff)
    {
        ampEnv.noteOff();
        filterEnv.noteOff();
    }
    else
    {
        ampEnv.reset();
        filterEnv.reset();
        clearCurrentNote();
    }
}

void SynthVoice::pitchWheelMoved (int) {}
void SynthVoice::controllerMoved (int, int) {}

void SynthVoice::updatePitch() {}

void SynthVoice::renderNextBlock (juce::AudioBuffer<float>& outputBuffer,
                                  int startSample, int numSamples)
{
    if (! prepared || ! ampEnv.isActive())
        return;

    // ---- Block-rate parameter snapshot ---------------------------------
    ampEnvParams.attack  = params.ampAttack->load();
    ampEnvParams.decay   = params.ampDecay->load();
    ampEnvParams.sustain = params.ampSustain->load();
    ampEnvParams.release = params.ampRelease->load();
    ampEnv.setParameters (ampEnvParams);

    filterEnvParams.attack  = params.fAttack->load();
    filterEnvParams.decay   = params.fDecay->load();
    filterEnvParams.sustain = params.fSustain->load();
    filterEnvParams.release = params.fRelease->load();
    filterEnv.setParameters (filterEnvParams);

    osc1.setWaveform (waveFromChoice (params.osc1Wave->load()));
    osc2.setWaveform (waveFromChoice (params.osc2Wave->load()));
    lfo.setWaveform  (waveFromChoice (params.lfoWave->load()));
    lfo.setFrequency (params.lfoRate->load());

    const int uniVoices = juce::roundToInt (params.uniVoices->load());
    const float uniDet  = params.uniDetune->load();
    const float uniWid  = params.uniWidth->load();
    osc1.setUnison (uniVoices, uniDet, uniWid);
    osc2.setUnison (uniVoices, uniDet, uniWid);

    const double osc1OctRatio = std::pow (2.0, params.osc1Oct->load());
    const double osc2OctRatio = std::pow (2.0, params.osc2Oct->load());
    const double osc2DetRatio = std::pow (2.0, params.osc2Detune->load() / 1200.0);

    const float o1Level   = params.osc1Level->load();
    const float o2Level   = params.osc2Level->load();
    const float subLevel  = params.subLevel->load();
    const float noiseLvl  = params.noiseLevel->load();
    const float master    = params.masterGain->load();

    const float cutoffBase = params.filterCutoff->load();
    const float resoNorm   = params.filterReso->load();
    const float envAmt     = params.filterEnvAmt->load();   // octaves, -4..+4
    const float keytrack   = params.filterKeytrack->load(); // 0..1
    const float lfoPitch   = params.lfoToPitch->load();     // cents
    const float lfoCutoff  = params.lfoToCutoff->load();    // octaves
    const float lfoAmp     = params.lfoToAmp->load();       // 0..1

    switch (juce::roundToInt (params.filterType->load()))
    {
        case 1:  filter.setType (juce::dsp::StateVariableTPTFilterType::highpass); break;
        case 2:  filter.setType (juce::dsp::StateVariableTPTFilterType::bandpass); break;
        default: filter.setType (juce::dsp::StateVariableTPTFilterType::lowpass);  break;
    }
    filter.setResonance (juce::jmap (resoNorm, 0.0f, 1.0f, 0.707f, 6.0f));

    // Glide coefficient (one-pole towards target frequency).
    const float glideTime = params.glide->load();
    glideCoeff = glideTime <= 0.0001f
               ? 1.0
               : 1.0 - std::exp (-1.0 / (glideTime * currentSampleRate));

    const double maxCutoff = juce::jmin (20000.0, currentSampleRate * 0.49);
    const double keytrackMul = std::pow (2.0, ((midiNote - 60) / 12.0) * keytrack);

    const int numOutChannels = outputBuffer.getNumChannels();

    for (int s = 0; s < numSamples; ++s)
    {
        const float lfoSample = lfo.getNextSample(); // -1..1

        // Pitch (glide + LFO vibrato)
        currentFrequency += (targetFrequency - currentFrequency) * glideCoeff;
        const double pitchMod = std::pow (2.0, (lfoPitch * lfoSample) / 1200.0);
        const double f = currentFrequency * pitchMod;

        osc1.setBaseFrequency (f * osc1OctRatio);
        osc2.setBaseFrequency (f * osc2OctRatio * osc2DetRatio);
        subOsc.setFrequency (f * 0.5);

        float o1L, o1R, o2L, o2R;
        osc1.getNextSample (o1L, o1R);
        osc2.getNextSample (o2L, o2R);
        const float sub   = subOsc.getNextSample();
        const float noise = noiseRng.nextFloat() * 2.0f - 1.0f;

        float left  = o1L * o1Level + o2L * o2Level + sub * subLevel + noise * noiseLvl;
        float right = o1R * o1Level + o2R * o2Level + sub * subLevel + noise * noiseLvl;

        // Envelopes
        const float ampVal  = ampEnv.getNextSample();
        const float fEnvVal = filterEnv.getNextSample();

        // Tremolo
        const float tremolo = 1.0f - lfoAmp * (0.5f * (1.0f + lfoSample));

        const float gain = ampVal * velocityLevel * master * tremolo;
        left  *= gain;
        right *= gain;

        // Filter cutoff modulation (all in octaves for musical scaling)
        double cutoff = cutoffBase;
        cutoff *= std::pow (2.0, envAmt   * fEnvVal);
        cutoff *= std::pow (2.0, lfoCutoff * lfoSample);
        cutoff *= keytrackMul;
        cutoff = juce::jlimit (20.0, maxCutoff, cutoff);
        filter.setCutoffFrequency (static_cast<float> (cutoff));

        left  = filter.processSample (0, left);
        right = filter.processSample (numOutChannels > 1 ? 1 : 0, right);

        if (numOutChannels > 1)
        {
            outputBuffer.addSample (0, startSample + s, left);
            outputBuffer.addSample (1, startSample + s, right);
        }
        else
        {
            outputBuffer.addSample (0, startSample + s, 0.5f * (left + right));
        }

        if (! ampEnv.isActive())
        {
            clearCurrentNote();
            break;
        }
    }
}

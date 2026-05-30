#pragma once

#include <JuceHeader.h>
#include "Oscillators.h"
#include "Parameters.h"

/**
    A single polyphonic voice. Signal path:

        OSC1 (super) + OSC2 (super) + SUB + NOISE
            -> amplitude envelope
            -> state-variable filter (cutoff modulated by env + LFO + keytrack)
            -> master gain

    The voice reads every parameter directly from the shared SynthParameters
    pointers, so there is no locking on the audio thread.
*/
class SynthVoice : public juce::SynthesiserVoice
{
public:
    explicit SynthVoice (SynthParameters& sharedParams);

    bool canPlaySound (juce::SynthesiserSound* sound) override;

    void startNote (int midiNoteNumber, float velocity,
                    juce::SynthesiserSound* sound, int currentPitchWheelPosition) override;

    void stopNote (float velocity, bool allowTailOff) override;

    void pitchWheelMoved (int newPitchWheelValue) override;
    void controllerMoved (int controllerNumber, int newControllerValue) override;

    void prepare (double sampleRate, int samplesPerBlock, int numChannels);

    void renderNextBlock (juce::AudioBuffer<float>& outputBuffer,
                          int startSample, int numSamples) override;

private:
    void updatePitch();
    static PolyBlepOscillator::Wave waveFromChoice (float v) noexcept;

    SynthParameters& params;

    SuperOscillator osc1, osc2;
    PolyBlepOscillator subOsc;
    PolyBlepOscillator lfo;

    juce::ADSR ampEnv;
    juce::ADSR filterEnv;
    juce::ADSR::Parameters ampEnvParams;
    juce::ADSR::Parameters filterEnvParams;

    juce::dsp::StateVariableTPTFilter<float> filter;

    juce::Random noiseRng;

    double currentSampleRate = 44100.0;

    int    midiNote          = 60;
    float  velocityLevel     = 1.0f;

    // Portamento / glide
    double currentFrequency  = 440.0;
    double targetFrequency   = 440.0;
    double glideCoeff        = 0.0;

    bool   prepared          = false;
};

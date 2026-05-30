#pragma once

#include <JuceHeader.h>
#include "Parameters.h"

/**
    LucasSynth — a polyphonic virtual-analogue synthesiser.

    Runs in any DAW that hosts VST3 (Windows / macOS / Linux) or AU (macOS),
    and also ships as a Standalone application.
*/
class LucasSynthAudioProcessor : public juce::AudioProcessor
{
public:
    LucasSynthAudioProcessor();
    ~LucasSynthAudioProcessor() override;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "LucasSynth"; }

    bool acceptsMidi() const override  { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override                { return 1; }
    int getCurrentProgram() override             { return 0; }
    void setCurrentProgram (int) override        {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    static constexpr int maxVoices = 16;

    juce::AudioProcessorValueTreeState apvts;

    // Drives the on-screen keyboard (Standalone) and merges its notes into MIDI.
    juce::MidiKeyboardState keyboardState;

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

private:
    juce::Synthesiser synth;
    SynthParameters   sharedParams;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (LucasSynthAudioProcessor)
};

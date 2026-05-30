#include "PluginProcessor.h"
#include "PluginEditor.h"
#include "SynthVoice.h"
#include "SynthSound.h"

//==============================================================================
namespace
{
    juce::StringArray waveChoices()   { return { "Sine", "Saw", "Square", "Triangle" }; }
    juce::StringArray filterChoices() { return { "Low Pass", "High Pass", "Band Pass" }; }
}

//==============================================================================
LucasSynthAudioProcessor::LucasSynthAudioProcessor()
    : AudioProcessor (BusesProperties()
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "PARAMS", createParameterLayout())
{
    sharedParams.connect (apvts);

    synth.addSound (new SynthSound());
    for (int i = 0; i < maxVoices; ++i)
        synth.addVoice (new SynthVoice (sharedParams));
}

LucasSynthAudioProcessor::~LucasSynthAudioProcessor() = default;

//==============================================================================
juce::AudioProcessorValueTreeState::ParameterLayout
LucasSynthAudioProcessor::createParameterLayout()
{
    using namespace juce;
    AudioProcessorValueTreeState::ParameterLayout layout;

    auto ms  = [] (float v) { return String (v, 0) + " ms"; };

    // ---- Oscillator 1 --------------------------------------------------
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { ParamID::osc1Wave, 1 },
                    "Osc1 Wave", waveChoices(), 1));
    layout.add (std::make_unique<AudioParameterInt> (ParameterID { ParamID::osc1Oct, 1 },
                    "Osc1 Octave", -2, 2, 0));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::osc1Level, 1 },
                    "Osc1 Level", NormalisableRange<float> (0.0f, 1.0f), 0.8f));

    // ---- Oscillator 2 --------------------------------------------------
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { ParamID::osc2Wave, 1 },
                    "Osc2 Wave", waveChoices(), 1));
    layout.add (std::make_unique<AudioParameterInt> (ParameterID { ParamID::osc2Oct, 1 },
                    "Osc2 Octave", -2, 2, 0));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::osc2Detune, 1 },
                    "Osc2 Detune", NormalisableRange<float> (-50.0f, 50.0f), 0.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::osc2Level, 1 },
                    "Osc2 Level", NormalisableRange<float> (0.0f, 1.0f), 0.0f));

    // ---- Unison --------------------------------------------------------
    layout.add (std::make_unique<AudioParameterInt> (ParameterID { ParamID::uniVoices, 1 },
                    "Unison Voices", 1, 7, 1));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::uniDetune, 1 },
                    "Unison Detune", NormalisableRange<float> (0.0f, 50.0f), 15.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::uniWidth, 1 },
                    "Unison Width", NormalisableRange<float> (0.0f, 1.0f), 0.5f));

    // ---- Sub & Noise ---------------------------------------------------
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::subLevel, 1 },
                    "Sub Level", NormalisableRange<float> (0.0f, 1.0f), 0.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::noiseLevel, 1 },
                    "Noise Level", NormalisableRange<float> (0.0f, 1.0f), 0.0f));

    // ---- Amp envelope --------------------------------------------------
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::ampAttack, 1 },
                    "Amp Attack", NormalisableRange<float> (0.001f, 5.0f, 0.0f, 0.3f), 0.005f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::ampDecay, 1 },
                    "Amp Decay", NormalisableRange<float> (0.001f, 5.0f, 0.0f, 0.3f), 0.3f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::ampSustain, 1 },
                    "Amp Sustain", NormalisableRange<float> (0.0f, 1.0f), 0.8f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::ampRelease, 1 },
                    "Amp Release", NormalisableRange<float> (0.001f, 5.0f, 0.0f, 0.3f), 0.4f));

    // ---- Filter --------------------------------------------------------
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { ParamID::filterType, 1 },
                    "Filter Type", filterChoices(), 0));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::filterCutoff, 1 },
                    "Cutoff", NormalisableRange<float> (20.0f, 20000.0f, 0.0f, 0.25f), 12000.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::filterReso, 1 },
                    "Resonance", NormalisableRange<float> (0.0f, 1.0f), 0.15f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::filterEnvAmt, 1 },
                    "Filter Env Amount", NormalisableRange<float> (-4.0f, 4.0f), 1.5f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::filterKeytrack, 1 },
                    "Filter Keytrack", NormalisableRange<float> (0.0f, 1.0f), 0.0f));

    // ---- Filter envelope ----------------------------------------------
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::fAttack, 1 },
                    "Filter Attack", NormalisableRange<float> (0.001f, 5.0f, 0.0f, 0.3f), 0.01f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::fDecay, 1 },
                    "Filter Decay", NormalisableRange<float> (0.001f, 5.0f, 0.0f, 0.3f), 0.4f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::fSustain, 1 },
                    "Filter Sustain", NormalisableRange<float> (0.0f, 1.0f), 0.3f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::fRelease, 1 },
                    "Filter Release", NormalisableRange<float> (0.001f, 5.0f, 0.0f, 0.3f), 0.4f));

    // ---- LFO -----------------------------------------------------------
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { ParamID::lfoWave, 1 },
                    "LFO Wave", waveChoices(), 0));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::lfoRate, 1 },
                    "LFO Rate", NormalisableRange<float> (0.01f, 20.0f, 0.0f, 0.4f), 4.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::lfoToPitch, 1 },
                    "LFO -> Pitch", NormalisableRange<float> (0.0f, 100.0f), 0.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::lfoToCutoff, 1 },
                    "LFO -> Cutoff", NormalisableRange<float> (0.0f, 4.0f), 0.0f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::lfoToAmp, 1 },
                    "LFO -> Amp", NormalisableRange<float> (0.0f, 1.0f), 0.0f));

    // ---- Master --------------------------------------------------------
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::masterGain, 1 },
                    "Master Gain", NormalisableRange<float> (0.0f, 1.0f), 0.5f));
    layout.add (std::make_unique<AudioParameterFloat> (ParameterID { ParamID::glide, 1 },
                    "Glide", NormalisableRange<float> (0.0f, 1.0f), 0.0f));

    juce::ignoreUnused (ms);
    return layout;
}

//==============================================================================
void LucasSynthAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    synth.setCurrentPlaybackSampleRate (sampleRate);

    for (int i = 0; i < synth.getNumVoices(); ++i)
        if (auto* v = dynamic_cast<SynthVoice*> (synth.getVoice (i)))
            v->prepare (sampleRate, samplesPerBlock, getTotalNumOutputChannels());
}

void LucasSynthAudioProcessor::releaseResources() {}

bool LucasSynthAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto& out = layouts.getMainOutputChannelSet();
    return out == juce::AudioChannelSet::stereo() || out == juce::AudioChannelSet::mono();
}

void LucasSynthAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer,
                                             juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;

    buffer.clear();

    // Merge any notes played on the on-screen keyboard into the MIDI stream.
    keyboardState.processNextMidiBuffer (midiMessages, 0, buffer.getNumSamples(), true);

    synth.renderNextBlock (buffer, midiMessages, 0, buffer.getNumSamples());
}

//==============================================================================
juce::AudioProcessorEditor* LucasSynthAudioProcessor::createEditor()
{
    return new LucasSynthAudioProcessorEditor (*this);
}

//==============================================================================
void LucasSynthAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    if (auto state = apvts.copyState(); state.isValid())
    {
        std::unique_ptr<juce::XmlElement> xml (state.createXml());
        copyXmlToBinary (*xml, destData);
    }
}

void LucasSynthAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    if (std::unique_ptr<juce::XmlElement> xml (getXmlFromBinary (data, sizeInBytes)); xml != nullptr)
        if (xml->hasTagName (apvts.state.getType()))
            apvts.replaceState (juce::ValueTree::fromXml (*xml));
}

//==============================================================================
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new LucasSynthAudioProcessor();
}

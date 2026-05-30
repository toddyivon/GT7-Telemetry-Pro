#pragma once

#include <JuceHeader.h>

/**
    A trivial SynthesiserSound that accepts every MIDI note and channel.
    The actual sound generation happens in SynthVoice.
*/
class SynthSound : public juce::SynthesiserSound
{
public:
    SynthSound() = default;

    bool appliesToNote (int /*midiNoteNumber*/) override   { return true; }
    bool appliesToChannel (int /*midiChannel*/) override   { return true; }
};

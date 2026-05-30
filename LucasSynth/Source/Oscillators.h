#pragma once

#include <JuceHeader.h>
#include <cmath>

/**
    A single band-limited oscillator using PolyBLEP to suppress the aliasing
    that naive saw / square waves would otherwise produce at high pitches.
*/
class PolyBlepOscillator
{
public:
    enum class Wave { Sine = 0, Saw, Square, Triangle };

    void setSampleRate (double newSampleRate) noexcept
    {
        sampleRate = newSampleRate;
        updateIncrement();
    }

    void setFrequency (double newFrequency) noexcept
    {
        frequency = newFrequency;
        updateIncrement();
    }

    void setWaveform (Wave w) noexcept { waveform = w; }

    void reset (double startPhase = 0.0) noexcept
    {
        phase = startPhase;
        lastOutput = 0.0;
    }

    float getNextSample() noexcept
    {
        const double t  = phase;          // current phase in [0, 1)
        const double dt = phaseIncrement;  // normalised frequency
        double value = 0.0;

        switch (waveform)
        {
            case Wave::Sine:
                value = std::sin (juce::MathConstants<double>::twoPi * t);
                break;

            case Wave::Saw:
                value = (2.0 * t) - 1.0;
                value -= polyBlep (t, dt);
                break;

            case Wave::Square:
            {
                value = t < 0.5 ? 1.0 : -1.0;
                value += polyBlep (t, dt);
                value -= polyBlep (std::fmod (t + 0.5, 1.0), dt);
                break;
            }

            case Wave::Triangle:
            {
                // Band-limited square fed through a leaky integrator.
                double sq = t < 0.5 ? 1.0 : -1.0;
                sq += polyBlep (t, dt);
                sq -= polyBlep (std::fmod (t + 0.5, 1.0), dt);
                value = dt * sq + (1.0 - dt) * lastOutput;
                lastOutput = value;
                value *= 4.0; // compensate integrator gain
                break;
            }
        }

        phase += phaseIncrement;
        if (phase >= 1.0)
            phase -= 1.0;

        return static_cast<float> (value);
    }

private:
    void updateIncrement() noexcept
    {
        phaseIncrement = sampleRate > 0.0 ? frequency / sampleRate : 0.0;
    }

    static double polyBlep (double t, double dt) noexcept
    {
        if (dt <= 0.0)
            return 0.0;

        if (t < dt)
        {
            t /= dt;
            return (t + t) - (t * t) - 1.0;
        }
        if (t > 1.0 - dt)
        {
            t = (t - 1.0) / dt;
            return (t * t) + (t + t) + 1.0;
        }
        return 0.0;
    }

    double sampleRate     = 44100.0;
    double frequency      = 440.0;
    double phase          = 0.0;
    double phaseIncrement  = 0.0;
    double lastOutput     = 0.0;
    Wave   waveform       = Wave::Saw;
};

/**
    A "super" oscillator: up to 7 detuned PolyBLEP voices spread across the
    stereo field. This is what gives the classic fat / supersaw character.
*/
class SuperOscillator
{
public:
    static constexpr int maxVoices = 7;

    void setSampleRate (double sr) noexcept
    {
        for (auto& o : oscs)
            o.setSampleRate (sr);
    }

    void setWaveform (PolyBlepOscillator::Wave w) noexcept
    {
        for (auto& o : oscs)
            o.setWaveform (w);
    }

    void reset() noexcept
    {
        juce::Random rng;
        for (int i = 0; i < maxVoices; ++i)
            oscs[i].reset (i == 0 ? 0.0 : rng.nextDouble()); // randomise phases for width
    }

    /** Configure unison spread before processing. */
    void setUnison (int voices, double detuneCents, double width) noexcept
    {
        numVoices    = juce::jlimit (1, maxVoices, voices);
        detune       = detuneCents;
        stereoWidth   = juce::jlimit (0.0, 1.0, width);
    }

    void setBaseFrequency (double freqHz) noexcept { baseFrequency = freqHz; }

    /** Renders one stereo sample (sum of all unison voices). */
    void getNextSample (float& outL, float& outR) noexcept
    {
        double l = 0.0, r = 0.0;
        const double norm = 1.0 / std::sqrt ((double) numVoices);

        for (int i = 0; i < numVoices; ++i)
        {
            // Symmetric detune spread around the centre, in cents.
            double spread = 0.0;
            if (numVoices > 1)
                spread = (((double) i / (double) (numVoices - 1)) - 0.5) * 2.0; // -1..1

            const double cents = spread * detune;
            const double ratio = std::pow (2.0, cents / 1200.0);
            oscs[i].setFrequency (baseFrequency * ratio);

            const float s = oscs[i].getNextSample();

            // Pan: centre voice stays centred, outer voices spread out.
            const double pan = spread * stereoWidth;            // -width..width
            const double lGain = std::cos ((pan + 1.0) * 0.25 * juce::MathConstants<double>::pi);
            const double rGain = std::sin ((pan + 1.0) * 0.25 * juce::MathConstants<double>::pi);

            l += s * lGain;
            r += s * rGain;
        }

        outL = static_cast<float> (l * norm);
        outR = static_cast<float> (r * norm);
    }

private:
    PolyBlepOscillator oscs[maxVoices];
    int    numVoices     = 1;
    double detune        = 15.0;
    double stereoWidth    = 0.5;
    double baseFrequency  = 440.0;
};

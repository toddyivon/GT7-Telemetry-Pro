#pragma once

#include <JuceHeader.h>
#include "PluginProcessor.h"

//==============================================================================
/** A compact, modern rotary-knob look. */
class LucasLookAndFeel : public juce::LookAndFeel_V4
{
public:
    LucasLookAndFeel();

    void drawRotarySlider (juce::Graphics&, int x, int y, int width, int height,
                           float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                           juce::Slider&) override;
};

//==============================================================================
class LucasSynthAudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    explicit LucasSynthAudioProcessorEditor (LucasSynthAudioProcessor&);
    ~LucasSynthAudioProcessorEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;
    using ComboAttachment  = juce::AudioProcessorValueTreeState::ComboBoxAttachment;

    struct Control
    {
        juce::String      id;
        juce::String      label;
        bool              isCombo = false;
        juce::StringArray choices;
    };

    struct Panel
    {
        juce::String          title;
        std::vector<Control>  controls;
        juce::Rectangle<int>  area;          // filled in by resized()
        int                   columns = 3;
    };

    void buildControl (const Control&, int panelIndex);

    LucasSynthAudioProcessor& processor;
    LucasLookAndFeel          lookAndFeel;

    std::vector<Panel> panels;

    // One entry per created control, in creation order, tagged with its panel.
    struct Placed
    {
        juce::Component* comp  = nullptr;   // Slider or ComboBox
        juce::Label*     label = nullptr;
        int              panel = 0;
    };
    std::vector<Placed> placed;

    juce::OwnedArray<juce::Slider>          sliders;
    juce::OwnedArray<juce::ComboBox>        combos;
    juce::OwnedArray<juce::Label>           labels;
    juce::OwnedArray<SliderAttachment>      sliderAttachments;
    juce::OwnedArray<ComboAttachment>       comboAttachments;

    juce::MidiKeyboardComponent keyboard;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (LucasSynthAudioProcessorEditor)
};

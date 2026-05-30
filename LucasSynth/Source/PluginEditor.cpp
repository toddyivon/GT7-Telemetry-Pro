#include "PluginEditor.h"
#include "Parameters.h"

//==============================================================================
LucasLookAndFeel::LucasLookAndFeel()
{
    setColour (juce::Slider::rotarySliderFillColourId,    juce::Colour (0xff5ad1ff));
    setColour (juce::Slider::rotarySliderOutlineColourId, juce::Colour (0xff2a2f3a));
    setColour (juce::Slider::thumbColourId,               juce::Colours::white);
    setColour (juce::ComboBox::backgroundColourId,        juce::Colour (0xff20242e));
    setColour (juce::ComboBox::textColourId,              juce::Colours::white);
    setColour (juce::ComboBox::outlineColourId,           juce::Colour (0xff3a3f4a));
    setColour (juce::Label::textColourId,                 juce::Colour (0xffc7ccd6));
}

void LucasLookAndFeel::drawRotarySlider (juce::Graphics& g, int x, int y, int width, int height,
                                         float sliderPos, float rotaryStartAngle,
                                         float rotaryEndAngle, juce::Slider& slider)
{
    const auto bounds = juce::Rectangle<int> (x, y, width, height).toFloat().reduced (6.0f);
    const auto radius   = juce::jmin (bounds.getWidth(), bounds.getHeight()) * 0.5f;
    const auto centre   = bounds.getCentre();
    const auto angle    = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);
    const auto lineW    = juce::jmax (2.0f, radius * 0.16f);
    const auto arcR     = radius - lineW * 0.5f;

    // Track
    juce::Path track;
    track.addCentredArc (centre.x, centre.y, arcR, arcR, 0.0f,
                         rotaryStartAngle, rotaryEndAngle, true);
    g.setColour (slider.findColour (juce::Slider::rotarySliderOutlineColourId));
    g.strokePath (track, juce::PathStrokeType (lineW, juce::PathStrokeType::curved,
                                               juce::PathStrokeType::rounded));

    // Filled value arc
    juce::Path value;
    value.addCentredArc (centre.x, centre.y, arcR, arcR, 0.0f,
                         rotaryStartAngle, angle, true);
    g.setColour (slider.findColour (juce::Slider::rotarySliderFillColourId));
    g.strokePath (value, juce::PathStrokeType (lineW, juce::PathStrokeType::curved,
                                               juce::PathStrokeType::rounded));

    // Pointer
    juce::Path pointer;
    const float pl = radius * 0.55f;
    pointer.addRoundedRectangle (-lineW * 0.35f, -arcR, lineW * 0.7f, pl, lineW * 0.35f);
    pointer.applyTransform (juce::AffineTransform::rotation (angle).translated (centre));
    g.setColour (slider.findColour (juce::Slider::thumbColourId));
    g.fillPath (pointer);

    // Inner dot
    g.setColour (juce::Colour (0xff161922));
    g.fillEllipse (juce::Rectangle<float> (radius * 0.5f, radius * 0.5f).withCentre (centre));
}

//==============================================================================
LucasSynthAudioProcessorEditor::LucasSynthAudioProcessorEditor (LucasSynthAudioProcessor& p)
    : AudioProcessorEditor (&p),
      processor (p),
      keyboard (p.keyboardState, juce::MidiKeyboardComponent::horizontalKeyboard)
{
    setLookAndFeel (&lookAndFeel);

    const juce::StringArray waves       { "Sine", "Saw", "Square", "Triangle" };
    const juce::StringArray filterTypes { "Low Pass", "High Pass", "Band Pass" };

    panels.push_back ({ "Oscillator 1", {
        { ParamID::osc1Wave,  "Wave",   true, waves },
        { ParamID::osc1Oct,   "Octave"  },
        { ParamID::osc1Level, "Level"   } }, {}, 3 });

    panels.push_back ({ "Oscillator 2", {
        { ParamID::osc2Wave,   "Wave",   true, waves },
        { ParamID::osc2Oct,    "Octave"  },
        { ParamID::osc2Detune, "Detune"  },
        { ParamID::osc2Level,  "Level"   } }, {}, 2 });

    panels.push_back ({ "Unison", {
        { ParamID::uniVoices, "Voices" },
        { ParamID::uniDetune, "Detune" },
        { ParamID::uniWidth,  "Width"  } }, {}, 3 });

    panels.push_back ({ "Mix", {
        { ParamID::subLevel,   "Sub"   },
        { ParamID::noiseLevel, "Noise" } }, {}, 2 });

    panels.push_back ({ "Amp Envelope", {
        { ParamID::ampAttack,  "Attack"  },
        { ParamID::ampDecay,   "Decay"   },
        { ParamID::ampSustain, "Sustain" },
        { ParamID::ampRelease, "Release" } }, {}, 4 });

    panels.push_back ({ "Filter", {
        { ParamID::filterType,     "Type", true, filterTypes },
        { ParamID::filterCutoff,   "Cutoff"   },
        { ParamID::filterReso,     "Reso"     },
        { ParamID::filterEnvAmt,   "Env Amt"  },
        { ParamID::filterKeytrack, "Keytrack" } }, {}, 3 });

    panels.push_back ({ "Filter Envelope", {
        { ParamID::fAttack,  "Attack"  },
        { ParamID::fDecay,   "Decay"   },
        { ParamID::fSustain, "Sustain" },
        { ParamID::fRelease, "Release" } }, {}, 4 });

    panels.push_back ({ "LFO", {
        { ParamID::lfoWave,     "Wave", true, waves },
        { ParamID::lfoRate,     "Rate"     },
        { ParamID::lfoToPitch,  "> Pitch"  },
        { ParamID::lfoToCutoff, "> Cutoff" },
        { ParamID::lfoToAmp,    "> Amp"    } }, {}, 3 });

    panels.push_back ({ "Master", {
        { ParamID::masterGain, "Volume" },
        { ParamID::glide,      "Glide"  } }, {}, 2 });

    for (int pi = 0; pi < (int) panels.size(); ++pi)
        for (const auto& c : panels[pi].controls)
            buildControl (c, pi);

    addAndMakeVisible (keyboard);
    keyboard.setMidiChannel (1);
    keyboard.setAvailableRange (36, 96);

    setResizable (true, true);
    setSize (1000, 660);
}

LucasSynthAudioProcessorEditor::~LucasSynthAudioProcessorEditor()
{
    setLookAndFeel (nullptr);
}

void LucasSynthAudioProcessorEditor::buildControl (const Control& c, int panelIndex)
{
    auto* label = labels.add (new juce::Label ({}, c.label));
    label->setJustificationType (juce::Justification::centred);
    label->setFont (juce::Font (juce::FontOptions (12.0f)));
    addAndMakeVisible (label);

    if (c.isCombo)
    {
        auto* box = combos.add (new juce::ComboBox());
        box->addItemList (c.choices, 1);
        addAndMakeVisible (box);
        comboAttachments.add (new ComboAttachment (processor.apvts, c.id, *box));
        placed.push_back ({ box, label, panelIndex });
    }
    else
    {
        auto* knob = sliders.add (new juce::Slider (juce::Slider::RotaryHorizontalVerticalDrag,
                                                    juce::Slider::TextBoxBelow));
        knob->setTextBoxStyle (juce::Slider::TextBoxBelow, false, 64, 16);
        knob->setColour (juce::Slider::textBoxOutlineColourId, juce::Colours::transparentBlack);
        knob->setColour (juce::Slider::textBoxTextColourId, juce::Colour (0xff9aa1ad));
        addAndMakeVisible (knob);
        sliderAttachments.add (new SliderAttachment (processor.apvts, c.id, *knob));
        placed.push_back ({ knob, label, panelIndex });
    }
}

//==============================================================================
void LucasSynthAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour (0xff12151c));

    juce::ColourGradient grad (juce::Colour (0xff1a1f2b), 0, 0,
                               juce::Colour (0xff0e1016), 0, (float) getHeight(), false);
    g.setGradientFill (grad);
    g.fillRect (getLocalBounds());

    // Title
    auto title = getLocalBounds().removeFromTop (38).reduced (14, 0);
    g.setColour (juce::Colour (0xff5ad1ff));
    g.setFont (juce::Font (juce::FontOptions (22.0f, juce::Font::bold)));
    g.drawText ("LucasSynth", title, juce::Justification::centredLeft);
    g.setColour (juce::Colour (0xff6c7686));
    g.setFont (juce::Font (juce::FontOptions (12.0f)));
    g.drawText ("polyphonic virtual-analogue synth", title, juce::Justification::centredRight);

    // Panels
    for (const auto& panel : panels)
    {
        if (panel.area.isEmpty())
            continue;

        auto r = panel.area.toFloat();
        g.setColour (juce::Colour (0xff191e29));
        g.fillRoundedRectangle (r, 8.0f);
        g.setColour (juce::Colour (0xff2a3140));
        g.drawRoundedRectangle (r, 8.0f, 1.2f);

        g.setColour (juce::Colour (0xff8fa0b8));
        g.setFont (juce::Font (juce::FontOptions (12.0f, juce::Font::bold)));
        const auto titleRow = panel.area.withHeight (22).reduced (10, 4);
        g.drawText (panel.title.toUpperCase(), titleRow,
                    juce::Justification::centredLeft);
    }
}

void LucasSynthAudioProcessorEditor::resized()
{
    const int margin = 12;
    auto area = getLocalBounds().reduced (margin);
    area.removeFromTop (30);                    // title strip

    auto keyArea = area.removeFromBottom (74);
    keyboard.setBounds (keyArea.reduced (0, 4));

    const int cellW  = 84;
    const int cellH  = 92;
    const int header = 26;
    const int pad    = 8;

    int x = area.getX();
    int y = area.getY();
    int rowHeight = 0;

    for (auto& panel : panels)
    {
        const int cols = juce::jmax (1, panel.columns);
        const int n    = (int) panel.controls.size();
        const int rows = (n + cols - 1) / cols;

        const int pw = cols * cellW + 2 * pad;
        const int ph = header + rows * cellH + pad;

        if (x + pw > area.getRight() && x > area.getX())
        {
            x = area.getX();
            y += rowHeight + margin;
            rowHeight = 0;
        }

        panel.area = { x, y, pw, ph };
        x += pw + margin;
        rowHeight = juce::jmax (rowHeight, ph);
    }

    // Position the actual controls inside their panels.
    std::vector<int> indexInPanel (panels.size(), 0);
    for (auto& pl : placed)
    {
        const auto& panel = panels[pl.panel];
        const int cols = juce::jmax (1, panel.columns);
        const int i    = indexInPanel[pl.panel]++;
        const int c    = i % cols;
        const int row  = i / cols;

        const int cx = panel.area.getX() + pad + c * cellW;
        const int cy = panel.area.getY() + header + row * cellH;

        auto cell = juce::Rectangle<int> (cx, cy, cellW, cellH);

        if (auto* combo = dynamic_cast<juce::ComboBox*> (pl.comp))
        {
            auto labelArea = cell.removeFromTop (18);
            pl.label->setBounds (labelArea);
            combo->setBounds (cell.removeFromTop (26).reduced (4, 0));
        }
        else
        {
            auto labelArea = cell.removeFromTop (16);
            pl.label->setBounds (labelArea);
            pl.comp->setBounds (cell.reduced (2));
        }
    }
}

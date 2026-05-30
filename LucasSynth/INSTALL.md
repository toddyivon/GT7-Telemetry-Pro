# 🎹 LucasSynth — Guia de Instalação

Este guia te leva do zero até o **LucasSynth** tocando dentro da sua DAW.
O plugin roda em **qualquer DAW** porque é compilado nos formatos padrão da
indústria: **VST3** (Windows / macOS / Linux), **AU** (macOS) e **Standalone**
(app que toca sozinho, sem DAW).

> ⚠️ O plugin é distribuído como **código-fonte** e você o **compila uma vez**
> na sua máquina. Não precisa de nenhum SDK pago — o JUCE é baixado
> automaticamente pelo CMake na primeira compilação.

---

## 1. Pré-requisitos

Você precisa de um compilador C++20 e do **CMake ≥ 3.22**.

### 🪟 Windows
1. Instale o [**Visual Studio 2022**](https://visualstudio.microsoft.com/) (a
   edição **Community** é gratuita). Durante a instalação, marque a carga de
   trabalho **"Desenvolvimento para desktop com C++"**.
2. Instale o [**CMake**](https://cmake.org/download/) (marque "Add to PATH").
3. Instale o [**Git**](https://git-scm.com/download/win).

### 🍎 macOS
1. Instale as ferramentas de linha de comando do Xcode:
   ```bash
   xcode-select --install
   ```
2. Instale o CMake (via [Homebrew](https://brew.sh/)):
   ```bash
   brew install cmake
   ```

### 🐧 Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y build-essential cmake git \
  libasound2-dev libx11-dev libxext-dev libxrandr-dev libxinerama-dev \
  libxcursor-dev libfreetype6-dev libgl1-mesa-dev libcurl4-openssl-dev
```

---

## 2. Compilar o plugin

Abra um terminal (no Windows use o **"x64 Native Tools Command Prompt for VS 2022"**
ou o PowerShell), entre na pasta do projeto e rode:

```bash
cd LucasSynth
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release --parallel
```

A primeira compilação demora alguns minutos porque o JUCE é baixado e compilado.
As próximas são bem mais rápidas.

Quando terminar, os plugins ficam em:
```
LucasSynth/build/LucasSynth_artefacts/Release/
├── VST3/LucasSynth.vst3
├── AU/LucasSynth.component        (somente macOS)
└── Standalone/LucasSynth(.exe)
```

> ✅ A opção `COPY_PLUGIN_AFTER_BUILD` já está ligada, então o plugin é
> **copiado automaticamente** para a pasta de plugins do sistema. Na maioria dos
> casos você nem precisa copiar nada à mão — pule direto para o passo 4.

---

## 3. Instalar manualmente (se necessário)

Caso a cópia automática não rode, copie o plugin para a pasta certa:

| Formato | Sistema | Pasta de destino |
|---------|---------|------------------|
| VST3 | Windows | `C:\Program Files\Common Files\VST3\` |
| VST3 | macOS | `~/Library/Audio/Plug-Ins/VST3/` |
| VST3 | Linux | `~/.vst3/` |
| AU | macOS | `~/Library/Audio/Plug-Ins/Components/` |

**Exemplos:**

```bash
# macOS (VST3)
cp -r build/LucasSynth_artefacts/Release/VST3/LucasSynth.vst3 ~/Library/Audio/Plug-Ins/VST3/

# macOS (AU)
cp -r build/LucasSynth_artefacts/Release/AU/LucasSynth.component ~/Library/Audio/Plug-Ins/Components/

# Linux (VST3)
mkdir -p ~/.vst3 && cp -r build/LucasSynth_artefacts/Release/VST3/LucasSynth.vst3 ~/.vst3/
```

No **Windows**, copie a pasta `LucasSynth.vst3` para
`C:\Program Files\Common Files\VST3\` (precisa de permissão de administrador).

---

## 4. Usar na sua DAW

1. Abra a DAW e mande ela **reescanear os plugins**:
   - **Ableton Live:** Preferences → Plug-Ins → Rescan
   - **FL Studio:** Options → Manage Plugins → Find installed plugins
   - **Reaper:** Preferences → Plug-ins → VST → Re-scan
   - **Logic Pro (macOS):** reabre o Logic (ele valida AUs no boot)
   - **Bitwig / Cubase / Studio One:** rescan na seção de plugins
2. Crie uma **faixa de instrumento** e procure por **LucasSynth** na lista.
3. Toque no seu teclado MIDI (ou desenhe notas no piano roll). 🎶

### Sem DAW? Use o Standalone
Abra o executável em `Release/Standalone/`. Vai abrir uma janela com o synth e um
teclado na tela — você pode tocar com o mouse ou conectar um teclado MIDI
(configure a entrada de áudio/MIDI no menu de opções do app).

---

## 5. Conhecendo os controles

| Seção | O que faz |
|-------|-----------|
| **Oscillator 1 / 2** | Os dois osciladores principais: forma de onda, oitava, detune, volume |
| **Unison** | Empilha até 7 vozes detunadas por oscilador (som "supersaw" gordo) |
| **Mix** | Sub-oscilador (grave) e ruído branco |
| **Amp Envelope** | Envelope ADSR do volume (ataque/decaimento/sustain/release) |
| **Filter** | Filtro ressonante (passa-baixa/alta/banda) + quanto o envelope/teclado abre o corte |
| **Filter Envelope** | ADSR que modula o corte do filtro |
| **LFO** | Oscilador lento roteável para pitch (vibrato), corte e volume (tremolo) |
| **Master** | Volume geral e glide (portamento entre notas) |

> 💡 A sua DAW salva **todas as posições dos knobs** junto com o projeto.

---

## 6. Problemas comuns

- **"A DAW não acha o plugin"** → confira se ela escaneia a pasta de plugins
  correta (passo 3) e force um rescan. No macOS, plugins AU às vezes só aparecem
  depois de reiniciar a DAW.
- **macOS bloqueia o plugin ("desenvolvedor não identificado")** → vá em
  *Ajustes do Sistema → Privacidade e Segurança* e clique em **"Abrir mesmo
  assim"**. (O plugin não é assinado/notarizado.)
- **Erro de compilação no Linux** → quase sempre é alguma `-dev` faltando;
  reinstale a lista do passo 1.
- **Primeira compilação falha baixando o JUCE** → confira sua conexão; o CMake
  precisa de internet só na primeira vez para clonar o JUCE.

---

Feito com ❤️. Bom som! 🎛️

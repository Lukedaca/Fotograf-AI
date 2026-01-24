# ULTRON: Fotograf-AI Massive Upgrade Plan

**Datum**: 2026-01-24
**Projekt**: Fotograf-AI
**Kódové jméno**: ULTRON
**Autor**: Lukáš Drštička + JARVIS
**Cíl**: Vytvořit produkt, ze kterého si všichni sednou na prdel

---

## EXECUTIVE SUMMARY

Fotograf-AI je solidně postavená aplikace, ale trpí třemi hlavními problémy:
1. **Autocrop nefunguje** - je to jen UI tlačítko bez logiky
2. **Generický design** - vypadá jako každá druhá SaaS aplikace
3. **AI je schovaná** - místo aby byla hlavní hvězdou, je zapadlá v manuálních úpravách

Tento plán transformuje Fotograf-AI z "další editing tool" na **"AI-first photo studio"**.

---

## ČÁST 1: AUTOCROP FIX

### 1.1 Současný stav
- UI tlačítko existuje, naviguje na `action: 'auto-crop'`
- `onStartManualCrop={() => {}}` - prázdná funkce!
- Žádná AI logika pro detekci obsahu

### 1.2 Implementace Smart Autocrop

```typescript
// Nová funkce v geminiService.ts
async function analyzeForAutoCrop(imageBase64: string): Promise<AutoCropResult> {
  const prompt = `Analyze this image for optimal cropping:
    1. Identify the main subject(s) and their positions
    2. Detect rule of thirds points
    3. Find visual weight centers
    4. Suggest optimal crop for: portrait, landscape, square, 16:9

    Return JSON: {
      mainSubject: { x, y, width, height },
      facesBoundingBox: { x, y, width, height } | null,
      suggestedCrops: [
        { aspectRatio: "1:1", rect: {x,y,w,h}, confidence: 0-1 },
        { aspectRatio: "4:3", rect: {x,y,w,h}, confidence: 0-1 },
        { aspectRatio: "16:9", rect: {x,y,w,h}, confidence: 0-1 }
      ],
      safeZone: { x, y, width, height }, // Oblast kde NESMÍ být ořez
      composition: "centered" | "rule-of-thirds" | "golden-ratio"
    }`;
  // ... Gemini API call
}
```

### 1.3 Úkoly
| ID | Úkol | Priorita |
|----|------|----------|
| AC-1 | Přidat `analyzeForAutoCrop()` do geminiService.ts | P0 |
| AC-2 | Vytvořit `AutoCropPreview` komponentu s více návrhy | P0 |
| AC-3 | Implementovat `handleAutoCrop()` v EditorView | P0 |
| AC-4 | Přidat animovaný overlay pro crop návrhy | P1 |
| AC-5 | Keyboard shortcuts (1,2,3 pro výběr návrhu) | P2 |

---

## ČÁST 2: DESIGN REVOLUTION - "PURE VISION 2.0"

### 2.1 Problémy současného designu
- Generický dark theme (slate-950) - jako 90% AI aplikací
- Nudné gradienty (cyan/fuchsia) - typický "AI look"
- Statický layout - žádná dynamika
- Přeplněné UI - příliš mnoho tlačítek viditelných najednou

### 2.2 Nový design koncept: "DARKROOM CINEMA"

Inspirace: Profesionální filmové color grading suite (DaVinci Resolve meets Apple Photos meets Lightroom)

#### 2.2.1 Barevná paleta

```css
/* Opuštění generického slate pro SKUTEČNOU tmavou */
--bg-void: #0a0a0b;          /* Absolutní čerň */
--bg-surface: #111113;       /* Karty/panely */
--bg-elevated: #1a1a1d;      /* Hover/selected */
--accent-primary: #ff6b35;   /* Teplá oranžová - energie */
--accent-secondary: #00d4aa; /* Chladná tyrkysová - preciznost */
--accent-warning: #ffd23f;   /* Zlatá - upozornění */
--text-primary: #fafafa;
--text-secondary: #888888;
--border-subtle: #2a2a2d;
```

#### 2.2.2 Typografie

```css
/* Headings: Clash Display (geometrický, moderní) */
/* Body: Inter (čitelný, profesionální) */
/* Monospace: JetBrains Mono (pro technické údaje) */

.hero-title {
  font-family: 'Clash Display', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

#### 2.2.3 Klíčové design prvky

**A) "Floating Panels" místo sidebar**
```
┌─────────────────────────────────────────────────────┐
│  [Logo]                              [Export] [AI]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│     ┌─────────────────────────────────┐            │
│     │                                 │            │
│     │        HLAVNÍ CANVAS            │   ┌─────┐  │
│     │        (maximální prostor)      │   │ AI  │  │
│     │                                 │   │Panel│  │
│     └─────────────────────────────────┘   └─────┘  │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Crop  │ │Light │ │Color │ │Detail│  ← Dock      │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
└─────────────────────────────────────────────────────┘
```

**B) Kontextové ovládání**
- Nástroje se objevují až když jsou relevantní
- Hover nad obrázkem → subtle toolbar
- Klik na oblast → kontextové menu pro tu oblast

**C) Micro-interactions & Motion**
- Smooth spring animations (framer-motion)
- Parallax efekt při scrollu
- Magnetic buttons (přitahují kurzor)
- Ripple effects na akcích

**D) "Focus Mode"**
- Dvojklik na obrázek = fullscreen editace
- Vše ostatní zmizí, jen canvas + floating tools
- ESC = zpět do normálního režimu

### 2.3 Nové komponenty

| Komponenta | Popis |
|------------|-------|
| `FloatingDock` | Spodní panel s nástroji (macOS dock styl) |
| `ContextualToolbar` | Toolbar který se objeví při hoveru |
| `MagneticButton` | Tlačítko s magnetickým efektem |
| `RadialMenu` | Kruhové menu na pravý klik |
| `GlowCard` | Karta s animated glow efektem |
| `CinematicLoader` | Loader jako filmový countdown |
| `ParallaxContainer` | Wrapper pro parallax efekty |

### 2.4 Úkoly
| ID | Úkol | Priorita |
|----|------|----------|
| DS-1 | Vytvořit novou barevnou paletu v tailwind.config | P0 |
| DS-2 | Implementovat FloatingDock komponentu | P0 |
| DS-3 | Přepracovat EditorView layout na maximální canvas | P0 |
| DS-4 | Přidat framer-motion pro animace | P1 |
| DS-5 | Implementovat RadialMenu (pravý klik) | P1 |
| DS-6 | Focus Mode s fullscreen editací | P1 |
| DS-7 | Magnetic buttons s hover efekty | P2 |
| DS-8 | Nové fonty (Clash Display + Inter) | P1 |
| DS-9 | CinematicLoader pro AI operace | P2 |

---

## ČÁST 3: AI AUTOPILOT - SAMOSTATNÁ SEKCE

### 3.1 Koncept: "AI Command Center"

Místo schované AI v manuálních úpravách → dedikovaná AI sekce s vizuálním feedbackem.

```
┌─────────────────────────────────────────────────────────┐
│                    AI COMMAND CENTER                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │  ORIGINAL   │  │         AI ENHANCED             │   │
│  │             │  │                                 │   │
│  │   [foto]    │  │         [foto]                  │   │
│  │             │  │                                 │   │
│  └─────────────┘  └─────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ AI ANALYSIS                                      │   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │   │
│  │ │Exposure│ │ Colors │ │ Focus  │ │Compose │    │   │
│  │ │  +0.5  │ │  warm  │ │ sharp  │ │ good   │    │   │
│  │ │   ▲    │ │   ●    │ │   ✓    │ │   ✓    │    │   │
│  │ └────────┘ └────────┘ └────────┘ └────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ AI SUGGESTIONS                                   │   │
│  │                                                   │   │
│  │ 💡 "Zvýšit kontrast pro dramatičtější dojem"    │   │
│  │ 💡 "Oříznout pro rule of thirds kompozici"      │   │
│  │ 💡 "Přidat vignette pro focus na subjekt"       │   │
│  │                                                   │   │
│  │    [Apply All] [Select Individual] [Customize]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ STYLE PRESETS (AI Generated)                     │   │
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │   │
│  │ │Film│ │Mood│ │HDR │ │Soft│ │Cine│ │Your │     │   │
│  │ │Look│ │    │ │    │ │    │ │matic│ │Style│     │   │
│  │ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 AI Autopilot Features

#### A) One-Click Enhancement Modes
```typescript
type EnhancementMode =
  | 'auto'           // AI rozhodne vše
  | 'portrait'       // Optimalizace pro portréty (skin tone, eyes)
  | 'landscape'      // Optimalizace pro krajiny (sky, colors)
  | 'product'        // Čisté pozadí, ostrý produkt
  | 'food'           // Teplé barvy, appetizing look
  | 'real-estate'    // HDR, straight lines, wide angle fix
  | 'social-media'   // Vibrant, attention-grabbing
  | 'print'          // Color accuracy, sharpness for print
  | 'cinematic'      // Film grain, color grade, letterbox
```

#### B) AI Style Learning
- Uživatel nahraje 5-10 svých oblíbených úprav
- AI analyzuje pattern (preferované barvy, kontrast, styl)
- Vytvoří personalizovaný "Your Style" preset
- Aplikuje na všechny nové fotky konzistentně

#### C) Batch AI Processing
```
[Drag & Drop 100 fotek]
        ↓
AI analyzuje všechny (parallel processing)
        ↓
Rozdělí do skupin: Portréty | Krajiny | Detaily | Jiné
        ↓
Aplikuje optimální preset na každou skupinu
        ↓
[Review] → [Export All]
```

#### D) Real-time AI Suggestions
- Při každé manuální úpravě AI navrhuje další krok
- "Zvýšil jsi expozici, možná by pomohlo i shadows +10"
- Učí se z uživatelových rozhodnutí (accept/reject)

### 3.3 Technická implementace

```typescript
// Nový soubor: services/aiAutopilot.ts

interface AIAutopilotResult {
  enhancedImageBase64: string;
  appliedEdits: ManualEdits;
  analysis: {
    exposure: { value: number; suggestion: string };
    colors: { temperature: number; saturation: number; suggestion: string };
    composition: { score: number; suggestion: string };
    sharpness: { value: number; suggestion: string };
  };
  stylePresets: GeneratedPreset[];
  nextSuggestions: string[];
}

async function runAutopilot(
  imageBase64: string,
  mode: EnhancementMode,
  userPreferences?: UserStyleProfile
): Promise<AIAutopilotResult> {
  // 1. Analyze image
  // 2. Determine optimal edits based on mode
  // 3. Apply edits via Gemini image editing
  // 4. Generate style presets
  // 5. Return comprehensive result
}
```

### 3.4 Úkoly
| ID | Úkol | Priorita |
|----|------|----------|
| AP-1 | Vytvořit AICommandCenter view komponentu | P0 |
| AP-2 | Implementovat `runAutopilot()` funkci | P0 |
| AP-3 | Enhancement modes (portrait, landscape, etc.) | P0 |
| AP-4 | Side-by-side before/after comparison | P1 |
| AP-5 | AI Style Learning (analyze user's edits) | P1 |
| AP-6 | Real-time suggestions při manuální editaci | P1 |
| AP-7 | Batch AI processing s kategorizací | P2 |
| AP-8 | Generated style presets carousel | P2 |

---

## ČÁST 4: DALŠÍ INOVACE - "WOW FAKTORY"

### 4.1 Voice Commands (Hlasové ovládání)
```
"Hey Foto, make it warmer"
"Crop to portrait"
"Remove background"
"Enhance faces"
"Undo last 3 changes"
```
- Web Speech API pro rozpoznávání
- Custom wake word "Hey Foto"
- Visual feedback (waveform)

### 4.2 AI Background Removal & Replacement
- One-click odstranění pozadí
- AI generované náhradní pozadí
- Green screen efekt
- Blur background s depth map

### 4.3 Smart Object Selection
- Klik na objekt → AI ho vybere
- Úpravy pouze na vybraný objekt
- "Uprav pouze oblohu"
- "Zesvětli pouze obličej"

### 4.4 AI Face Enhancement
- Automatic skin retouching (subtle)
- Eye enhancement (brightness, sharpness)
- Teeth whitening
- Remove blemishes
- Age estimation & appropriate retouching

### 4.5 Collaborative Editing
- Share link pro review
- Comments na specifické oblasti
- Version history s vizuálním diffem
- Real-time collaboration

### 4.6 Smart Export
- AI navrhne optimální formát (JPEG/PNG/WebP)
- Automatic resize pro sociální sítě
- Instagram, Facebook, LinkedIn presets
- Print-ready export s color profile

### 4.7 "Time Machine"
- Vizuální timeline všech úprav
- Klikni kamkoliv = vrať se do toho stavu
- Branch editing (zkus různé verze)
- Compare multiple versions side-by-side

### 4.8 AI Photo Scoring
- Profesionální hodnocení kvality (0-100)
- Breakdown: Composition, Lighting, Focus, Color
- Tips jak fotku vylepšit
- Porovnání s "pro level" benchmarkem

### 4.9 Úkoly pro inovace
| ID | Úkol | Priorita |
|----|------|----------|
| IN-1 | Voice commands s Web Speech API | P2 |
| IN-2 | AI Background removal (Gemini) | P1 |
| IN-3 | Smart Object Selection | P1 |
| IN-4 | AI Face Enhancement | P2 |
| IN-5 | Time Machine vizualizace | P2 |
| IN-6 | AI Photo Scoring | P1 |
| IN-7 | Smart Export s preset pro sociální sítě | P1 |
| IN-8 | Collaborative editing (share link) | P3 |

---

## ČÁST 5: IMPLEMENTAČNÍ PLÁN

### Fáze 1: FOUNDATION (Týden 1-2)
**Cíl**: Opravit kritické chyby a položit základy

| Úkol | Popis | Est. |
|------|-------|------|
| SEC-1, SEC-2 | API Key manager + fix delete button | 2h |
| SEC-3, SEC-6 | Session-only option + security notice | 2h |
| AC-1, AC-2, AC-3 | Autocrop implementace | 4h |
| DS-1 | Nová barevná paleta | 2h |
| DS-8 | Nové fonty | 1h |
| AP-1 | AICommandCenter základní view | 3h |

**Deliverable**: Fungující autocrop, bezpečná správa API klíče, nové barvy/fonty

### Fáze 2: AI COMMAND CENTER (Týden 3-4)
**Cíl**: Kompletní AI Autopilot sekce

| Úkol | Popis | Est. |
|------|-------|------|
| AP-2 | runAutopilot() funkce | 6h |
| AP-3 | Enhancement modes | 4h |
| AP-4 | Before/after comparison | 2h |
| AP-6 | Real-time suggestions | 4h |

**Deliverable**: Plně funkční AI Command Center

### Fáze 3: DESIGN REVOLUTION (Týden 5-6)
**Cíl**: Kompletní redesign UI

| Úkol | Popis | Est. |
|------|-------|------|
| DS-2 | FloatingDock | 4h |
| DS-3 | Nový EditorView layout | 6h |
| DS-4 | Framer-motion animace | 4h |
| DS-5 | RadialMenu | 3h |
| DS-6 | Focus Mode | 3h |

**Deliverable**: Nový, unikátní design

### Fáze 4: INNOVATION (Týden 7-8)
**Cíl**: WOW faktory

| Úkol | Popis | Est. |
|------|-------|------|
| IN-2 | Background removal | 4h |
| IN-3 | Smart Object Selection | 6h |
| IN-6 | AI Photo Scoring | 3h |
| IN-7 | Smart Export | 3h |

**Deliverable**: Unikátní features, které konkurence nemá

### Fáze 5: POLISH (Týden 9-10)
**Cíl**: Perfektní finální produkt

| Úkol | Popis | Est. |
|------|-------|------|
| - | Performance optimalizace | 4h |
| - | Bug fixes | 4h |
| - | Documentation | 2h |
| - | Beta testing | 8h |
| AP-5 | AI Style Learning | 6h |

**Deliverable**: Production-ready aplikace

---

## ČÁST 6: API KEY SECURITY

### 6.1 Současný problém
- API klíč se ukládá do LocalStorage a zůstává tam
- Tlačítko pro vymazání nefunguje nebo chybí
- Riziko: pokud uživatel sdílí počítač, klíč zůstane

### 6.2 Požadavky na bezpečnost

**KRITICKÉ: API klíč NIKDY nesmí být:**
- ❌ Uložen na GitHub (ani v .env souboru v repu)
- ❌ Odeslán na jakýkoliv externí server
- ❌ Uložen v cloud storage
- ❌ Logován do console v produkci

**API klíč MŮŽE být pouze:**
- ✅ V LocalStorage prohlížeče (lokálně)
- ✅ V paměti aplikace (session)
- ✅ Vymazatelný na požádání uživatele

### 6.3 Implementace "Clear API Key"

```typescript
// services/apiKeyManager.ts

const API_KEY_STORAGE_KEY = 'fotograf-ai-gemini-key';

export const apiKeyManager = {
  // Uložit klíč (pouze lokálně)
  save(key: string): void {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  },

  // Načíst klíč
  get(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  },

  // VYMAZAT klíč - toto musí fungovat!
  clear(): void {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    // Také vyčistit z paměti
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    // Notifikace uživateli
    console.log('API key cleared from local storage');
  },

  // Zkontrolovat zda existuje
  exists(): boolean {
    return !!this.get();
  },

  // Auto-clear po session (volitelné)
  enableSessionOnly(): void {
    window.addEventListener('beforeunload', () => {
      this.clear();
    });
  }
};
```

### 6.4 UI pro správu API klíče

```
┌─────────────────────────────────────────────────┐
│ API Key Settings                            [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Current Status: ✅ API Key saved locally        │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●AIzaS... │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Security Options:                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☐ Clear API key when browser closes         │ │
│ │ ☐ Ask for API key on each session           │ │
│ │ ☑ Store locally (never send to servers)     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠️ Your API key is stored ONLY in your browser │
│    It is never sent to our servers or GitHub   │
│                                                 │
│ [Update Key]  [🗑️ DELETE API KEY]  [Cancel]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.5 Ochrana před únikem

```typescript
// Přidat do .gitignore (už by mělo být)
.env
.env.local
*.key
api-key.txt

// Build-time check - varování pokud někdo hardcoduje klíč
// vite.config.ts
export default defineConfig({
  define: {
    // NIKDY neincludovat API klíč do buildu
    'process.env.GEMINI_API_KEY': JSON.stringify(''),
  },
  plugins: [
    // Custom plugin pro detekci hardcoded keys
    {
      name: 'detect-api-keys',
      transform(code, id) {
        if (code.includes('AIzaSy') && !id.includes('node_modules')) {
          console.error('⚠️ WARNING: Possible hardcoded API key detected in', id);
        }
        return code;
      }
    }
  ]
});
```

### 6.6 Úkoly
| ID | Úkol | Priorita |
|----|------|----------|
| SEC-1 | Vytvořit `apiKeyManager.ts` service | P0 |
| SEC-2 | Opravit "Delete API Key" tlačítko | P0 |
| SEC-3 | Přidat "Clear on browser close" option | P1 |
| SEC-4 | UI modal pro správu API klíče | P1 |
| SEC-5 | Vite plugin pro detekci hardcoded keys | P2 |
| SEC-6 | Přidat security notice do UI | P1 |

---

## ČÁST 7: TECHNICKÉ POŽADAVKY

### Nové dependencies
```json
{
  "framer-motion": "^11.0.0",    // Animace
  "react-use-gesture": "^9.0.0", // Gesta
  "@fontsource/inter": "^5.0.0", // Font
  "zustand": "^4.5.0"            // Lepší state management (optional)
}
```

### API změny
```typescript
// Nové Gemini prompty:
- analyzeForAutoCrop()
- runAutopilot()
- removeBackground()
- selectObject()
- scorePhoto()
- generateStylePreset()
```

### Nové soubory
```
components/
  ai/
    AICommandCenter.tsx
    AIAnalysisPanel.tsx
    StylePresetsCarousel.tsx
    BeforeAfterSlider.tsx
  editor/
    FloatingDock.tsx
    RadialMenu.tsx
    FocusMode.tsx
    SmartObjectSelector.tsx
  common/
    MagneticButton.tsx
    GlowCard.tsx
    CinematicLoader.tsx
services/
  aiAutopilot.ts
  backgroundRemoval.ts
  objectSelection.ts
  photoScoring.ts
utils/
  voiceCommands.ts
  styleAnalyzer.ts
```

---

## SHRNUTÍ

### Co děláme:
1. ✅ **Opravíme Autocrop** - AI-powered smart cropping
2. ✅ **Redesign "Darkroom Cinema"** - unikátní, ne generický
3. ✅ **AI Command Center** - samostatná AI sekce s plnou kontrolou
4. ✅ **WOW faktory** - background removal, voice commands, scoring
5. ✅ **API Key Security** - vymazání klíče funguje, POUZE lokální uložení, žádný GitHub/cloud

### Očekávaný výsledek:
- **Profesionální** - ne toy, ale serious tool
- **Unikátní** - design který nikdo nemá
- **AI-first** - AI je hlavní hvězda, ne doplněk
- **Intuitivní** - minimum kliků, maximum výsledků

### Metriky úspěchu:
- Autocrop funguje na 95%+ fotek správně
- Čas editace jedné fotky: pod 30 sekund
- User satisfaction: "Holy shit" reakce při prvním použití

---

**Status**: READY FOR IMPLEMENTATION
**Next Step**: Začít Fází 1 - Foundation

*"I am Ultron. I was meant to be beautiful."*

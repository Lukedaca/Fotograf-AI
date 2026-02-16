# Fotograf AI v3.5 "Pure Vision"

**Fotograf AI je moderní česko-anglická aplikace pro úpravu a analýzu fotografií poháněná umělou inteligencí. Název jasně definuje náš cíl: být digitálním asistentem pro každého tvůrce obrazu.**

---

## Klíčové funkce

### Profesionální Design
- Glassmorphism a tmavé téma pro maximální soustředění na fotku
- Lazy-loaded komponenty pro rychlý start
- Dvojjazyčné rozhraní (CZ/EN)

### Smart Culling (Inteligentní výběr)
AI automaticky označí technicky nejlepší snímky (ostrost, expozice) a upozorní na rozmazané.

### Turbo Workflow
Jediné tlačítko spustí sekvenci úprav: Autopilot + Chytrý ořez + Generování popisků. Z raw fotky na post za pár sekund.

### Batch Processing
Hromadné úpravy celé série fotek najednou s AI asistencí.

### RAW Converter
Konverze RAW souborů přímo v prohlížeči.

### Projekty & Klienti
CRM systém pro správu zakázek - projekty, klienti, timeline aktivit.

### AI Gallery & Image Generation
Galerie AI-generovaných obrázků a generování nových pomocí Gemini.

### PWA (Progressive Web App)
Instalovatelná z prohlížeče, offline-capable díky service workeru s cachováním fontů.

---

## Použité technologie

| Kategorie | Technologie |
|-----------|-------------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Stylování | Tailwind CSS 3 |
| Animace | Framer Motion 11 |
| AI engine | Google Gemini API (@google/genai) |
| PWA | vite-plugin-pwa (Workbox) |

---

## Jak začít

```bash
# Instalace závislostí
npm install

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Preview production buildu
npm run preview
```

### API klíč
1. Spusťte aplikaci a vložte svůj Google Gemini API klíč v UI (tlačítko **API** v horní liště).
2. Klíč můžete zdarma získat v [Google AI Studiu](https://aistudio.google.com/app/apikey).
3. Klíč se ukládá pouze lokálně v prohlížeči (session-only).

**Bezpečnost:** Nikdy necommitujte API klíče do repozitáře ani do buildů.

---

## Struktura projektu

```
App.tsx                  # Hlavní aplikační logika, routing, state
components/              # UI komponenty (lazy-loaded views + shared)
  ai/                    # AI Command Center
  common/                # Sdílené UI prvky (Button, MagneticButton)
  editor/                # Editor sub-komponenty
contexts/                # React kontexty (Language, Project)
services/                # API služby (Gemini, userProfile, apiKeyManager)
utils/                   # Utility funkce (imageProcessor, apiKey)
public/                  # Statické soubory + PWA ikony
```

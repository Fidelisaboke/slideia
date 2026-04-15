# Purple Mint — Slideia Brand Design System

> **Theme:** Calm Tech / Purple Mint
> **Core Feel:** Regal confidence, modern minimalism, refined engineering

## 1. Brand Overview

This design system is built around a **refined, modern purple-and-mint aesthetic**, balancing:

- **Professionalism** — AI/SaaS focus with premium polish
- **Approachability** — cool mint accents keep the regal purple fresh and energetic
- **Uniqueness** — a distinctive palette that separates Slideia from typical blue-themed productivity tools

## 2. Typography

### Primary Font (Headings)
**Sora**
- Use for: slide titles, hero text, section headers
- Characteristics: modern, geometric, distinctive
- Weights: 600, 700, 800

### Secondary Font (Body)
**Inter**
- Use for: bullet points, UI text, labels, buttons, speaker notes
- Characteristics: highly readable, clean, versatile
- Weights: 400, 500, 600, 700

## 3. Core Color System

### 🌙 Dark Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| **Primary** | `#A78BFA` | Interactive elements, active states, user message bubbles |
| **Primary Hover** | `#9474EB` | Hover/pressed states |
| **Secondary** | `#5EEAD4` | Mint accents, highlights, gradient endpoints |
| **Background** | `#0D0B14` | Main application background |
| **Background Subtle** | `#13111D` | Empty states, recessed input areas |
| **Surface** | `#1A1726` | Slide cards, containers, sidebar/navbar fills |
| **Surface Glass** | `rgba(26, 23, 38, 0.78)` | Assistant messages, header panels |
| **Border** | `rgba(167, 139, 250, 0.15)` | Dividers, card borders, message outlines |
| **Text Primary** | `#EDEBF4` | Headings, main UI labels |
| **Text Secondary** | `#A09BB5` | Muted descriptions, metadata labels |

### 🌞 Light Mode

| Token | Hex | Usage |
|---|---|---|
| **Primary** | `#7C5CCA` | Interactive elements, active states |
| **Primary Hover** | `#6A4BB5` | Hover/pressed states |
| **Secondary** | `#14B8A6` | Mint highlights, accent UI |
| **Background** | `#FAF8FF` | Main application background |
| **Background Subtle** | `#F0ECFA` | Recessed areas |
| **Surface** | `#FFFFFF` | Cards, elevated containers |
| **Surface Glass** | `rgba(255, 255, 255, 0.82)` | Glassmorphism panels |
| **Border** | `rgba(124, 92, 202, 0.15)` | Dividers, borders |
| **Text Primary** | `#1A1726` | Main text color |
| **Text Secondary** | `#5A5370` | Muted labels |

## 4. Gradient System

### 4.1 Brand Gradient (Diagonal)
```css
/* Dark */  linear-gradient(135deg, #A78BFA, #5EEAD4)
/* Light */ linear-gradient(135deg, #7C5CCA, #14B8A6)
```
- Available via `.gradient-text` utility
- Use for: Hero headlines, "Slideia" logo branding

### 4.2 Action Gradient (Purple)
```css
linear-gradient(135deg, #8B6FE0, #A78BFA)
```
- Available via `.gradient-button` utility
- Use for: Primary CTA buttons ("Generate", "Export"), user message bubbles

### 4.3 Accent Gradient (Mint)
```css
/* Dark */  linear-gradient(135deg, #3DD4BE, #5EEAD4)
/* Light */ linear-gradient(135deg, #0D9488, #14B8A6)
```
- Available via `.gradient-mint` utility
- Use for: Secondary actions, subtle success highlights

## 5. Components & Logic

### 5.1 Slide Editor (DeckView)
- Slide cards use `.glass-panel` with `.glow-border`.
- Titles are editable inline via Sora font.
- Bullet points use Inter (500) with primary-colored markers.
- Hovering a slide card provides a subtle lift animation and border glow.

### 5.2 Chat Interface
- **User Messages**: Use the purple action gradient with white text for high contrast.
- **AI Messages**: Use `.glass-panel` with `.glow-border` to distinguish from user input.
- **Streaming State**: A primary-colored blinking cursor indicates activity.

### 5.3 Feedback Mechanism (Human-in-the-Loop)
- Action buttons for "Regenerate" and "Export" use brand gradients to signify finality and progress.
- Instruction inputs use `bg-background-subtle` to feel embedded within the card.

## 6. Theme & Transitions

- **Default State**: Dark Mode.
- **Toggle Persistence**: Handled via `next-themes` with the `theme` localStorage key.
- **Global Transitions**: Color tokens and backgrounds transition via `0.3s cubic-bezier(0.4, 0, 0.2, 1)`.

## 7. Motion Guidelines

- **Scroll Stagger**: Hero elements and slide lists should use the `staggerContainer` variant for a fluid reveal.
- **Ambient Depth**: Floating purple/mint orbs in the background (`.ambient-orb`) provide a premium "depth" effect without being distracting (8s ease-in-out cycle).
- **Reduced Motion**: All CSS animations and Framer Motion variants respect the `prefers-reduced-motion` browser setting.

# Söcial UI – Cursor Rules & Implementation Guide

This document defines **hard rules** for implementing Söcial’s high‑energy, party‑game UI using Cursor.

It exists to prevent drift toward **SaaS / dashboard / card‑stack UI** and to preserve the **Quiplash‑level pop** that makes the product entertaining on shared screens.

If Cursor output violates these rules, it should be refactored immediately.

---

## Core Principle (Non‑Negotiable)

> **Exactly ONE hero surface. Everything else floats.**

If more than one element looks like a card or panel, the UI is wrong.

This is not an app or a dashboard.
This is a **stage**.

---

## Mental Model

- Prompt = stage
- Answers = performers
- Reactions = sparks
- UI = invisible scaffolding

Elements are **props**, not components.

---

## Layout Architecture

All screens must be implemented using **three flat layers**:

1. **Background Energy Layer**
   - Decorative only
   - Ambient motion (orbs, glows, noise)
   - Never re‑rendered
   - `pointer-events: none`

2. **Stage Layer**
   - Prompt
   - Answers
   - Paused overlay
   - Real‑time text

3. **Interaction Layer**
   - Buttons
   - Inputs
   - Tap targets

Layers must not be nested inside cards or panels.

---

## Canonical DOM Shape

Cursor should always converge toward this structure:

```
<body>
  <BackgroundEnergy />
  <Stage />
  <UIControls />
</body>
```

Any additional wrapper must be justified.

---

## Prompt Rules (The Only Card)

The prompt is the **only element** allowed to appear as a surface.

**Required traits:**
- Large, dominant typography (`clamp()` preferred)
- Heavy font weight
- Slight rotation
- Strong text shadow
- One‑time entrance animation

**Forbidden:**
- Continuous animation
- Nested content panels
- Secondary prompt cards

---

## Answers Rules

Answers must:
- Be **raw text**
- Have **no backgrounds**
- Have **no borders**
- Have **no panels or cards**

Energy should come from:
- Rotation
- Scale
- Spacing
- Text shadow

If an answer looks like a UI component, it violates the rules.

---

## Reactions / Voting

Reactions should feel:
- Thrown onto the screen
- Temporary
- Playful

Implementation guidance:
- Pills or emojis only
- No grids
- No containers
- No feed layouts

---

## Paused State

Paused UI must:
- Float above the stage
- Not block layout
- Not introduce a new card or modal

Timers:
- Update text only
- Never cause layout shifts
- Use tabular numerals

Paused should feel like an overlay, not a dialog.

---

## Animation Rules

**Allowed to animate:**
- `transform`
- `opacity`

**Never animate:**
- `width`
- `height`
- `top / left`
- `font-size`
- `box-shadow`

Guidelines:
- Fast, exaggerated entrance
- Calm idle state
- Maximum **2 concurrent idle animations**

---

## Performance Constraints

This UI is long‑lived and real‑time.

Cursor must optimize for:
- Frame consistency
- Mobile GPUs
- Real‑time updates

**Required practices:**
- DOM depth ≤ 6 levels in animated areas
- Pre‑size elements that receive dynamic text
- Isolate timers and counters
- Background animations must never re‑render

---

## Typography Rules

To prevent layout jitter:

- Use `font-variant-numeric: tabular-nums` for:
  - Timers
  - Counters
  - Scores
- Set fixed or minimum widths for live text
- Center-align dynamic labels

---

## Responsive Behavior

### Desktop / TV
- Full chaos
- Background energy enabled
- Larger rotations

### Mobile
- Fewer background elements
- Slower motion
- Same hierarchy

Do not create separate layouts — only scaled behavior.

---

## Forbidden Patterns (Hard Fail)

Cursor must never generate:

- Card stacks
- Nested panels
- Feed layouts
- Dashboard chrome
- Grid‑based answers
- Equal‑weight UI elements

If any of these appear, refactor immediately.

---

## Validation Checklist

Before committing, confirm:

- Exactly **one** hero surface exists
- Answers are floating text
- DOM is shallow and readable
- Chaos comes from motion, not structure
- Screen is readable from across the room

If unsure, simplify.

---

## Recommended Cursor Instruction Snippet

Use this at the top of Cursor prompts when implementing UI:

> Implement this as a stage‑based party UI with a single hero prompt surface and floating content. Avoid card‑based layouts, nested panels, feeds, or dashboard patterns. Prioritize transform‑based animation, minimal DOM depth, and high visual impact.

---

## Final Reminder

> **Less UI. Louder impact.**

Quiplash energy comes from restraint, not excess.

If something feels boring, remove structure — not add components.


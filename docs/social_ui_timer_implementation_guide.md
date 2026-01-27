# Söcial UI – Timer Implementation Guide

This guide defines **exactly how timers must behave and appear** in Söcial’s UI.

The timer is a critical UX element, but it must never compete with the prompt or answers except at the exact moment urgency matters.

---

## Core Rule

> **The timer has two modes: Peripheral → Critical.**

- Peripheral mode is the default.
- Critical mode is a short, intentional escalation near zero.

If the timer is always loud, it fails.
If the timer is always quiet, it fails.

---

## Mental Model

The timer is like a heartbeat monitor:
- You ignore it when things are stable
- You notice it instantly when something is wrong

It is **not content**.
It is **state feedback**.

---

## Mode 1: Peripheral (Default)

### Purpose
- Communicate state ("paused", "time remaining")
- Provide reassurance
- Stay out of the way

### Visual Rules
- Fixed position (corner of screen)
- Small font
- Uppercase
- Low opacity
- No background
- No border
- No glow
- No animation tied to time

### Placement
- Top-right or top-left
- Never centered
- Never inside the stage

### Example Style

```css
.timer {
  position: fixed;
  top: 1rem;
  right: 1.2rem;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.6;
  pointer-events: none;
}
```

---

## Mode 2: Critical (Final Seconds)

### Purpose
- Create urgency
- Pull attention briefly
- Signal impending lock-in

This mode is allowed to temporarily break the visual hierarchy — but only for a few seconds.

---

## When to Enter Critical Mode

Choose **one clear threshold** and keep it consistent:

- 10 seconds remaining (recommended)
- 8 seconds for shorter rounds

Do not gradually ramp up.
Switch instantly.

```js
const critical = timeLeft <= 10;
```

---

## Allowed Changes in Critical Mode

### 1. Scale (No Re-layout)

```css
.timer.critical {
  transform: scale(1.4);
  opacity: 1;
}
```

- Never reposition
- Never wrap in a container

---

### 2. Color Shift (Single Color)

```css
.timer.critical {
  color: #ff3b3b;
}
```

- One solid color
- No gradients
- No glow

---

### 3. Pulse Once Per Second

Pulse must align with seconds, not frames.

```css
.timer.critical {
  animation: tick 1s steps(1) infinite;
}

@keyframes tick {
  50% { transform: scale(1.55); }
}
```

This creates a heartbeat effect that players instinctively understand.

---

### 4. Optional: Slight Position Nudge

This is the maximum allowed movement:

```css
.timer.critical {
  top: 3.5rem;
}
```

Still an overlay. Still not stage content.

---

## Forbidden Even in Critical Mode

🚫 Never:
- Add a background
- Turn it into a card
- Center it
- Add particles or effects
- Animate layout properties
- Compete visually with the prompt

If the timer feels "cool", it is wrong.

---

## Zero State (Time = 0)

At zero:
- Freeze the timer
- Remove animation immediately
- Optionally fade it out

```css
.timer.done {
  animation: none;
  opacity: 0.4;
}
```

The moment of impact belongs to the prompt or answers — not the timer.

---

## React Implementation Pattern

```jsx
const Timer = React.memo(({ timeLeft }) => {
  const critical = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className={`timer ${critical ? 'critical' : ''}`}>
      {timeLeft}s
    </div>
  );
});
```

### Rules
- Memoized
- Receives only primitive props
- No layout logic
- No animation logic in JS

---

## Typography Constraints

To prevent layout jitter:

```css
.timer span {
  font-variant-numeric: tabular-nums;
  min-width: 3ch;
  display: inline-block;
  text-align: right;
}
```

---

## Performance Rules

- Timer updates must not trigger parent re-renders
- Text updates only
- No layout changes during countdown
- CSS handles urgency

---

## Validation Checklist

Before shipping:

- Does the timer stay ignorable most of the time?
- Does it become obvious in the final seconds?
- Does it calm down immediately after zero?
- Does it avoid stealing focus from answers?

If yes — the timer is correct.

---

## Final Reminder

> **Urgency comes from contrast, not volume.**

A quiet timer that suddenly matters is far more powerful than a loud timer that never shuts up.


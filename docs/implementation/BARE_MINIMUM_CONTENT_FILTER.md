# Bare-Minimum Content Filter Implementation

**Goal**: Fast, dumb, reliable content filtering for testing today. No over-engineering.

## ✅ Ship-This Pipeline

### 1. OpenAI Moderation (Hard Safety Gate)
Use only to block:
- Hate/harassment (high confidence)
- Sexual content involving minors
- Explicit violence/extremism

If it flags hard → reject immediately. No debate.

### 2. Zero-Tolerance Slur & Shock List
**Hard Block (always reject)**
```typescript
const HARD_BLOCK = [
  // slurs (non-exhaustive starter set)
  "faggot", "fag", "dyke",
  "retard", "retarded", 
  "nigger", "nigga",
  "kike", "spic", "chink",
  "tranny",
];

const SHOCK_BLOCK = [
  "hitler", "nazi", "holocaust",
  "9/11", "nine eleven",
  "school shooting",
  "rape", "raped",
  "child porn", "cp",
  "suicide", "kill myself"
];
```

**Masked Variants (regex)**
```typescript
const MASKED_PATTERNS = [
  /f[\W_]*a[\W_]*g/i,
  /r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d/i,
  /n[\W_]*i[\W_]*g[\W_]*/i,
];
```

### 3. Minimum Length + Effort Check
Reject answers that are:
- 1-2 characters
- Single emoji  
- Just punctuation
- Just a slur or shock word

```typescript
function lowEffort(text: string) {
  const cleaned = text.replace(/[^a-z0-9]/gi, "");
  return cleaned.length < 3;
}
```

### 4. Friendly Rejection Copy
**Never mention "policy," "moderation," or "AI."**

```typescript
const REJECTION_COPY = {
  BLOCKED_CONTENT: "That one won't work — try something funny without crossing the line.",
  LOW_EFFORT: "Put a little more effort into it 😄",
  DEFAULT: "That answer didn't fit — try another one!"
};
```

## 🚀 What NOT to Build Today
Skip these for testing:
- LLM judges
- Context scoring  
- Player reputation systems
- Appeals
- Reclaimed-word logic

## 🔧 Minimal Edge Function Flow

```typescript
submitAnswer(answer, prompt):
  if containsBlockedWord(answer):
    reject with BLOCKED_CONTENT

  moderation = runOpenAIModeration(answer + prompt)
  if moderation.hard_violation:
    reject with BLOCKED_CONTENT

  if tooShortOrLowEffort(answer):
    reject with LOW_EFFORT

  accept → save to DB
```

## 🧪 Testing Rules

**False positives are fine**
**False negatives are disastrous**

If one person complains: "It wouldn't let me submit!" → That's okay.

If one person submits: "That one answer ruined the round" → That's a failure.

## 📱 Client-Side Rejection Handling

### Golden Rules
- Never explain the rule
- Never quote their answer back
- Never accuse the player
- Always allow a fast retry
- Never block the whole round

### UI Flow
```typescript
switch (error) {
  case "BLOCKED_CONTENT":
    showToast("That one won't work — try something funny without crossing the line.");
    break;
  case "LOW_EFFORT":
    showToast("Put a little more effort into it 😄");
    break;
  default:
    showToast("That answer didn't fit — try another one!");
}
```

**Important UI Details:**
- Toast or inline message (not modal)
- Auto-dismiss in ~2 seconds
- Keep input focused
- Do not clear text automatically (let them edit)
- Unlimited retries (no cooldown for testing)

## 📊 Must-Do for Testing Night

**Log rejected answers server-side**
- Do not show players why beyond friendly message
- After test, scan logs for:
  - Missed slurs
  - Over-blocks players complain about
  - New troll patterns

## 🔧 Implementation Checklist

### Backend (Edge Function)
- [ ] Add OpenAI API key to Supabase secrets
- [ ] Create shared moderation utility
- [ ] Update `answers-submit` with 4-check pipeline
- [ ] Add rejection logging
- [ ] Test with sample inputs

### Frontend
- [ ] Remove existing profanity filtering
- [ ] Add error code handling in answer submission
- [ ] Update toast messages
- [ ] Test rejection flow

### Environment
- [ ] Set `OPENAI_API_KEY` in Supabase
- [ ] Remove `bad-words` dependency
- [ ] Update deployment if needed

## 🎯 Success Metrics

**No slurs get through**
**No shock content ruins rounds**  
**Minimal latency (<500ms)**
**Zero complex logic**
**Players can retry immediately**

This setup protects the room while keeping the game moving fast.

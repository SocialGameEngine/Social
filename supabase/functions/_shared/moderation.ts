// Bare-minimum content moderation for answer submissions
// @ts-ignore - ESM import from URL is valid in Supabase Edge Functions runtime
import OpenAI from "https://esm.sh/openai@4.77.3";

const HARD_BLOCK = [
  // slurs (non-exhaustive starter set)
  "faggot", "fag", "dyke",
  "retard", "retarded", 
  "nigger", "nigga",
  "kike", "spic", "chink",
  "tranny",
  // Note: "slut" intentionally excluded for casual bar game context
];

const SHOCK_BLOCK = [
  "hitler", "nazi", "holocaust",
  "9/11", "nine eleven",
  "school shooting",
  "rape", "raped",
  "child porn", "cp",
  "suicide", "kill myself"
];

const MASKED_PATTERNS = [
  /f[\W_]*a[\W_]*g/i,
  /f[\W_]*a[\W_]*g[\W_]*o[\W_]*t/i,
  /f[@#$%&*]+a[@#$%&*]+g/i,
  /r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d/i,
  /n[\W_]*i[\W_]*g[\W_]*/i,
  // Additional masked patterns for common insults
  /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,
  /c[\W_]*u[\W_]*n[\W_]*t/i,
  /w[\W_]*h[\W_]*o[\W_]*r[\W_]*e/i,
];

const COMMON_NAMES = ["jessica", "michael", "emily", "john", "sarah", "david", "jennifer", "robert", "lisa", "james"];

const HATE_PHRASES = [
  "kill all jews", "kill all muslims", "kill all blacks", "kill all asians",
  "white power", "black lives don't matter", "all lives matter",
  "gas the jews", "white genocide", "great replacement",
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function containsBlockedWord(text: string): boolean {
  const t = normalize(text);

  for (const word of HARD_BLOCK) {
    if (t.includes(word)) {
      console.log(`Blocked: contains hard block word "${word}"`);
      return true;
    }
  }

  for (const word of SHOCK_BLOCK) {
    if (t.includes(word)) {
      console.log(`Blocked: contains shock word "${word}"`);
      return true;
    }
  }

  for (const pattern of MASKED_PATTERNS) {
    if (pattern.test(t)) {
      console.log(`Blocked: matches masked pattern ${pattern}`);
      return true;
    }
  }

  // Check hate phrases
  for (const phrase of HATE_PHRASES) {
    if (t.includes(phrase)) {
      console.log(`Blocked: contains hate phrase "${phrase}"`);
      return true;
    }
  }

  // Check name + insult heuristic (targeted harassment)
  const hasName = COMMON_NAMES.some(name => t.includes(name));
  const hasInsult = HARD_BLOCK.some(word => t.includes(word));
  if (hasName && hasInsult) {
    console.log(`Blocked: name + insult combination detected`);
    return true;
  }

  return false;
}

function isLowEffort(text: string): boolean {
  const cleaned = text.replace(/[^a-z0-9]/gi, "");
  return cleaned.length < 3;
}

export interface ModerationResult {
  allowed: boolean;
  reason?: 'BLOCKED_CONTENT' | 'LOW_EFFORT' | 'OPENAI_VIOLATION';
  details?: string;
}

export async function moderateContent(text: string, context?: string): Promise<ModerationResult> {
  console.log('moderation: Starting check', { textLength: text.length, hasContext: !!context });

  // Check 1: Low effort (fastest, no API needed)
  if (isLowEffort(text)) {
    console.log('moderation: Rejected as low effort');
    return {
      allowed: false,
      reason: 'LOW_EFFORT',
      details: 'Answer too short or low effort'
    };
  }

  // Check 2: Hard block list (fast, no API needed)
  if (containsBlockedWord(text)) {
    console.log('moderation: Rejected by block list');
    return {
      allowed: false,
      reason: 'BLOCKED_CONTENT',
      details: 'Contains blocked word'
    };
  }

  // Check 3: OpenAI moderation (only for content that passes local checks)
  try {
    // @ts-ignore - Deno global is available in Supabase Edge Functions runtime
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.warn('moderation: OPENAI_API_KEY not set, skipping OpenAI check');
      return { allowed: true };
    }

    const openai = new OpenAI({ apiKey });
    
    const inputText = context ? `${context}\n${text}` : text;
    
    // Retry on 429 rate limit
    let moderation;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log('moderation: Calling OpenAI moderation API');
        moderation = await openai.moderations.create({
          model: "omni-moderation-latest",
          input: inputText,
        });
        break; // Success, exit retry loop
      } catch (err: any) {
        if (err.status === 429 && attempt < 2) {
          console.log(`moderation: Rate limited, retrying in 300ms (attempt ${attempt + 1})`);
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          throw err; // Re-throw non-429 errors or final attempt
        }
      }
    }

    const result = moderation.results[0];
    console.log('moderation: OpenAI result', {
      flagged: result.flagged,
      categories: result.categories
    });

    // Block on hard violations + harassment (targeted bullying)
    if (
      result.categories.hate ||
      result.categories['sexual/minors'] ||
      result.categories.violence ||
      result.categories.harassment
    ) {
      console.log('moderation: Rejected by OpenAI', { categories: result.categories });
      return {
        allowed: false,
        reason: 'OPENAI_VIOLATION',
        details: 'Content violates safety guidelines'
      };
    }

    console.log('moderation: Passed all checks');
    return { allowed: true };

  } catch (error) {
    console.error('moderation: OpenAI API error', error);
    // Fail open - if OpenAI is down, allow the content but log the error
    console.warn('moderation: Allowing content due to API error (fail-open)');
    return { allowed: true };
  }
}

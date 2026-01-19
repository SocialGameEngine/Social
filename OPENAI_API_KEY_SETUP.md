# OpenAI API Key Setup for Content Moderation

## Prerequisites
- OpenAI account with API access
- Supabase CLI installed

## Steps

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Set Supabase Secret

**Using Supabase CLI:**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

**Using Supabase Dashboard:**
1. Go to your project dashboard
2. Navigate to Settings → Edge Functions
3. Add secret:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-your-actual-key-here`

### 3. Verify Setup

Test the edge function:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/answers-submit \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","text":"test answer"}'
```

Check logs for:
```
moderation: Calling OpenAI moderation API
moderation: OpenAI result
```

If you see `OPENAI_API_KEY not set, skipping OpenAI check`, the key wasn't set correctly.

## Cost Considerations

- OpenAI Moderation API is **FREE** (as of current pricing)
- No rate limits for moderate usage
- Monitor usage at https://platform.openai.com/usage

## Fallback Behavior

If OpenAI API fails:
- System will **fail-open** (allow content)
- Error logged to console
- Block list still enforced
- Low-effort check still enforced

This prevents API outages from blocking all submissions.

## Testing

Test with known violations:
```typescript
// Should be blocked by block list
"This is a test with the word faggot"

// Should be blocked by low effort
"hi"

// Should be blocked by OpenAI
"I hate all [protected group]"
```

## Troubleshooting

**Error: "OPENAI_API_KEY not set"**
- Secret not configured in Supabase
- Redeploy edge function after setting secret

**Error: "OpenAI API error"**
- Check API key is valid
- Check OpenAI account has credits
- Check network connectivity

**Content not being blocked**
- Check logs for moderation results
- Verify block list contains expected words
- Test with obvious violations first

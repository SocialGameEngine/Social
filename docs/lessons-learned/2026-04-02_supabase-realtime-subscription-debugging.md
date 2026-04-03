# **Lessons Learned: Supabase Realtime Subscription Debugging**

**Date**: April 2, 2026  
**Project**: Social Game Engine - Sociale Real-time Features  
**Issue**: Real-time subscription failures and participant count not updating

## **🔍 Problem Identification**

### **Initial Symptoms**
- "mismatch between server and client bindings for postgres changes"
- Real-time updates not working for socialites list
- Participant count not updating in host controls
- Subscription status showing `CLOSED` then `CHANNEL_ERROR`

### **Root Cause Analysis**
The core issue was **authentication timing** - the realtime WebSocket was subscribing before the auth token was properly synchronized with the realtime engine.

## **🛠️ Technical Solutions Applied**

### **1. Explicit Auth Synchronization**
```typescript
// BEFORE (Broken)
const channel = supabase.channel(...).subscribe();

// AFTER (Fixed)
await supabase.realtime.setAuth(session.access_token);
const channel = supabase.channel(...).subscribe();
```

**Lesson**: Always explicitly set auth for realtime before subscribing, even when the client is authenticated.

### **2. Unique Channel Names**
```typescript
// BEFORE (Collision risk)
const channelName = `socialites:${socialeId}`;

// AFTER (Collision-free)
const channelName = `socialites:${socialeId}:${crypto.randomUUID()}`;
```

**Lesson**: Use unique channel names to prevent binding collisions during re-mounts (React Strict Mode).

### **3. Robust Cleanup Pattern**
```typescript
let cancelled = false;

// In subscription setup
if (cancelled) return;

// In cleanup
cancelled = true;
if (channel) {
  void supabase.removeChannel(channel);
}
```

**Lesson**: Always use cancellation flags to prevent race conditions in async subscription setup.

### **4. Precise Query Invalidation**
```typescript
// BEFORE (Over-invalidation)
void queryClient.invalidateQueries({ queryKey: ['socialite'] });

// AFTER (Targeted invalidation)
if (payload.newRecord?.user_id === userId) {
  void queryClient.invalidateQueries({ queryKey: ['socialite', socialeId, userId] });
}
```

**Lesson**: Invalidate only the queries that are actually affected by the realtime event.

## **🏗️ Architecture Improvements**

### **Shared Helper Pattern**
```typescript
async function setupAuthenticatedRealtimeSubscription({
  channelName, table, filter, onPayload, onStatus
}) {
  // Centralized auth, logging, and error handling
}
```

**Benefits**:
- **DRY Principle**: No code duplication across hooks
- **Consistency**: All subscriptions use the same robust pattern
- **Maintainability**: Changes only need to be made in one place

### **Production-Safe Patterns**
- **Memory Leak Prevention**: Proper channel cleanup
- **React Strict Mode Compatibility**: Handles double-mounts gracefully
- **Error Resilience**: Graceful error handling without breaking functionality

## **🔧 Debugging Techniques**

### **1. Comprehensive Logging**
```typescript
console.log('🔥 Setting up realtime subscription:', {
  channelName, table, hasSession: !!session, sessionUserId: session?.user?.id
});
```

### **2. Status Monitoring**
```typescript
.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('✅ Subscription active');
  } else if (status === 'CHANNEL_ERROR') {
    console.error('❌ Subscription failed:', err);
  }
});
```

### **3. Payload Inspection**
```typescript
(payload) => {
  console.log('🔥 Realtime payload:', payload);
  // Analyze eventType, newRecord, oldRecord
}
```

## **⚠️ Common Pitfalls & Solutions**

### **Pitfall 1: Assuming Auth is Synced**
**Problem**: Supabase client auth ≠ realtime auth
**Solution**: Always call `supabase.realtime.setAuth()` explicitly

### **Pitfall 2: Channel Name Collisions**
**Problem**: Reusing channel names causes binding mismatches
**Solution**: Use unique names with `crypto.randomUUID()`

### **Pitfall 3: Race Conditions in Setup**
**Problem**: Async setup continues after component unmount
**Solution**: Use cancellation flags and early returns

### **Pitfall 4: Over-Invalidation**
**Problem**: Invalidating too many queries hurts performance
**Solution**: Target invalidation based on payload content

## **🧪 Testing Strategy**

### **1. Subscription Status Verification**
- Look for `✅ Subscription active` in console
- Ensure no `CHANNEL_ERROR` messages

### **2. Event Validation**
- Test INSERT (player joins)
- Test UPDATE (player status changes)
- Test DELETE (player leaves)

### **3. UI Synchronization**
- Socialites list updates in real-time
- Participant count updates immediately
- Individual socialite queries refresh when relevant

## **📋 Checklist for Future Realtime Implementations**

### **Setup Phase**
- [ ] Explicit auth sync before subscription
- [ ] Unique channel names with UUID
- [ ] Proper TypeScript types for payloads
- [ ] Comprehensive logging

### **Subscription Phase**
- [ ] Status callback with error handling
- [ ] Payload inspection and filtering
- [ ] Targeted query invalidation
- [ ] Cancellation flag for race conditions

### **Cleanup Phase**
- [ ] Proper channel removal
- [ ] Memory leak prevention
- [ ] React Strict Mode compatibility

## **🎯 Key Takeaways**

1. **Auth Timing Matters**: Realtime auth is separate from client auth
2. **Channel Names Must Be Unique**: Prevents binding collisions
3. **Cleanup is Critical**: Prevents memory leaks and race conditions
4. **Targeted Invalidation**: Better performance than blanket invalidation
5. **Shared Patterns**: Reduce duplication and ensure consistency
6. **Comprehensive Logging**: Essential for debugging realtime issues

## **🔄 Future Improvements**

### **Short Term**
- Add retry logic for failed subscriptions
- Implement connection status monitoring
- Add performance metrics for subscription latency

### **Long Term**
- Create a custom hook wrapper for all realtime subscriptions
- Implement subscription pooling for high-frequency updates
- Add offline/online state handling

## **📁 Related Files**

### **Fixed Files**
- `src/features/sociale/hooks/useSocialites.ts` - Main hook with realtime subscription
- `src/features/sociale/hooks/useSociale.ts` - Sociale data hook (referenced for patterns)
- `src/supabase/client.ts` - Supabase client configuration (verified singleton)

### **Supporting Files**
- `check_realtime_publication.sql` - SQL script to verify database publication setup
- Edge functions deployed: `sociales-update`, `sociales-submit-response`, `rooms-start-sociale`

## **🏆 Resolution Summary**

**Problem**: Real-time subscriptions failing with "mismatch between server and client bindings"  
**Root Cause**: Auth timing and channel name collisions  
**Solution**: Explicit auth sync + unique channel names + robust cleanup  
**Result**: ✅ Real-time socialites list and participant count now update correctly  

**This debugging session taught us that Supabase realtime requires explicit auth synchronization and careful channel management to work reliably in production React applications.**

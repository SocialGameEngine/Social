/**
 * Realtime debugging utilities for Vercel vs localhost issues
 */

import { supabase } from '../../supabase/client';
import { getEnvironmentInfo } from './environment';
import { log } from './logger';

export interface RealtimeTestResult {
  success: boolean;
  environment: ReturnType<typeof getEnvironmentInfo>;
  authStatus: 'authenticated' | 'anonymous' | 'none';
  connectionStatus: string;
  error?: string;
  latency?: number;
}

/**
 * Test realtime connectivity and return diagnostic information
 */
export async function testRealtimeConnectivity(): Promise<RealtimeTestResult> {
  const startTime = Date.now();
  const envInfo = getEnvironmentInfo();
  
  log.info('🔍 Testing realtime connectivity', envInfo);
  
  try {
    // Check authentication status
    const { data: { session } } = await supabase.auth.getSession();
    const authStatus = session ? 'authenticated' : 'anonymous';
    
    if (!session) {
      log.info('🔐 Signing in anonymously for test');
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        return {
          success: false,
          environment: envInfo,
          authStatus: 'none',
          connectionStatus: 'auth_failed',
          error: `Authentication failed: ${error.message}`
        };
      }
    }
    
    // Create a test channel and capture connection status
    let connectionStatus = 'unknown';
    
    const testChannel = supabase
      .channel('realtime-test')
      .on('system', {}, (payload: any) => {
        log.debug('System event received', payload);
      })
      .subscribe((status: any, err: any) => {
        connectionStatus = status;
        log.info('Test channel status', { status, error: err?.message });
      });
    
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check connection status
    const isConnected = connectionStatus === 'SUBSCRIBED';
    const latency = Date.now() - startTime;
    
    // Clean up
    supabase.removeChannel(testChannel);
    
    const result: RealtimeTestResult = {
      success: isConnected,
      environment: envInfo,
      authStatus,
      connectionStatus: isConnected ? 'connected' : 'failed',
      latency
    };
    
    log.info('🔍 Realtime test completed', result);
    return result;
    
  } catch (error) {
    const result: RealtimeTestResult = {
      success: false,
      environment: envInfo,
      authStatus: 'none',
      connectionStatus: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - startTime
    };
    
    log.error('🔍 Realtime test failed', result);
    return result;
  }
}

/**
 * Monitor realtime connection over time
 */
export function startRealtimeMonitoring(
  onStatusChange: (status: RealtimeTestResult) => void,
  intervalMs: number = 30000
) {
  const envInfo = getEnvironmentInfo();
  log.info('📊 Starting realtime monitoring', { ...envInfo, intervalMs });
  
  const interval = setInterval(async () => {
    const result = await testRealtimeConnectivity();
    onStatusChange(result);
  }, intervalMs);
  
  return () => {
    clearInterval(interval);
    log.info('📊 Stopped realtime monitoring', envInfo);
  };
}

/**
 * Get browser and network information for debugging
 */
export function getNetworkInfo() {
  const envInfo = getEnvironmentInfo();
  
  const networkInfo = {
    ...envInfo,
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : null,
    // Check for common WebSocket blockers
    adBlockerDetected: false, // Could implement ad blocker detection
    privateMode: false, // Could implement private mode detection
  };
  
  log.info('🌐 Network information collected', networkInfo);
  return networkInfo;
}

import { vi } from 'vitest';

// Mock Supabase client for integration tests
export const createMockSupabaseClient = () => {
  const mockData = new Map<string, any[]>();
  const mockSubscriptions = new Map<string, any>();

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn((_columns = '*') => ({
        eq: vi.fn((column: string, value: any) => ({
          single: vi.fn(() => {
            const tableData = mockData.get(table) || [];
            const result = tableData.find((row: any) => row[column] === value);
            return { data: result || null, error: result ? null : new Error('Not found') };
          }),
          maybeSingle: vi.fn(() => {
            const tableData = mockData.get(table) || [];
            const result = tableData.find((row: any) => row[column] === value);
            return { data: result || null, error: null };
          }),
        })),
        order: vi.fn((column: string, options: { ascending?: boolean }) => ({
          limit: vi.fn((limit: number) => ({
            then: vi.fn((callback: any) => {
              const tableData = mockData.get(table) || [];
              const sorted = [...tableData].sort((a: any, b: any) => {
                const aVal = a[column];
                const bVal = b[column];
                return options?.ascending ? aVal - bVal : bVal - aVal;
              });
              const limited = sorted.slice(0, limit);
              callback({ data: limited, error: null });
            }),
          })),
        })),
        then: vi.fn((callback: any) => {
          const tableData = mockData.get(table) || [];
          callback({ data: tableData, error: null });
        }),
      })),
      insert: vi.fn((data: any) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => {
            const tableData = mockData.get(table) || [];
            const newRecord = { id: `mock-${Date.now()}`, ...data };
            tableData.push(newRecord);
            mockData.set(table, tableData);
            return { data: newRecord, error: null };
          }),
        })),
      })),
      update: vi.fn((data: any) => ({
        eq: vi.fn((column: string, value: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              const tableData = mockData.get(table) || [];
              const index = tableData.findIndex((row: any) => row[column] === value);
              if (index >= 0) {
                tableData[index] = { ...tableData[index], ...data };
                mockData.set(table, tableData);
                return { data: tableData[index], error: null };
              }
              return { data: null, error: new Error('Not found') };
            }),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((column: string, value: any) => ({
          then: vi.fn((callback: any) => {
            const tableData = mockData.get(table) || [];
            const filtered = tableData.filter((row: any) => row[column] !== value);
            mockData.set(table, filtered);
            callback({ data: null, error: null });
          }),
        })),
      })),
    })),
    channel: vi.fn((channelName: string) => {
      const mockChannel: any = {
        on: vi.fn((event: string, filter: any, callback: any) => {
          // Store subscription for later triggering
          mockSubscriptions.set(`${channelName}:${event}`, { filter, callback });
          return mockChannel;
        }),
        subscribe: vi.fn(() => mockChannel),
      };
      return mockChannel;
    }),
    removeChannel: vi.fn(() => {}),
    // Helper methods for testing
    _mockData: mockData,
    _mockSubscriptions: mockSubscriptions,
    _triggerRealtime: (channelName: string, event: string, payload: any) => {
      const key = `${channelName}:${event}`;
      const subscription = mockSubscriptions.get(key);
      if (subscription) {
        subscription.callback(payload);
      }
    },
    _setMockData: (table: string, data: any[]) => {
      mockData.set(table, data);
    },
    _clearMockData: () => {
      mockData.clear();
      mockSubscriptions.clear();
    },
  };
};

// Mock React Query for testing
export const createMockQueryClient = () => {
  const cache = new Map<string, any>();
  
  return {
    fetchQuery: vi.fn(async ({ queryKey }: { queryKey: string[] }) => {
      const cached = cache.get(JSON.stringify(queryKey));
      if (cached) return cached;
      throw new Error('No cached data for query');
    }),
    prefetchQuery: vi.fn(async ({ queryKey, queryFn }: { queryKey: string[], queryFn: any }) => {
      const result = await queryFn();
      cache.set(JSON.stringify(queryKey), result);
      return result;
    }),
    invalidateQueries: vi.fn(({ queryKey }: { queryKey: string[] }) => {
      cache.delete(JSON.stringify(queryKey));
    }),
    getQueryData: vi.fn((queryKey: string[]) => {
      return cache.get(JSON.stringify(queryKey));
    }),
    setQueryData: vi.fn((queryKey: string[], data: any) => {
      cache.set(JSON.stringify(queryKey), data);
    }),
  };
};

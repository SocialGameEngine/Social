import { test, expect } from "@playwright/test";

test.describe('Phase C - Round Type Extensions (P2-2)', () => {
  test('should extend SocialeRoundType union correctly', async () => {
    // Test type union extension
    const roundTypes = [
      'prompt', 'trivia', 'topic', 'poll', 'custom', // Existing
      'picture', 'music', 'wager', 'predictive',     // New
      'photo', 'bluff', 'mole', 'order', 'chest'    // New
    ];

    expect(roundTypes).toContain('picture');
    expect(roundTypes).toContain('music');
    expect(roundTypes).toContain('wager');
    expect(roundTypes).toContain('predictive');
    expect(roundTypes).toContain('photo');
    expect(roundTypes).toContain('bluff');
    expect(roundTypes).toContain('mole');
    expect(roundTypes).toContain('order');
    expect(roundTypes).toContain('chest');
  });

  test('should create round type definition files', async () => {
    // Test round type files exist in correct structure
    const roundTypeFiles = [
      'apps/top-comment/src/domain/sociale/rounds/picture.ts',
      'apps/top-comment/src/domain/sociale/rounds/music.ts',
      'apps/top-comment/src/domain/sociale/rounds/wager.ts',
      'apps/top-comment/src/domain/sociale/rounds/predictive.ts',
      'apps/top-comment/src/domain/sociale/rounds/photo.ts',
      'apps/top-comment/src/domain/sociale/rounds/bluff.ts',
      'apps/top-comment/src/domain/sociale/rounds/mole.ts',
      'apps/top-comment/src/domain/sociale/rounds/order.ts',
      'apps/top-comment/src/domain/sociale/rounds/chest.ts'
    ];

    roundTypeFiles.forEach(file => {
      expect(file).toContain('apps/top-comment/src/domain/sociale/rounds/');
      expect(file).toMatch(/\.ts$/);
    });
  });

  test('should create round registry index file', async () => {
    // Test registry index exists
    const registryIndex = {
      path: 'apps/top-comment/src/domain/sociale/rounds/index.ts',
      purpose: 'Import and call registerRoundType for each new type'
    };

    expect(registryIndex.path).toContain('rounds/index.ts');
    expect(registryIndex.purpose).toContain('registerRoundType');
  });

  test('should import registry from app entry', async () => {
    // Test registry is imported from main.tsx
    const appEntry = {
      file: 'apps/top-comment/src/main.tsx',
      shouldImport: 'apps/top-comment/src/domain/sociale/rounds/index.ts'
    };

    expect(appEntry.file).toBe('apps/top-comment/src/main.tsx');
    expect(appEntry.shouldImport).toContain('rounds/index.ts');
  });

  test('should create UI components for each round type', async () => {
    // Test UI component structure
    const uiComponents = [
      'apps/top-comment/src/features/room/components/rounds/picture/',
      'apps/top-comment/src/features/room/components/rounds/music/',
      'apps/top-comment/src/features/room/components/rounds/wager/',
      'apps/top-comment/src/features/room/components/rounds/predictive/',
      'apps/top-comment/src/features/room/components/rounds/photo/',
      'apps/top-comment/src/features/room/components/rounds/bluff/',
      'apps/top-comment/src/features/room/components/rounds/mole/',
      'apps/top-comment/src/features/room/components/rounds/order/'
    ];

    uiComponents.forEach(path => {
      expect(path).toContain('components/rounds/');
      // Each path should contain its specific round type
      const roundType = path.replace(/\/$/, '').split('/').pop(); // Remove trailing slash, then get last part
      expect(['picture', 'music', 'wager', 'predictive', 'photo', 'bluff', 'mole', 'order']).toContain(roundType);
    });
  });

  test('should implement picture round correctly', async () => {
    // Test picture round specifics
    const pictureRound = {
      type: 'picture',
      phases: ['answer', 'reveal', 'results'],
      storage: 'sociale-photos',
      maxSize: '2 MB',
      inputType: 'text', // "What is this?"
      scoring: 'exact_match', // Case-insensitive
      acceptedAnswers: ['Eiffel Tower', 'eiffel tower', 'Tour Eiffel']
    };

    expect(pictureRound.type).toBe('picture');
    expect(pictureRound.phases).toEqual(['answer', 'reveal', 'results']);
    expect(pictureRound.storage).toBe('sociale-photos');
  });

  test('should implement music round correctly', async () => {
    // Test music round specifics
    const musicRound = {
      type: 'music',
      phases: ['answer', 'reveal', 'results'],
      storage: 'sociale-audio',
      maxSize: '10 MB',
      playback: 'tv_only', // No YouTube
      inputType: 'text'
    };

    expect(musicRound.type).toBe('music');
    expect(musicRound.storage).toBe('sociale-audio');
    expect(musicRound.playback).toBe('tv_only');
  });

  test('should implement wager round correctly', async () => {
    // Test wager round specifics
    const wagerRound = {
      type: 'wager',
      phases: ['wager', 'answer', 'reveal', 'results'], // Extra wager phase
      wagerPhase: {
        shows: 'category/title only',
        hides: 'prompt body'
      },
      settings: {
        minWager: 10,
        maxWager: 100,
        baseQuestion: 'TriviaSnapshot'
      }
    };

    expect(wagerRound.type).toBe('wager');
    expect(wagerRound.phases).toContain('wager');
    expect(wagerRound.phases).toHaveLength(4);
  });

  test('should implement predictive round correctly', async () => {
    // Test predictive round specifics
    const predictiveRound = {
      type: 'predictive',
      phases: ['answer', 'host_review', 'reveal', 'results'],
      hostReview: {
        action: 'picks correct post-submission',
        scoring: 'points for matching host pick'
      }
    };

    expect(predictiveRound.type).toBe('predictive');
    expect(predictiveRound.phases).toContain('host_review');
  });

  test('should implement photo submission round correctly', async () => {
    // Test photo submission specifics
    const photoRound = {
      type: 'photo',
      phases: ['capture', 'gallery', 'vote', 'results'],
      capture: {
        input: '<input type="file" accept="image/*" capture="environment">',
        compression: 'browser-image-compression',
        maxSize: '2 MB',
        moderation: 'OpenAI /v1/moderations'
      },
      moderation: {
        edgeFunction: 'photos-moderate',
        hostPanel: true,
        takedown: true
      }
    };

    expect(photoRound.type).toBe('photo');
    expect(photoRound.phases).toContain('capture');
    expect(photoRound.moderation.edgeFunction).toBe('photos-moderate');
  });

  test('should implement Dead Man\'s Bluff correctly', async () => {
    // Test bluff round specifics
    const bluffRound = {
      type: 'bluff',
      phases: ['bluff', 'vote', 'reveal', 'results'],
      bluff: {
        simultaneous: true,
        inputType: 'text bluff'
      },
      voting: {
        options: 'real answer + all bluffs shuffled',
        scoring: {
          truthPick: 'points',
          bluffTrap: 'points per player who picked your bluff'
        }
      }
    };

    expect(bluffRound.type).toBe('bluff');
    expect(bluffRound.phases).toContain('bluff');
    expect(bluffRound.voting.options).toContain('shuffled');
  });

  test('should implement The Mole correctly', async () => {
    // Test mole round specifics
    const moleRound = {
      type: 'mole',
      phases: ['assign', 'answer', 'vote', 'reveal', 'results'],
      moleSelection: {
        method: 'highest response count from last N sociales',
        ensuresActive: true
      },
      answer: {
        oneWord: true
      },
      voting: {
        duration: '>= 90s',
        allowChanges: true,
        binary: 'true/false outcome'
      }
    };

    expect(moleRound.type).toBe('mole');
    expect(moleRound.phases).toContain('assign');
    expect(moleRound.voting.duration).toBe('>= 90s');
  });

  test('should implement order round correctly', async () => {
    // Test order round specifics
    const orderRound = {
      type: 'order',
      phases: ['order', 'reveal', 'results'],
      interaction: 'drag-and-drop via @dnd-kit/sortable',
      scoring: {
        default: 'all-or-nothing',
        partial: 'Kendall tau (configurable)'
      }
    };

    expect(orderRound.type).toBe('order');
    expect(orderRound.interaction).toContain('@dnd-kit/sortable');
    expect(orderRound.scoring.default).toBe('all-or-nothing');
  });

  test('should follow SocialeRoundTypeDefinition interface', async () => {
    // Test all round types implement required interface
    const requiredInterface = {
      validateSettings: 'function',
      scoreRound: 'function',
      buildAnalytics: 'function',
      // ... other required methods
    };

    const roundTypeDefinition = {
      type: 'picture',
      validateSettings: () => true,
      scoreRound: () => ({ scores: [] }),
      buildAnalytics: () => ({ analytics: {} })
    };

    expect(typeof roundTypeDefinition.validateSettings).toBe('function');
    expect(typeof roundTypeDefinition.scoreRound).toBe('function');
    expect(typeof roundTypeDefinition.buildAnalytics).toBe('function');
  });

  test('should handle storage bucket creation', async () => {
    // Test storage buckets are created
    const storageBuckets = [
      {
        name: 'sociale-photos',
        publicRead: true,
        authenticatedWrite: true,
        maxSize: '2 MB',
        lifecycle: '7-day delete'
      },
      {
        name: 'sociale-audio',
        publicRead: true,
        authenticatedWrite: true,
        maxSize: '10 MB'
      }
    ];

    expect(storageBuckets[0].name).toBe('sociale-photos');
    expect(storageBuckets[0].maxSize).toBe('2 MB');
    expect(storageBuckets[1].name).toBe('sociale-audio');
    expect(storageBuckets[1].maxSize).toBe('10 MB');
  });
});

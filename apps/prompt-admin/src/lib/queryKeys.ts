export const queryKeys = {
  libraries: () => ['libraries'] as const,
  prompts: (libraryId: string) => ['prompts', libraryId] as const,
  triviaLibraries: () => ['trivia_libraries'] as const,
  triviaQuestions: (packId: string) => ['trivia_questions', packId] as const,
  ambientRounds: () => ['ambient_rounds'] as const,
} as const;

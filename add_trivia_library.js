import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://dtudipmqfrknkrsahlst.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dWRpcG1xZnJrbmtyc2FobHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNTQ3NzQsImV4cCI6MjA1MDkzMDc3NH0.8f9KJjKqWmKqJhZJhZJhZJhZJhZJhZJhZJhZJhZJhZJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTriviaLibrary() {
  try {
    // Insert the trivia test library
    const { error: libError } = await supabase
      .from('prompt_libraries')
      .upsert({
        id: 'trivia-test',
        name: 'Trivia Test',
        emoji: '🧠',
        description: 'Test trivia library with 10 general knowledge questions.',
        is_active: true,
        sort_order: 100
      }, {
        onConflict: 'id'
      });

    if (libError) {
      console.error('Error inserting library:', libError);
      return;
    }

    console.log('Library inserted successfully');

    // Insert 10 trivia questions
    const questions = [
      'What is the capital of France?',
      'Who painted the Mona Lisa?',
      'What is the largest planet in our solar system?',
      'In which year did World War II end?',
      'What is the chemical symbol for gold?',
      'Who wrote "Romeo and Juliet"?',
      'What is the smallest country in the world?',
      'How many continents are there on Earth?',
      'What is the speed of light in vacuum?',
      'Who invented the telephone?'
    ];

    for (let i = 0; i < questions.length; i++) {
      const { error: promptError } = await supabase
        .from('prompts')
        .upsert({
          library_id: 'trivia-test',
          text: questions[i],
          is_active: true,
          sort_order: i
        }, {
          onConflict: 'library_id,sort_order'
        });

      if (promptError) {
        console.error(`Error inserting question ${i + 1}:`, promptError);
      }
    }

    console.log('Trivia library and questions added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTriviaLibrary();

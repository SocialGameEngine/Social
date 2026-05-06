// Simple script to add trivia library to database
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the SQL file
const sqlContent = readFileSync(join(__dirname, 'trivia_test_library.sql'), 'utf8');

console.log('Trivia Library SQL Content:');
console.log(sqlContent);
console.log('\nTo add this trivia library to your database:');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dtudipmqfrknkrsahlst');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL content above');
console.log('4. Run the SQL script');

console.log('\nThe trivia library includes:');
console.log('- Library ID: trivia-test');
console.log('- Name: Trivia Test');
console.log('- Emoji: 🧠');
console.log('- 10 general knowledge trivia questions');

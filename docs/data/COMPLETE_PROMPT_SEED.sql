-- ============================================================================
-- COMPLETE PROMPT LIBRARY SEED DATA
-- ============================================================================
-- This script populates all 24 prompt libraries with their prompts
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Insert all prompt libraries
INSERT INTO prompt_libraries (id, name, emoji, description, is_active, sort_order) VALUES
  ('classic', 'Classic Crowd', '🔥', 'Lighthearted pop-culture roasts for any crowd.', true, 0),
  ('dangerfield', 'Modern Day Dangerfield', '👨', 'Dangerfield-themed prompts for Millennials and Gen Zers.', true, 1),
  ('bar', 'Bar Banter', '🍻', 'Prompt pack built for bar trivia nights and regulars.', true, 2),
  ('basic', 'Basic Prompts', '✨', 'A simple mix of easygoing prompts for any crowd.', true, 3),
  ('halloween', 'Spooky Season', '🎃', 'Creepy, kooky, and perfect for costume parties.', true, 4),
  ('selfie', 'Selfie Stars', '📸', 'Creative selfie challenges for social-ready crowds.', true, 5),
  ('victoria', 'Victoria Nights', '🌊', 'Local flavor tailored for Victoria, BC crowds.', true, 6),
  ('medieval', 'Medieval Mayhem', '⚔️', 'Knights, castles, and medieval chaos for history buffs.', true, 7),
  ('anime', 'Anime Antics', '🍜', 'Slice-of-life and ridiculous shonen-themed prompts.', true, 8),
  ('politics', 'Political Roasts', '🏛️', 'Global politics satire for the politically aware crowd.', true, 9),
  ('scifi', 'Sci-Fi Shenanigans', '🚀', 'Space stations, aliens, and futuristic fails.', true, 10),
  ('popculture', 'Pop Culture Chaos', '⭐', 'Celebrity drama and entertainment industry roasts.', true, 11),
  ('cinema', 'Cinema Snark', '🎬', 'Movie industry humor and film fails.', true, 12),
  ('canucks', 'Canucks Chaos', '🏒', 'Vancouver Canucks memes and hockey heartbreak.', true, 13),
  ('bc', 'BC Vibes', '🌲', 'British Columbia culture, housing crisis, and ferry delays.', true, 14),
  ('tech', 'Tech & AI Slop', '💻', 'Modern tech fails and AI-generated chaos.', true, 15),
  ('internetculture', 'Internet Culture', '📱', 'Viral memes, cancel culture, and social media phenomena.', true, 16),
  ('datingapp', 'Dating App Disasters', '💔', 'Modern dating fails, ghosting, and profile disasters.', true, 17),
  ('remotework', 'Remote Work Reality', '💼', 'Zoom fails, WFH struggles, and work-life boundaries.', true, 18),
  ('adulting', 'Adulting Fails', '🎓', 'Taxes, responsibilities, and pretending to be an adult.', true, 19),
  ('groupchat', 'Group Chat Chaos', '💬', 'Wrong messages, group dynamics, and chat etiquette.', true, 20),
  ('streaming', 'Streaming Wars', '📺', 'Too many subscriptions, binge culture, and algorithm fails.', true, 21),
  ('climateanxiety', 'Climate Anxiety', '🌍', 'Eco-guilt, greenwashing, and sustainability pressure.', true, 22),
  ('fictionalworlds', 'Fictional Worlds', '🎭', 'Dark humor about Star Wars, Harry Potter, and more.', true, 23);

ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  emoji = EXCLUDED.emoji, 
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Step 2: Insert all prompts

-- Classic Crowd prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What would you say if an alien landed in your backyard?', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What is the quickest way to get fired from your job?', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'If you were to start a sports team, what would the mascot be?', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What is the worst theme for a children''s birthday party?', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What would be the worst thing to hear from your doctor?', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What is the most useless superpower you can think of?', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The rudest thing an animal would say if it could talk', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Pitch a new reality show that would get canceled immediately', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'A terrible new cocktail name people would still order', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Rename a classic drink to fit its true personality', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'A pickup line one bar item would use on another', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst thing to say at a funeral', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'A terrible new name for a popular app', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What''s the most embarrassing thing to happen at a job interview?', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'If you could make one law that everyone had to follow, what would it be?', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What''s the worst superpower to have at a party?', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'If you had to describe your last meal using only emojis, what would it be?', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What''s the most ridiculous thing you could put on a resume?', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The most terrifying animal if it was the size of a house', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst thing to hear from your GPS', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'An ingredient swap that would ruin any recipe', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst thing to hear from your Uber driver', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Describe your personality using only food items', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What''s the most awkward thing to say during a job interview?', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The household chore that should be illegal', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst superpower to have at a job interview', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Rename a popular TV show to make it terrible', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The most embarrassing thing to happen at a wedding', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The social media platform that should disappear', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst thing to hear from your dentist', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Describe your dating life using only movie titles', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'What''s the most ridiculous thing you could put in a dating profile?', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The most annoying everyday object if it became sentient', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst thing to hear from your barber', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Describe your cooking skills using only emojis', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The most embarrassing thing to happen at a job interview', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The rudest household appliance if it could talk', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The worst thing to hear from your personal trainer', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'Describe your sleep schedule using only food items', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The most ridiculous thing you could put on a business card', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('classic', 'The most annoying body part if it became sentient', true, 40) ON CONFLICT DO NOTHING;

-- Modern Day Dangerfield prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I get no respect. Even my phone auto-corrects me to ___.', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My dating bio just says I look like I ___.', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My smart fridge sent me a notification telling me to stop ___.', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My therapist said I need better coping skills, so now I just ___.', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I finally saved money! Then I spent it all on ___.', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I matched with someone great. They only liked me for my ___.', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried a meditation app. It told me I’m too stressed for ___.', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My anxiety told me to act normal, so I ___.', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My landlord raised rent because they caught me ___.', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I get no respect. Even my coffee order called me ___.', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I asked AI how to improve my life. It recommended ___.', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My therapist’s Zoom froze right when I admitted ___.', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I bought insurance, but it only covers ___.', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My date said they want someone ‘emotionally available,’ so I told them ___.', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried self-care and ended up ___.', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'HR said I need better communication, so I sent them ___.', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I asked for a raise. They offered me exposure and ___.', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I finally did positive affirmations. They all said ___.', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My barista asked if I’m okay because I ___.', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My coping mechanism is just ___.', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My bank account sends me reminders to stop ___.', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My side hustle is so sad, I make money by ___.', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I ordered a latte with almond milk. They served me ___.', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Matcha doesn’t calm me. It just makes me ___.', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My company gave us mental health benefits — they let us ___.', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My doctor diagnosed me with ___.', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried doing yoga. The instructor told me to start with ___.', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My scale looked at me and said ___.', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'At the gym, the trainer told me to try ___.', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My parents said they’re proud of me for finally ___.', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even my playlist skipped my favorite song for ___.', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I met someone great. First thing they said was, “You look like someone who ___.', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My date said they love confidence, so I impressed them by ___.', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'They ghosted me politely with a message saying ___.', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'We finally kissed, and they whispered ___.', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I asked a financial advisor for help. They said my best investment is ___.', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My student loans sent a thank you card for ___.', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I bought a wellness drink. It promised to cure ___.', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My boss said I’m ‘on thin ice’ just for ___.', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I dressed for the job I want, so I showed up as ___.', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My coworkers call me MVP — Most ___ Person.', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even Santa didn’t like me. He brought me ___.', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'As a kid, even my toys bullied me. My teddy bear called me ___.', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'They said I’d grow up to ___.', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My teacher said I was gifted, just not in ___.', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My performance review said I ‘lack initiative’ because I kept ___.', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'This bar is so cheap, even the bartender tipped ___.', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'The drink hit me so hard I started confessing about ___.', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'The bartender cut me off after I tried to ___.', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I said I needed a strong drink. They recommended ___.', true, 49) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My bank app congratulated me for ___.', true, 50) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I bought a smart scale. It said ___.', true, 51) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My headphones disconnected just as I started ___.', true, 52) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even my group chat kicked me out for ___.', true, 53) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My therapist said I’m afraid of commitment — even my ___ left me.', true, 54) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried manifestation. All I manifested was ___.', true, 55) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried journaling, but I only wrote about ___.', true, 56) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even my anxiety has anxiety about ___.', true, 57) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My coping mechanism costs $12 and tastes like ___.', true, 58) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My friends said I need hobbies, so I started ___.', true, 59) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I get no respect. Even my houseplants judge me for ___.', true, 60) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried crystals for healing. They told me to work on ___.', true, 61) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My horoscope said today is perfect for ___.', true, 62) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I started budgeting, and now all I can afford is ___.', true, 63) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My bank account said I should try ___.', true, 64) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My date said they like mysterious people. They meant someone who ___.', true, 65) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My crush said I have potential, but only if I stop ___.', true, 66) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'They matched with me because they thought I looked like I like ___.', true, 67) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My parents said I could be anything. So I became ___.', true, 68) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My therapy homework was just to stop ___.', true, 69) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even the bar’s DJ roasted me by playing ___.', true, 70) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I went clubbing and realized I’m too old when I started ___.', true, 71) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I went clubbing and realized I’m too young when I started ___.', true, 72) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My boss tried to motivate me with a sticker that says ___.', true, 73) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried being productive, but I ended up ___.', true, 74) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My alarm clock wakes me up just to remind me I’ll spend the day ___.', true, 75) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried intermittent fasting. The only thing I lost was ___.', true, 76) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My smart watch told me to calm down after it detected ___.', true, 77) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried positive thinking, but my brain kept saying ___.', true, 78) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I went on a juice cleanse and hallucinated ___.', true, 79) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My date said they want someone stable, so I showed them ___.', true, 80) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I get no respect. Even my TikTok comments called me ___.', true, 81) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My selfie looked so bad even the filter said ___.', true, 82) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I get no respect. My Uber driver told me to stop ___.', true, 83) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even my cat acts like it pays rent by ___!', true, 84) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I switched to decaf and immediately started ___.', true, 85) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I bought a weighted blanket. It crushed me for ___.', true, 86) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My sleep app said I woke up 17 times because of ___.', true, 87) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I asked for relationship advice, and they recommended ___.', true, 88) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I finally meditated… and all I thought about was ___.', true, 89) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My phone battery lasts longer than my ___.', true, 90) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I joined a gym, and they offered me a class in ___.', true, 91) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'Even my shadow left because it got tired of ___.', true, 92) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried being spontaneous, so I ___.', true, 93) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I asked ChatGPT for life advice, and it told me to ___.', true, 94) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried fixing my life, but the update requires ___.', true, 95) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'I tried being delulu, but all I got was ___.', true, 96) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('dangerfield', 'My coping playlist only has songs about ___.', true, 97) ON CONFLICT DO NOTHING;

-- Bar Banter prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best drink to order if you want to look cool', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst thing to hear from the kitchen', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A great name for a bar''s pet parrot', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'Your signature shot and its ridiculous name', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The most overrated type of beer', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'Something you should never say to a bartender', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A hilarious name for a non-alcoholic drink', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst song for a wedding reception at a bar', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'What the mysterious stain on the ceiling really is', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best way to get a free drink', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A made-up rule you''d put on a bar sign', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The weirdest thing you''ve seen someone do at a bar', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A terrible name for a new dive bar', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The most embarrassing thing to spill on yourself', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'What the people in the corner booth are secretly discussing', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst thing to run out of at a bar', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A secret handshake for the bar''s regulars', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best thing to find at the bottom of your chips bowl', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A terrible name for a dating app for pub lovers', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The real reason the wifi is so slow', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A drink that gives you a weird superpower for an hour', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst item to see on the menu', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'This bar''s unofficial theme song', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A hilarious item in the lost and found', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best way to signal you need a conversation escape', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The most ridiculous thing to hang behind the bar', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A terrible name for a cocktail with vegetables in it', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best thing to yell during a darts game', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The real story behind the initials carved in the table', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A drink that makes you instantly fluent in a language', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst superpower for a bartender to have', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A funny name for the bar''s trivia night', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best way to open a stubborn bag of peanuts', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'Something you''d be shocked to see on the menu', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A terrible name for a cowboy bar', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The secret ingredient in the house Bloody Mary mix', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst thing to borrow from another patron', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A great name for a wizard''s favorite ale', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best excuse for ordering a Shirley Temple as an adult', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The most unnecessary garnish for a drink', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A funny name for the bar''s ghost', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst thing to use as a coaster', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best way to celebrate a stranger''s birthday', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A terrible name for a hipster microbrew', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'What the bartender is really thinking right now', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A hilarious new use for a beer koozie', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The worst food to eat during karaoke', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The best thing to write on a bathroom stall wall', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'A ridiculous name for a loyalty program', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bar', 'The most dramatic way to win a game of pool', true, 49) ON CONFLICT DO NOTHING;

-- Basic Prompts prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The best way to impress an alien from Mars', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Worst name for a band', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'My Christian girlfriend broke up with me because she caught me __________', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A lesser-talked-about room in the White House', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'If Jesus came down today, he''d be disappointed that __________', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The easiest way to make a gamer really mad', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'As Shakespeare once said, __________', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst fake fact about jazz history', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The last thing you see before everything goes wrong', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Change one word in a movie title to ruin it', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'This just in: __________', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Your final words before getting canceled forever', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A remarkable achievement you''d never put on your résumé', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'I find I''m very unmotivated these days, except when it comes to __________', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'You have 6 words or less to make everyone mad', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'An actually useful thing to hoard right now', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The real reason flamingos stand on one leg', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to say right after someone farts', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Disney is replacing Iron Man with __________', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A Broadway musical title that would make you cry instantly', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst type of teacher everyone would instantly hate', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Singapore just announced a bizarre new national holiday where __________', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A cartoon character''s terrible presidential campaign slogan', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'I didn''t mean to ruin everything! I just __________', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst movie to put on when parents are in the room', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Best reason for getting kicked out of the library', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to hear from your surgeon right before you go under', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A rejected flavor of toothpaste', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What the Mona Lisa is actually smiling about', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A terrible theme for a children''s birthday party', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to whisper during a long hug', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'An honest slogan for the DMV', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What God said immediately after creating the platypus', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to say to a police officer when pulled over', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What you shouldn''t say on a first date', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst prize to win on a game show', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A terrible title for a self-help book', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to bring to a potluck dinner', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What you don''t want to hear from your Uber driver', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A rejected crayon color name', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A bad time to start a slow clap', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to find in a burrito', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What aliens really think of humans', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A terrible excuse for being late to your own wedding', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to find in your bed', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst possible topping for a pizza', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A terrible thing to say after a first kiss', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What really happens in the Bermuda Triangle', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What Santa does the other 364 days of the year', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Why did the chicken cross the road?', true, 49) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'A rejected slogan for Nike', true, 50) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'Why did the titanic REALLY sink?', true, 51) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'The worst thing to say during a job interview', true, 52) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'An honest Yelp review of Hell', true, 53) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('basic', 'What happens when you don''t return a library book', true, 54) ON CONFLICT DO NOTHING;

-- Spooky Season prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The Halloween costume guaranteed to get you uninvited next year', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The brutally honest name candy corn deserves', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst thing a haunted mirror could say to you', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A cocktail so cursed it should only be served at midnight', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What a ghostly roommate would passive-aggressively complain about', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The title of the world''s most disappointing horror movie', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The dumbest object a witch could ride instead of a broom', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst possible trick-or-treat prize', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A jack-o''-lantern confession that ruins Halloween forever', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A vampire''s most embarrassing secret', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A haunted house attraction that shouldn''t exist', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst message a pumpkin could carve into YOU', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A Monster Mash guest who definitely wasn''t invited', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A werewolf''s excuse to get out of plans', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A spell that is powerful but extremely inconvenient', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The only thing Frankenstein''s monster is afraid of', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A horror movie villain who would be terrible at their job', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst thing you could whisper in a dark hallway', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A costume that would guarantee a breakup', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The lamest reason to become a ghost', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A potion with side effects worse than death', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst thing you could pull from a cauldron', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What a skeleton would shout before a bar fight', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A haunted house Yelp review in five words', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The last thing you''d want a bat to say before biting you', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What zombies would complain about on social media', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The saddest Halloween party theme', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The most cursed thing you could hand out instead of candy', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'Dracula''s new embarrassing hobby', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What your costume would do first if it came alive', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'Something scarier than your internet history', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The Grim Reaper''s petty side hustle', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst playlist song for a Halloween party', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The most annoying haunted object', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What ghosts would do if they got bored', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A terrible haunted mascot for a bar', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A mundane object with a horrifying backstory', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst way to become immortal', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A monster who becomes terrifying for a stupid reason', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The least helpful talking black cat', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What a pumpkin would do for revenge', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A skeleton''s painfully boring day job', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A bar drink that summons something awful', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The worst curse someone could casually text you', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'An embarrassing name for a witch''s familiar', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'Something that should NOT glow in the dark', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'What a ghost host would announce at karaoke', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The Tooth Fairy''s Halloween rebrand that ruins childhood', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'A Halloween tradition that would get you arrested', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('halloween', 'The most unhinged message written in fake blood', true, 49) ON CONFLICT DO NOTHING;

-- Selfie Stars prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie with your drink like it paid for YOU.', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Show us your best ‘I swear I’m not drunk’ face.', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Flex your fit like you’re on a runway at 2am.', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that screams MAIN CHARACTER ENERGY.', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Recreate a famous meme — bar edition.', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Snap a selfie like you just found out you won the lottery.', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie pretending paparazzi just caught you leaving.', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Capture your most overdramatic movie-poster pose.', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Find the weirdest object in reach. Selfie with it.', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take the most unflattering selfie you can.', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Bathroom mirror. Legendary angle. Go.', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Recreate a first-day-of-school photo — bar edition.', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that looks like it belongs on a magazine cover.', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Turn your drink into a fashion accessory — selfie.', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Photograph your vibe + the bar’s energy in one selfie.', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Selfie with the coolest sign in the bar.', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Find the most mysterious or suspicious object. Selfie with it.', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Selfie with the best art you can find here.', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Match your drink’s personality in a selfie.', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Pretend your drink is a microphone — rockstar selfie.', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Selfie + your current mood in three words.', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Selfie with the caption: ''Don’t ask…''', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that tells a story without text.', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie showing how you THOUGHT tonight would go vs. how it’s going.', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie with whatever you wish you were drinking.', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie you will absolutely regret tomorrow.', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Pose like you’re attending the Met Gala… at this bar.', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that belongs on a dating app.', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Capture the DJ energy during your favorite song — selfie.', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Selfie with the tallest drink you can find.', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that gives ''this bar is my hometown now.''', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that could be a movie poster titled TONIGHT HAPPENED.', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Your mission: take a selfie where everyone looks confused — including you.', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie showing your best ‘I’m famous’ face.', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take the most wholesome selfie of the night.', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Pretend you’re on a secret mission — selfie.', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that feels like a plot twist.', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie making your drink look like your best friend.', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that looks like it belongs in a scrapbook someday.', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that looks like the cover of your autobiography.', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that shows you thriving against all odds.', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that feels like it should be illegal.', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Create a selfie that says: ''Today was a journey.''', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that would make Past You impressed.', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie capturing the exact moment your night peaked.', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that would make a great movie trailer.', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that deserves its own theme song.', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take the most dramatic selfie possible.', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('selfie', 'Take a selfie that makes you look like the hero of the night.', true, 48) ON CONFLICT DO NOTHING;

-- Victoria Nights prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Salt Spring Island’s unofficial currency besides crystals', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Worst thing about BC Ferries', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Why Victoria keeps pretending it’s not really Canada', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The real reason Victoria rain never stops', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Describe the ultimate Malahat Drive nightmare', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Invent a totally fake Vancouver Island whale species', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The most powerful BC hippie pickup line ever', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'How would you ruin Empress High Tea in one move?', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Beacon Hill Park peacocks are mad because __________', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Worst possible whale-watching fail in Victoria', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Craigdarroch Castle''s least helpful ghost is named __________', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The Parliament tour disaster that made the guide quit', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Fisherman''s Wharf seals are plotting revenge because __________', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The most dangerous thing on the Galloping Goose Trail is __________', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Describe a suspicious Vancouver Island cougar sighting', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'A BC logging truck motto nobody should repeat', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The shocking secret of the world''s tallest totem pole', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What really happens at a Tofino storm-watching party', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What happens when a Whistler hippie invades Victoria', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The real reason the SeaBus and BC Ferries are always beefing', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The true story behind the Swartz Bay green-out', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'A James Bay hipster’s biggest complaint', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The Oak Bay dog-walker feud started because __________', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The sneakiest scam at a Saanich farm stand', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'A Sidney retiree’s surprising side hustle', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'BC Ferries buffet had all-you-can-eat __________ and we loved it', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'How an Inner Harbour busker got sweet revenge', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The weirdest thing found atop Mt Doug', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The Goldstream ghost town’s most unbelievable tale', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'A Sooke pothole legend told for generations', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The main attraction at a Langford redneck rodeo', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Worst excuse a Canucks fan uses after another loss', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Worst excuse a Canucks fan gives for renewing season tickets', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'How the Canucks will break BC hearts *this* time', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The Whitecaps pre-game ritual nobody admits to', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'A Whitecaps player’s excuse for missing an open net', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The Whitecaps halftime show that emptied the stands', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The real reason BC cancelled its EV mandate', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What the province will blame wildfires on this year', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Worst thing to do on the beach', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Worst thing about the cruise ships', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What the Queen really thought when she visited Victoria', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What goes on in the basement of the Empress Hotel', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What happens to you if you don''t thank the bus driver', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What a Langford resident considers fine dining', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Most common tinder profile picture you''ll see in Victoria', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'If the seagulls could talk what would they say', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'Why the water taxi captain was fired on his first day', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The worst thing to hear from a BC ferry worker', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The real reason why the road to tofino is always closed', true, 49) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What happens further north on the island than Courtenay?', true, 50) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'What the hipster in Fernwood names their sourdough starter', true, 51) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('victoria', 'The worst pickup line to use at the sticky wicket', true, 52) ON CONFLICT DO NOTHING;

-- Medieval Mayhem prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing a knight could yell before charging into battle', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible name for a medieval tavern', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The real reason the dragon is hoarding gold', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the court jester whispered that got them executed', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A rejected name for King Arthur''s sword', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to hear from your blacksmith', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible medieval pickup line at the castle ball', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the plague doctor is really thinking', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The most useless item in a wizard''s spellbook', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A horrible name for a knight''s trusty steed', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What really happened during the missing chapter of the Round Table', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to find in your mead', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible excuse for losing a jousting tournament', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the castle ghost complains about most', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The real reason the drawbridge is always up', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A rejected medieval torture device', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the king''s food taster secretly does with the leftovers', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing a fortune teller could predict for a peasant', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible name for a medieval rock band', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the monks are really doing in the monastery', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The most embarrassing way to be knighted', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A horrible medieval dating app name', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the princess is actually locked in the tower for', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to yell during a royal wedding', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible name for a medieval guild', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What really started the Hundred Years'' War', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The most useless medieval profession', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A rejected coat of arms design', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the court magician uses magic for when nobody''s watching', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to hear from your executioner', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible medieval festival theme', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the gargoyles gossip about at night', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The real reason nobody goes into the Forbidden Forest', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A horrible name for a medieval siege weapon', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the royal advisor is really whispering to the king', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to bring to a medieval potluck feast', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible slogan for a crusade', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the village idiot is actually a genius at', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The most embarrassing thing to happen during a coronation', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A rejected medieval saint and what they''re the patron of', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the alchemist accidentally created instead of gold', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to hear from your squire before battle', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible name for a medieval beauty pageant', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What really happens in the dungeon after visiting hours', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The most useless magical artifact in the kingdom', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A horrible medieval Yelp review of the castle', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the bard''s song is really about', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'The worst thing to inscribe on a legendary sword', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'A terrible medieval conspiracy theory', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('medieval', 'What the royal family doesn''t want the peasants to know', true, 49) ON CONFLICT DO NOTHING;

-- Anime Antics prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your excuse for being late that involves running and toast', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The school club that takes itself way too seriously', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What you dramatically yell before taking a math test', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your embarrassing power-up pose for opening a jar', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The worst backstory for why you can''t swim', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What the lunch lady is secretly training you for', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'A ridiculous name for your study technique', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What happens when you bump into someone in the hallway', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The transfer student''s dark secret', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your rival''s catchphrase for beating you at rock-paper-scissors', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What you see during your flashback about making friends', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The dramatic reason you forgot your homework', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your special attack name for folding laundry', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What the school festival fortune teller actually predicts', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The training arc you need to learn how to cook rice', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your childhood friend''s confession', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What power the student council president actually has', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The worst thing to happen during the class trip', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your inner monologue during a group project', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The tournament arc for who gets the last pudding cup', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What you unlock after 100 push-ups', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your transformation sequence for changing into gym clothes', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The mysterious senpai''s advice that makes no sense', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What really happens in the clubroom after school', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your ultimate technique for waking up on time', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The power system based on how much sleep you got', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What the mascot character represents', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your dramatic entrance to the convenience store', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The filler episode about finding a lost pet', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What you yell when your phone is at 1% battery', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The beach episode excuse for fanservice', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your rival''s motivation for competing in the talent show', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The hot springs episode that''s just people talking', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What your special ability is', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The training montage for learning to ride a bike', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your battle cry for doing the dishes', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What the mysterious organization wants', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The plot twist about who ate your lunch', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your power level after drinking coffee', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The dramatic showdown over the TV remote', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What you inherited from your mentor', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The tournament bracket for the school sports day', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your finishing move name for parallel parking', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What happens when you make eye contact with your crush', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The reason you need a 5-episode arc to ask someone out', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your special form when you''re hangry', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What the power of friendship gets you', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'The training you need to survive family dinner', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'Your catchphrase before every mundane decision', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('anime', 'What your determination is really about', true, 49) ON CONFLICT DO NOTHING;

-- Political Roasts prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst campaign slogan ever', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What politicians really do during closed-door meetings', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible name for a new political party', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most useless cabinet position', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What world leaders actually talk about at the G7', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst thing to say during a presidential debate', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible political scandal involving office supplies', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the UN translator refuses to translate', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most embarrassing diplomatic gift exchange', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible name for a political action committee', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What really happens at Davos after hours', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst campaign promise a politician could make', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible political memoir title', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the Secret Service agents gossip about', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most useless international treaty', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible political nickname that actually stuck', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What politicians are really thinking during the national anthem', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst thing to leak from a politician''s emails', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible name for a bipartisan initiative', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What really caused the diplomatic incident nobody talks about', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most embarrassing thing caught on a hot mic', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible political attack ad concept', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the intern discovered that made them quit politics forever', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst campaign rally entertainment act', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible name for a political podcast', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What world leaders actually argue about at climate summits', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most useless political fact-checking site', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible political dynasty family business', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the teleprompter said that the politician ignored', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst thing to happen during a state dinner', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible political rebranding attempt', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the opposition party does at their secret retreats', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most embarrassing political gaffe that got spun as intentional', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible name for a political think tank', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What lobbyists really spend their budget on', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst political Halloween costume', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible name for a congressional committee', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the prime minister''s cat knows but can''t tell', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most useless political poll question', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible political reality show concept', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What really happens in the situation room during boring times', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst thing a politician could say to a foreign leader', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible political charity event theme', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What the speechwriter wanted to write but couldn''t', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The most embarrassing reason a bill failed to pass', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A terrible political Twitter feud topic', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What diplomats really mean when they say ''productive talks''', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'The worst political endorsement backfire', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'A horrible name for a political reform movement', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('politics', 'What they''re really voting on when the cameras are off', true, 49) ON CONFLICT DO NOTHING;

-- Sci-Fi Shenanigans prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing to hear from your spaceship''s AI', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible name for a new planet', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What aliens actually think about Earth''s music', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most useless piece of futuristic technology', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible name for your space crew', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What really happened during the Mars colony incident', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing to malfunction on a space station', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible alien species'' defining characteristic', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the time traveler accidentally changed', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most embarrassing first contact scenario', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible name for a faster-than-light drive', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the robot uprising is actually protesting', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing to find in cryosleep', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible intergalactic law', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the hologram is doing when you''re not looking', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most useless alien superpower', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible name for a space station bar', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the universal translator refuses to translate', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing to happen during teleportation', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible name for a new element', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the cyborg regrets upgrading', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most embarrassing reason for a planetary evacuation', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible sci-fi dating app name', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the clone is better at than the original', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing your neural implant could autocorrect', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible name for a galactic federation', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What really powers the Death Star', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most useless space exploration mission', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible alien invasion strategy', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the sentient spaceship gossips about', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing to hear from mission control', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible name for a wormhole', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the android dreams about', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most embarrassing malfunction of your exosuit', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible name for a space mining corporation', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the parallel universe version of you is doing right now', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst sci-fi weapon side effect', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible reason the colony ship went off course', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the alien ambassador is really offended by', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most useless mutation from radiation exposure', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible name for a black hole', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the quantum computer calculated that nobody wanted to know', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing to happen during a spacewalk', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible intergalactic trade agreement', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the terraforming project accidentally created', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The most embarrassing thing in the captain''s log', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A horrible name for a new galaxy', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'What the force field is actually keeping out', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'The worst thing your replicator could produce', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('scifi', 'A terrible reason for the robot''s existential crisis', true, 49) ON CONFLICT DO NOTHING;

-- Pop Culture Chaos prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity collaboration nobody asked for', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible name for a celebrity fragrance', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What really happens at the Met Gala after-party', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most useless celebrity side hustle', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible reality show spinoff', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the Kardashians are actually famous for', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity apology video opening line', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible name for a celebrity''s child', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What influencers do when the camera stops rolling', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most embarrassing celebrity endorsement deal', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible celebrity memoir chapter title', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What really caused the celebrity feud', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst thing to trend on Twitter', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible celebrity cooking show concept', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the paparazzi photo didn''t capture', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most useless TikTok trend', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible name for a celebrity podcast', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the award show host really wanted to say', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity fashion statement', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible streaming service exclusive series', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What really happens in the VIP section', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most embarrassing celebrity tattoo meaning', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible celebrity couple name mashup', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the pop star''s lyrics actually mean', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst thing to go viral', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible celebrity beauty line product', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What really happened during the infamous interview', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most useless celebrity masterclass', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible name for a celebrity restaurant', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the celebrity''s assistant has to deal with daily', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity comeback attempt', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible influencer brand deal', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the celebrity is actually canceled for this time', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most embarrassing red carpet moment', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible celebrity gaming stream', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What really started the stan war', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity NFT project', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible name for a celebrity wellness brand', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the celebrity ghost writer actually wrote', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most useless celebrity app', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible celebrity documentary revelation', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the meme actually says about society', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity political take', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible name for a celebrity tequila brand', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What really happens at influencer retreats', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The most embarrassing celebrity throwback photo', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A horrible celebrity metaverse event', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'What the algorithm is hiding from you', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'The worst celebrity rebrand attempt', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('popculture', 'A terrible thing to put in your Instagram bio', true, 49) ON CONFLICT DO NOTHING;

-- Cinema Snark prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst movie sequel title', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible name for a film festival', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the director''s cut actually added', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most useless movie theater snack', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible movie reboot nobody wanted', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What really happened during the infamous reshoot', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst thing to yell in a movie theater', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible Oscar acceptance speech opening', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the method actor took way too far', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most embarrassing movie cameo', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible name for a production company', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the post-credits scene should have been', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst movie plot twist', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible film school thesis project', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the stunt double refuses to do', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most useless deleted scene', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible movie franchise crossover', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What really caused the on-set drama', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst thing to happen during a premiere', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible movie tagline', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the actor improvised that made it to the final cut', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most embarrassing green screen fail', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible name for a movie streaming platform', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the film critic really wanted to write', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst casting choice that somehow worked', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible movie musical adaptation', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What really happens at Sundance after dark', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most useless special feature on the Blu-ray', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible movie universe expansion', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the screenwriter''s original ending was', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst thing to say during a script reading', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible movie merchandise item', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the cinematographer is secretly filming', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most embarrassing movie premiere outfit', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible film noir title', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What really won the movie its rating', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst movie marketing campaign', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible name for a cinema chain', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the focus group actually said', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most useless movie tie-in game', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible movie remake setting change', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the blooper reel didn''t show', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst thing to happen during award season campaigning', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible movie trilogy finale', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What the composer''s rejected score sounded like', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The most embarrassing movie poster tagline', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A horrible cinematic universe team-up', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'What really happened to the original footage', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'The worst movie adaptation change from the book', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('cinema', 'A terrible name for an indie film', true, 49) ON CONFLICT DO NOTHING;

-- Canucks Chaos prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What Petey needs to do to score like vintage Petey again', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The worst line combination Foote could possibly make', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your theory on how shitposting makes the team play better', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What Demko is actually rehabbing from', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A terrible excuse for why the power play is 0/47', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What Lankinen is secretly thinking during a shutout', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The most embarrassing place to have a Canucks breakdown', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your conspiracy theory about the health and performance staff', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What really happens when the coach juggles lines mid-game', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A horrible reason to scratch your best player', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the Spirit of Suffering actually means to you', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The worst thing r/canucks could meme into existence', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your explanation for another third period collapse', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the mysterious upperclassman on the roof is plotting', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What happens when you run into another Canucks fan in public', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The real reason the team plays better when the sub shitposts', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your most delusional Canucks playoff prediction', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the Sedin twins would say about this team', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What Boeser is really thinking during overtime', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The worst take you''ve seen on r/canucks this week', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your theory on why we can''t have nice things', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the team does during the mysterious ''player-led meeting''', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A terrible reason to call into Sportsnet 650', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What really happens in the Canucks Discord at 2am', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your honest review of the Orca Bay jerseys', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The most painful way to lose to the Oilers', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What you yelled at your TV during the last game', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A horrible Canucks-themed tattoo idea', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the advanced stats say', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The real reason we keep talking about 2011', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your excuse for watching every game despite the pain', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What happens when someone mentions Messier', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A terrible Canucks drinking game rule', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the team is manifesting with all this suffering', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your prediction for tonight''s game', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The worst thing to happen during Pride Night', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What the HockeyMod bot is secretly judging us for', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A horrible excuse for being late', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What you inherit as a Canucks fan', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The most unhinged post-game thread title', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your theory on the mushy middle draft position curse', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What happens when the memes run out', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'A terrible excuse for another rebuild year', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'What Petey''s vintage piss missile really looks like', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'The worst thing about being in the Pacific Division', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('canucks', 'Your honest take on trading everyone and starting over', true, 45) ON CONFLICT DO NOTHING;

-- BC Vibes prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The real reason you can''t afford a shoebox in Vancouver', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you''re actually bidding on in Vancouver', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your excuse for still living with your parents at 35', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A terrible Vancouver housing listing description', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What ''cozy'' really means in a BC rental ad', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The worst thing your landlord could say during a showing', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your honest review of a $2800/month basement suite', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you''d sacrifice to afford a down payment in Vancouver', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A horrible reason to line up for 6 hours', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What Vancouverites will queue for that makes no sense', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The most ridiculous thing you''ve seen people line up for', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your theory on why BC loves lineups so much', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you''re really thinking while standing in line', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The worst place to discover a 2-hour lineup', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A terrible excuse for being late in Vancouver', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What the person at the front of the line is actually doing', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your breaking point in a Vancouver lineup', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The most embarrassing thing to line up for', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you expected vs what you got after the lineup', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A horrible new thing Vancouverites would line up for', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The real difference between Vancouver and reality', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you thought BC would be like vs what it actually is', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your most delusional expectation about moving to Vancouver', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What tourists think Vancouver is vs what locals know', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A terrible reality check about living in BC', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What the Instagram photo didn''t show you', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your honest take on ''Best Place on Earth''', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The worst thing about BC that nobody warned you about', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you tell people about BC vs what you really think', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A horrible truth about Vancouver you learned too late', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What replaced the Starbucks on your corner', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your theory on why we need 47 dispensaries per block', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A terrible name for a new BC weed store', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you thought when the 5th dispensary opened on your street', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The most ridiculous weed store location', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What''s inside the old bank building now', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your honest review of BC''s weed store density', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A horrible weed store promotional idea', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What BC has too many of', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The real reason the BC Ferries are delayed', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your worst BC Ferries horror story', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you missed because of a ferry cancellation', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A terrible excuse BC Ferries would actually use', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What really happens during a 3-sailing wait', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your survival strategy for ferry lineups', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'The worst thing to hear from BC Ferries staff', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What you''d rather do than wait for the ferry', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A horrible BC Ferries food court experience', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'Your honest review of the Tsawwassen terminal', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'What the ferry schedule really means', true, 49) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('bc', 'A terrible reason to miss the last ferry', true, 50) ON CONFLICT DO NOTHING;

-- Tech & AI Slop prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst thing ChatGPT has confidently told you', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your honest review of machine-generated art', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible use case for artificial intelligence', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What you asked a chatbot that you regret', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most useless smart home device', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your theory on why everything needs an app now', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible feature nobody asked for', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What tech bros think will solve everything', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst auto-generated content you''ve seen', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible name for a new tech startup', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What happens when you trust autocorrect too much', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your most embarrassing tech fail', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A ridiculous thing that''s now ''powered by machine learning''', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst tech trend that needs to die', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What your smart speaker is actually listening for', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible subscription service for something that should be free', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your honest take on NFTs', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most pointless tech gadget', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What Silicon Valley will try to disrupt next', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible prompt you actually tried', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst thing about software updates', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your conspiracy theory about tech companies', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A ridiculous feature in the latest iPhone', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What the algorithm thinks your job is', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most annoying notification you get', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible tech buzzword that means nothing', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What happens when you let bots write your emails', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst tech support experience', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible idea for a new social media platform', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your breaking point with technology', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What tech companies call ''innovation'' now', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most useless browser extension', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible way automation could replace your job', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What you''d rather do than update your passwords', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst thing about smart TVs', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible tech prediction that aged poorly', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What your algorithm thinks you want to see', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most annoying thing about video calls', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A ridiculous thing that requires facial recognition', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your honest opinion on the metaverse', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst computer-generated movie script idea', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible tech solution to a problem that doesn''t exist', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What happens when machines try to be creative', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most overrated tech company', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible smart device for your home', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What tech influencers won''t admit', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst thing about cloud storage', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible virtual assistant name', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What you''d ban from the internet if you could', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your most delusional tech take', true, 49) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your honest review of machine-generated music', true, 50) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible genre for robot-made songs', true, 51) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What synthetic voices are ruining', true, 52) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst thing about algorithm-generated playlists', true, 53) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible use for text-to-image generators', true, 54) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What deepfakes will ruin next', true, 55) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your theory on why everything looks the same now', true, 56) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible thing that''s been automated', true, 57) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most soulless generated content you''ve seen', true, 58) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What happens when bots try to make memes', true, 59) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A ridiculous thing people are using image generators for', true, 60) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst synthetic influencer concept', true, 61) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your breaking point with generated content', true, 62) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A horrible job that''s now done by algorithms', true, 63) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What machine learning gets hilariously wrong', true, 64) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The most annoying thing about voice cloning', true, 65) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'A terrible use for video generation tools', true, 66) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'What the training data definitely shouldn''t include', true, 67) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'Your conspiracy theory about synthetic media', true, 68) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('tech', 'The worst auto-generated social media post', true, 69) ON CONFLICT DO NOTHING;

-- Internet Culture prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst way to start an apology video', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A ridiculous reason to get canceled online', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most cringe way a brand tries to be relatable', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A TikTok trend that makes no sense', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your theory on why people do dangerous challenges', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst thing a brand could tweet', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A viral moment that didn''t age well', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What influencers say vs what they actually mean', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most performative way to apologize', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A hashtag that spiraled out of control', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your honest take on influencer culture', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most embarrassing way to go viral', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A terrible excuse for problematic behavior', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What your algorithm thinks you want to see', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst way to respond to criticism online', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Something people get way too mad about online', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your breaking point with social media', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A brand trying too hard to connect with Gen Z', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What makes a video blow up for the wrong reasons', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The pettiest reason for an internet feud', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst type of platform drama', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A terrible comeback strategy after being canceled', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What influencers need to stop posting about', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'An overused trend that needs to end', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst influencer collaboration idea', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your conspiracy theory about viral content', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Something that shouldn''t have trended', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A ridiculous reason to unfollow someone', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What the comment section really wants to say', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most fake activism post you''ve seen', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A terrible career pivot after controversy', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What people actually talk about in group chats', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst main character energy online', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A challenge that was obviously a bad idea', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your unpopular opinion about internet discourse', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most embarrassing brand social media moment', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A horrible concept for content creators to live together', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What people pretend to care about for clout', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The worst thing to post in a Notes app apology', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'An internet controversy that got blown out of proportion', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your take on people switching platforms', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most annoying type of content that goes viral', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A terrible revelation from an influencer tell-all', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What your For You Page reveals about your personality', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most desperate attempt to stay relevant', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A social media rebrand that flopped', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'What really causes mass unfollowing events', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'The most cringe thing influencers say', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'A viral moment that should be forgotten', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('internetculture', 'Your most controversial take on internet culture', true, 49) ON CONFLICT DO NOTHING;

-- Dating App Disasters prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst opening line on a dating app', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A red flag you ignored because they were hot', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your most embarrassing dating profile photo', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst thing to find on someone''s profile', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A bio that''s an instant left swipe', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What your dating app algorithm thinks you want', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst first date location suggestion', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A pickup line that''s never worked', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your excuse for ghosting someone', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most cringe thing someone said on a first date', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A dating app prompt answer that''s a red flag', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What you put in your bio vs what you should put', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst way to start a conversation', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A dealbreaker that''s probably too picky', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your theory on why everyone''s profile looks the same', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst thing to happen during a video date', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A lie everyone tells on their dating profile', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What your terrible dating history says about you', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most overused dating app photo', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A first date story that ended in disaster', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your excuse for still being on the apps', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst thing to text after a first date', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A dating app feature that shouldn''t exist', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What you''re really looking for vs what you say', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most annoying type of dating profile', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A conversation that died immediately', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your worst dating app fail', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The red flag you are', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A terrible dating app name', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What you learned from your worst date', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most desperate thing you''ve done on the apps', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A dating profile cliché that needs to die', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your excuse for not meeting up', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst thing about modern dating', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A message you regret sending', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What your swipe pattern reveals about you', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most awkward first date moment', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A dating app bio that''s trying too hard', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your theory on why dating apps don''t work', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst thing to discover after matching', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A first date question that''s too personal', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What you wish you could filter for', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most unhinged dating app conversation', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A date that should have been a text', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your breaking point with dating apps', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The worst dating advice you''ve received', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'A photo that should never be on a dating profile', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'What you''re doing wrong on the apps', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'The most creative way someone unmatched you', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('datingapp', 'Your honest review of dating app culture', true, 49) ON CONFLICT DO NOTHING;

-- Remote Work Reality prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing to happen during a video call', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your excuse for having your camera off', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What your coworkers don''t know about your WFH setup', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most embarrassing Zoom background fail', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A terrible thing to forget to mute', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your breaking point with video meetings', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing your boss said on Slack', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What you''re really doing during meetings', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A passive-aggressive Slack message', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most annoying coworker on video calls', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your excuse for being late to a virtual meeting', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst work-from-home distraction', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A terrible hybrid work policy', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What your messy room revealed on camera', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most awkward virtual happy hour moment', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your theory on why meetings could have been emails', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing about always being available', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A work-from-home outfit that''s too honest', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What you''ve said with your mic muted', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most chaotic thing to happen in your background', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your excuse for not turning on video', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst virtual team building activity', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A Slack status that says too much', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What your screen share accidentally revealed', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most passive-aggressive email sign-off', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your breaking point with Zoom fatigue', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing about working in your pajamas', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A terrible remote work perk', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What your pet did during an important call', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most awkward thing caught on camera', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your excuse for missing a deadline', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing about no work-life boundaries', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A meeting that destroyed your productivity', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What you really think during standups', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most annoying Slack notification', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your theory on why everyone''s always in meetings', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst virtual presentation fail', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A coworker''s home office red flag', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What your calendar really looks like', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most desperate attempt to look busy', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your breaking point with corporate jargon on calls', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing about async communication', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A virtual meeting that should have been canceled', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What you''ve learned about your coworkers from their homes', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The most chaotic family interruption', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your excuse for not responding immediately', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'The worst thing about being always online', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'A remote work habit you''re not proud of', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'What you miss least about the office', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('remotework', 'Your honest take on return-to-office mandates', true, 49) ON CONFLICT DO NOTHING;

-- Adulting Fails prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing to realize at 2am before a deadline', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your excuse for not having your life together at 30', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A basic adult task you still can''t do', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most embarrassing thing you had to Google', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you thought adulting would be vs reality', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your breaking point with responsibilities', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst financial decision you''ve made', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A bill you forgot existed until it was overdue', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What your parents were right about', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most adult purchase that made you feel old', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your excuse for eating cereal for dinner', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about doing your own taxes', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A household chore you''ve been avoiding for months', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you''re still asking your parents to do', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most embarrassing doctor''s appointment', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your theory on why nobody taught you this', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about health insurance', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A life skill you''re faking until you make it', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you spend money on vs what you should', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most chaotic thing in your fridge', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your excuse for not meal prepping', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about apartment hunting', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A responsibility you''re procrastinating on', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What your credit score says about you', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most embarrassing thing you called your landlord for', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your breaking point with being an adult', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about making your own appointments', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A basic repair you paid someone to do', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you thought you''d have figured out by now', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most expensive lesson you''ve learned', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your excuse for not having a savings account', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about grocery shopping alone', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A subscription you forgot to cancel', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What your younger self would be disappointed by', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most adult problem nobody warned you about', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your theory on why adulting is a scam', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about work-life balance', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A milestone you''re behind on', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you''re still learning the hard way', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most embarrassing thing you didn''t know', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your excuse for living like a college student', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about being responsible', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A purchase you regret as an adult', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you wish someone had told you', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The most chaotic thing about your daily routine', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your breaking point with expectations', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'The worst thing about pretending to be an adult', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'A basic task that still stresses you out', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'What you''re doing instead of being productive', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('adulting', 'Your honest take on having it all together', true, 49) ON CONFLICT DO NOTHING;

-- Group Chat Chaos prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing to send in the wrong group chat', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Why you left the family group chat', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A message that killed the conversation instantly', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most chaotic group chat you''re in', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your excuse for not responding for 3 days', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing someone forwarded', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A group chat name that went too far', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you really think about the group chat', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most annoying person in every group chat', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your theory on why nobody responds', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst time to get added to a group chat', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A message you sent that got screenshot', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What the group chat says about you behind your back', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most embarrassing autocorrect fail', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your breaking point with group chat drama', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing to wake up to', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A group chat that should have been a DM', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you''ve muted notifications for', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most passive-aggressive message', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your excuse for leaving someone on read', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst group chat rule', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A conversation that got too heated', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you wish you could unsend', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most chaotic thing someone shared', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your theory on group chat etiquette', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing about being the admin', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A message that started a fight', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you''re afraid to say in the group chat', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most annoying group chat habit', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your excuse for not seeing the messages', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing about read receipts', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A group chat that''s just one person talking', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you really mean when you react with 👍', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most awkward silence after a message', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your breaking point with notifications', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing someone replied all to', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A group chat you can''t leave', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What the typing indicator really means', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most chaotic 2am message', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your theory on why group chats die', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst thing about being added without permission', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A message that aged terribly', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you''ve learned from group chat mistakes', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most annoying use of voice messages', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your excuse for ghosting the group chat', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The worst group chat meltdown', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'A conversation that should have stayed private', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'What you''re secretly judging people for', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'The most chaotic group chat moment', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('groupchat', 'Your honest take on group chat culture', true, 49) ON CONFLICT DO NOTHING;

-- Streaming Wars prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A streaming service you''re still paying for but never use', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about having 47 subscriptions', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your excuse for sharing someone else''s password', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What your watch history says about you', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most embarrassing show you''ve binged', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your theory on why everything is a limited series now', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about streaming service exclusive content', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A show you started but never finished', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What you''re really doing instead of watching', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most annoying streaming platform feature', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your breaking point with subscription costs', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing to discover got removed', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A show everyone loves that you couldn''t get into', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What the algorithm thinks you want to watch', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most chaotic binge-watching session', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your excuse for rewatching the same show again', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about too many streaming options', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A subscription you forgot you were paying for', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What you wish was on streaming but isn''t', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most annoying thing about autoplay', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your theory on why streaming is the new cable', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst streaming service interface', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A show you''re embarrassed to admit you watch', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What you''re judging people for watching', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most chaotic thing to watch at 3am', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your breaking point with content removal', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about password sharing crackdowns', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A show that didn''t deserve a second season', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What your continue watching list reveals', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most annoying streaming ad', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your excuse for not canceling subscriptions', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about streaming service originals', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A show you only watched because of the hype', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What you''re secretly binge-watching', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most chaotic watch party moment', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your theory on why shows get canceled', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about waiting for new seasons', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A streaming bundle that makes no sense', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What you''re paying for that you shouldn''t', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most annoying thing about recommendations', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your breaking point with streaming quality', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about regional restrictions', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A show you started out of spite', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What your profile name says about you', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The most embarrassing thing in your watch history', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your excuse for not finishing that popular show', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'The worst thing about streaming service price hikes', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'A subscription you''ll never cancel', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'What you''re watching instead of being productive', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('streaming', 'Your honest take on the streaming wars', true, 49) ON CONFLICT DO NOTHING;

-- Climate Anxiety prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your excuse for not being zero waste', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most performative eco-friendly product', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you pretend to recycle correctly', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your breaking point with climate doom scrolling', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst greenwashing you''ve seen', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A sustainable swap you''ll never make', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What corporations want you to feel guilty about', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most annoying eco-influencer take', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your theory on why recycling is a scam', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst thing about reusable everything', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A climate solution that''s actually worse', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you''re doing wrong for the environment', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most expensive eco-friendly product', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your excuse for still using plastic', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst thing about eco-anxiety', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A green initiative that''s performative', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you wish you didn''t know about climate change', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most annoying thing about sustainability culture', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your breaking point with individual responsibility', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst eco-friendly packaging fail', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A climate fact that keeps you up at night', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you''re too lazy to do sustainably', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most chaotic thing about composting', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your theory on why we''re all doomed', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst thing about eco-guilt', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A sustainable product that''s a scam', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you''re pretending you don''t know', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most annoying zero waste advice', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your excuse for not going vegan', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst thing about climate discourse online', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A green habit you gave up on', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What your carbon footprint really looks like', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most performative climate activism', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your breaking point with eco-shaming', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst thing about sustainable fashion', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A climate solution nobody wants to talk about', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you''re doing instead of saving the planet', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most annoying thing about reusable bags', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your theory on why nothing will change', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst eco-friendly alternative', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A climate change coping mechanism', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you wish companies would actually do', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most exhausting part of being eco-conscious', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your excuse for not doing more', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The worst thing about climate anxiety culture', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'A green product that''s not worth it', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'What you''re tired of hearing about', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'The most annoying climate take', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your breaking point with sustainability pressure', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('climateanxiety', 'Your honest take on saving the planet', true, 49) ON CONFLICT DO NOTHING;

-- Fictional Worlds prompts
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst job in the Star Wars universe', true, 0) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Why Hogwarts would get sued in real life', true, 1) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A Game of Thrones character''s terrible Tinder bio', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most useless superpower in the MCU', true, 3) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your theory on why the Death Star had no railings', true, 4) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about living in Middle-earth', true, 5) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A Harry Potter spell that''s definitely illegal', true, 6) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What really happened to all those Stormtroopers', true, 7) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most questionable Hogwarts house placement', true, 8) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your excuse for joining the Empire', true, 9) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about being a Stark', true, 10) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A superhero whose powers are more curse than gift', true, 11) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What the Sorting Hat really thinks', true, 12) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most realistic way a zombie apocalypse would end', true, 13) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your theory on why nobody uses the Time-Turner properly', true, 14) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about the Jedi Order', true, 15) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A Game of Thrones death that was deserved', true, 16) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What Muggles really think is happening', true, 17) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most useless character in Lord of the Rings', true, 18) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your excuse for being a Slytherin', true, 19) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about the Marvel multiverse', true, 20) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A Star Wars plot hole that ruins everything', true, 21) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What Dumbledore was really up to', true, 22) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most questionable superhero origin story', true, 23) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your theory on why Westeros has no therapy', true, 24) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about being a redshirt', true, 25) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A fictional world''s terrible healthcare system', true, 26) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What really powers the TARDIS', true, 27) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most annoying character everyone loves', true, 28) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your excuse for the sequel trilogy', true, 29) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about living in Gotham', true, 30) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A Harry Potter character who peaked in school', true, 31) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What the droids are really thinking', true, 32) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most realistic outcome of time travel', true, 33) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your theory on why villains monologue', true, 34) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about the Hunger Games system', true, 35) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A fictional government that''s definitely a dictatorship', true, 36) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What really happened in the Star Wars prequels', true, 37) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most questionable magical creature', true, 38) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your excuse for Thanos being right', true, 39) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about the Matrix', true, 40) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A fictional school''s terrible safety record', true, 41) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What the NPCs are really doing', true, 42) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most annoying chosen one trope', true, 43) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your theory on why nobody learns from history', true, 44) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The worst thing about fictional economies', true, 45) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'A character death that solved nothing', true, 46) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'What the background characters witness', true, 47) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'The most questionable world-building decision', true, 48) ON CONFLICT DO NOTHING;
INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('fictionalworlds', 'Your honest take on fictional politics', true, 49) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 2: Insert Sample Teams with Team Codes and Captains
-- ============================================================================

-- Insert sample teams
INSERT INTO teams (id, session_id, name, team_code, captain_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'The Roasters', '1234', '550e8400-e29b-41d4-a716-446655440010', '2025-01-22T18:00:00Z'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Bar Flies', '5678', '550e8400-e29b-41d4-a716-446655440011', '2025-01-22T18:01:00Z'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'The Regulars', '9012', '550e8400-e29b-41d4-a716-446655440012', '2025-01-22T18:02:00Z');

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  team_code = EXCLUDED.team_code,
  captain_id = EXCLUDED.captain_id;

-- Insert sample team codes for the session
INSERT INTO team_codes (code, session_id, team_id, is_used, assigned_at) VALUES
  ('1111', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('2222', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('3333', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('4444', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('5555', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('6666', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('7777', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('8888', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('9999', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('0000', '550e8400-e29b-41d4-a716-446655440000', NULL, False, NULL),
  ('1234', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', True, '2025-01-22T18:00:00Z'),
  ('5678', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', True, '2025-01-22T18:01:00Z'),
  ('9012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', True, '2025-01-22T18:02:00Z');

ON CONFLICT (code) DO UPDATE SET
  team_id = EXCLUDED.team_id,
  is_used = EXCLUDED.is_used,
  assigned_at = EXCLUDED.assigned_at;

-- Insert sample team members
INSERT INTO team_members (id, team_id, user_id, device_id, is_captain, joined_at, last_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'device-roasters-1', True, '2025-01-22T18:00:00Z', '2025-01-22T18:30:00Z'),
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 'device-roasters-2', False, '2025-01-22T18:05:00Z', '2025-01-22T18:25:00Z'),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', 'device-flies-1', True, '2025-01-22T18:01:00Z', '2025-01-22T18:35:00Z'),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014', 'device-flies-2', False, '2025-01-22T18:03:00Z', '2025-01-22T18:28:00Z'),
  ('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015', 'device-flies-3', False, '2025-01-22T18:07:00Z', '2025-01-22T18:32:00Z'),
  ('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'device-regulars-1', True, '2025-01-22T18:02:00Z', '2025-01-22T18:40:00Z');

ON CONFLICT (team_id, user_id, device_id) DO UPDATE SET
  is_captain = EXCLUDED.is_captain,
  last_active = EXCLUDED.last_active;

-- ============================================================================
-- STEP 3: Verify the seed (Updated to include team data)
-- ============================================================================

-- Verify prompts are seeded
SELECT
  '=== PROMPT LIBRARIES SEEDED ===' as status,
  COUNT(*) as total_libraries
FROM prompt_libraries;

SELECT
  '=== PROMPTS SEEDED ===' as status,
  COUNT(*) as total_prompts
FROM prompts;

SELECT
  pl.id,
  pl.name,
  pl.emoji,
  COUNT(p.id) as prompt_count
FROM prompt_libraries pl
LEFT JOIN prompts p ON p.library_id = pl.id
GROUP BY pl.id, pl.name, pl.emoji, pl.sort_order
ORDER BY pl.sort_order;

-- Verify teams are seeded
SELECT
  '=== TEAMS SEEDED ===' as status,
  COUNT(*) as total_teams
FROM teams;

SELECT
  '=== TEAM CODES SEEDED ===' as status,
  COUNT(*) as total_codes,
  COUNT(CASE WHEN is_used THEN 1 END) as used_codes,
  COUNT(CASE WHEN NOT is_used THEN 1 END) as available_codes
FROM team_codes;

SELECT
  '=== TEAM MEMBERS SEEDED ===' as status,
  COUNT(*) as total_members,
  COUNT(CASE WHEN is_captain THEN 1 END) as captains,
  COUNT(DISTINCT team_id) as teams_with_members
FROM team_members;

-- Show team details
SELECT
  t.id,
  t.name,
  t.team_code,
  COUNT(tm.id) as member_count,
  COUNT(CASE WHEN tm.is_captain THEN 1 END) as captain_count
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
GROUP BY t.id, t.name, t.team_code
ORDER BY t.created_at;

SELECT '=== DATABASE READY FOR GAME SESSIONS WITH TEAM SUPPORT ===' as result;

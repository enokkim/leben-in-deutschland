# CLAUDE.md - AI Context for Leben in Deutschland

## CURRENT STATUS (January 2026)

### Deployment: LIVE
- **URL**: https://leben-in-deutschland.vercel.app
- **GitHub**: https://github.com/enokkim/leben-in-deutschland
- **Status**: Deployed and working

### What's Done
- [x] Project fully built and tested locally
- [x] All 310 questions extracted and converted to JSON
- [x] Clean project structure with separate files
- [x] Git initialized with initial commit
- [x] GitHub repo created at `enokkim/leben-in-deutschland`
- [x] Remote origin configured
- [x] Pushed to GitHub
- [x] Deployed to Vercel
- [x] Security fixes (XSS vulnerabilities)
- [x] Error handling improvements
- [x] Accessibility features (ARIA labels, semantic HTML)
- [x] SEO meta tags added
- [x] Progress bar bug fixed
- [x] Questions verified against official BAMF sources

### Code Review Summary (January 10, 2026)
| Area | Score | Notes |
|------|-------|-------|
| Code Quality | 8/10 | Fixed from 6.5/10 after security patches |
| Data Integrity | 10/10 | All 310 questions verified correct |
| Deployment | 10/10 | Live on Vercel |
| Question Accuracy | 10/10 | Verified against official BAMF sources |

---

## Future Iterations

*Add feedback and improvement ideas here after testing:*

- [ ] _Example: Add dark mode_
- [ ] _Example: Add sound effects for correct/wrong answers_
- [ ] _Example: Add explanation text for each question_

---

---

## Project Overview

This is a practice test application for the German "Leben in Deutschland" (Life in Germany) integration test. The test is required for obtaining permanent residency (Niederlassungserlaubnis) or German citizenship (Einbuergerung).

**Target User**: Immigrants preparing for the official test
**Primary Use Case**: 15-minute daily practice sessions on mobile devices
**Edition**: Berlin (includes 10 Berlin-specific state questions)

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **Data**: JSON file with 310 questions
- **Storage**: Browser LocalStorage for progress tracking
- **Deployment**: Static hosting (Vercel/GitHub Pages/Netlify)
- **No Build Step**: Direct browser execution

## File Structure

```
leben-in-deutschland/
├── index.html        # Main app structure, screen layouts
├── styles.css        # All styles, German flag color theme
├── app.js            # Application logic, state management
├── questions.json    # 310 questions in JSON format
├── README.md         # Public documentation for GitHub
├── CLAUDE.md         # This file - AI development context
└── vercel.json       # Vercel deployment configuration
```

## Recent Changes Made

### Language Toggle Redesign
Changed from text-based "Tap to see translation" to a **toggle pill design**:
- Two buttons: `[DE]` and `[EN]` with flag emojis
- Active state highlighted with white background
- Located below each question
- Function renamed from `toggleTranslation()` to `setLanguage(lang)`

### Files Modified for Toggle Pill:
- `styles.css`: Added `.lang-toggle`, `.lang-toggle-pill`, `.lang-toggle-btn` classes
- `index.html`: Replaced translate-hint div with toggle pill markup
- `app.js`: Replaced `toggleTranslation()` with `setLanguage(lang)`, updated `showQuestion()`

## Application Architecture

### Screens (div.screen)
1. **home-screen** - Main menu with stats and mode buttons
2. **quiz-screen** - Question display with timer and answers
3. **results-screen** - Score summary after quiz completion
4. **catalog-screen** - Browse all questions by category

### Global State Variables (app.js)
```javascript
let questions = [];           // All 310 questions from JSON
let currentMode = null;       // 'practice' | 'exam' | 'single'
let currentQuestions = [];    // Questions for current session
let currentIndex = 0;         // Current question index
let correctCount = 0;         // Correct answers this session
let wrongCount = 0;           // Wrong answers this session
let startTime = null;         // Session start timestamp
let timerInterval = null;     // Timer interval reference
let translationVisible = false; // Translation toggle state
```

### LocalStorage Schema
Key: `lid-progress`
```json
{
  "learned": [1, 2, 5, ...],    // Question IDs answered correctly
  "wrong": [3, 8, ...],         // Question IDs answered incorrectly
  "sessions": 42,                // Total practice sessions
  "streak": 7,                   // Consecutive days practiced
  "lastDate": "Fri Jan 10 2025"  // Last practice date string
}
```

### Question Data Schema (questions.json)
```json
{
  "id": 1,                              // Unique ID (1-310)
  "questionDE": "German text",          // Question in German
  "questionEN": "English translation",  // Question in English
  "answersDE": ["A", "B", "C", "D"],   // 4 German answer options
  "answersEN": ["A", "B", "C", "D"],   // 4 English answer options
  "correctIndex": 0,                    // Index of correct answer (0-3)
  "category": "democracy",              // democracy | history | society
  "isBerlin": false                     // true for Berlin state questions
}
```

## Key Functions

### Initialization
- `loadQuestions()` - Async fetch of questions.json on page load
- `updateStats()` - Refresh home screen statistics from localStorage

### Quiz Flow
- `startPractice()` - Begin 20-question, 15-minute practice session
- `startExam()` - Begin 33-question, 60-minute exam simulation
- `showQuestion()` - Render current question and answers
- `selectAnswer(index)` - Handle answer selection, update progress
- `nextQuestion()` - Advance to next question or results
- `showResults()` - Display final score and update streak

### Navigation
- `showScreen(id)` - Switch between screens
- `goHome()` - Return to home screen
- `endQuiz()` - End current quiz session

### Catalog
- `showCatalog()` - Display question catalog
- `filterCategory(cat)` - Filter by category (all/democracy/history/society/berlin)
- `showSingle(question)` - Practice a single question

### Features
- `setLanguage(lang)` - Toggle between DE/EN display ('de' or 'en')
- `startTimer(seconds)` - Countdown timer for quiz modes
- `resetProgress()` - Clear all saved progress

## Spaced Repetition Logic

In `startPractice()`, questions are prioritized:
1. Previously wrong answers (from `progress.wrong`)
2. Unlearned questions (not in `progress.learned`)
3. Learned questions (fill remaining slots if needed)

Pool is shuffled and limited to 20 questions.

## Styling Notes

### Color Theme (German Flag)
```css
--black: #000;      /* German flag black */
--red: #DD0000;     /* German flag red */
--gold: #FFCC00;    /* German flag gold */
```

### Responsive Design
- Max-width: 600px container
- Mobile-first with touch-friendly buttons
- No horizontal scroll on mobile

## Deployment Instructions

### Step 1: Push to GitHub
```bash
cd ~/leben-in-deutschland
git push -u origin main --force
```
(Force push needed because GitHub repo has a README we want to overwrite)

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Import `enokkim/leben-in-deutschland`
4. Click "Deploy" (vercel.json already configured)

### Step 3: Update README
After deployment, update line 5 of README.md with actual Vercel URL:
```markdown
**[Live Demo](https://leben-in-deutschland-XXXX.vercel.app)**
```

## Testing Checklist
- [ ] Home screen loads with stats
- [ ] Daily Practice starts correctly
- [ ] Exam Simulation starts with timer
- [ ] Language toggle (DE/EN pill) works
- [ ] Progress persists after refresh
- [ ] Catalog filters work
- [ ] Single question mode works
- [ ] Reset progress works

## GitHub Info
- **Username**: enokkim
- **Repo**: leben-in-deutschland
- **Email**: kzenok123@gmail.com
- **Display Name**: Mikkone

## Known Limitations

1. **Offline**: Works offline after first load (browser cache), but not a true PWA
2. **Sync**: Progress is device-local (no cloud sync)
3. **German Characters**: Uses ASCII equivalents (ae for ae) for compatibility
4. **State**: Only Berlin edition currently

## Future Enhancement Ideas

- [ ] PWA with service worker for true offline support
- [ ] Dark mode toggle
- [ ] Export/import progress
- [ ] Multiple state editions selector
- [ ] Audio pronunciation for questions
- [ ] Explanation text for correct answers
- [ ] Statistics graphs over time
- [ ] Share progress on social media

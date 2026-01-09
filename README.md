# Leben in Deutschland - Test Trainer

A mobile-friendly practice app for the German "Leben in Deutschland" (Life in Germany) test, required for permanent residency (Niederlassungserlaubnis) and naturalization in Germany.

**[Live Demo](https://leben-in-deutschland.vercel.app)** (Update with your actual URL)

## Features

- **310 Bilingual Questions** - All official questions in German with English translations
- **Berlin Edition** - Includes 10 state-specific questions for Berlin
- **Tap-to-Reveal Translations** - Learn in German, check with English when needed
- **Three Study Modes**:
  - **Daily Practice** - 15-minute sessions with spaced repetition
  - **Exam Simulation** - 33 questions in 60 minutes (like the real test)
  - **Full Catalog** - Browse and practice individual questions by category
- **Progress Tracking** - Remembers what you've learned across sessions
- **Streak Counter** - Stay motivated with daily practice streaks
- **Mobile-First Design** - Works great on phones, tablets, and desktops
- **Works Offline** - Add to home screen for app-like experience

## About the Test

The "Leben in Deutschland" test is required for:

| Path | Questions | Required Score | Time |
|------|-----------|----------------|------|
| Permanent Residency (Niederlassungserlaubnis) | 33 | 15 correct (45%) | 60 min |
| Citizenship (Einbürgerung) | 33 | 17 correct (52%) | 60 min |

The test covers:
- **Politics & Democracy** - Constitution, government structure, voting
- **History** - German history, reunification, EU
- **Society & Culture** - Rights, responsibilities, daily life
- **State Questions** - 10 questions specific to your Bundesland

## Quick Start

### For Users

Simply open the app in your browser and start practicing:
1. Choose a study mode
2. Answer questions in German
3. Tap "EN" to reveal English translation if needed
4. Track your progress over time

**Pro tip**: On mobile, add to home screen for full-screen experience.

### For Developers

```bash
# Clone the repository
git clone https://github.com/enokkim/leben-in-deutschland.git
cd leben-in-deutschland

# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## Project Structure

```
leben-in-deutschland/
├── index.html        # Main HTML structure
├── styles.css        # All CSS styles
├── app.js            # Application logic
├── questions.json    # 310 questions data
├── README.md         # This file
└── CLAUDE.md         # AI context for development
```

## Tech Stack

- **Pure HTML/CSS/JavaScript** - No frameworks, no build step
- **LocalStorage** - Progress persists across sessions
- **Responsive CSS** - German flag gradient theme
- **ES6+** - Modern JavaScript with async/await

## Deployment

This app is static and can be deployed anywhere:

### Vercel (Recommended)
1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Deploy with one click

### GitHub Pages
1. Go to repository Settings > Pages
2. Select source branch (main)
3. Site will be at `username.github.io/leben-in-deutschland`

### Netlify
1. Connect GitHub repository
2. No build command needed
3. Publish directory: `/`

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Test locally with `python3 -m http.server`
5. Commit with clear messages
6. Push and create a Pull Request

### Adding/Updating Questions

Questions are in `questions.json`. Each question follows this structure:

```json
{
  "id": 1,
  "questionDE": "German question text",
  "questionEN": "English translation",
  "answersDE": ["Option A", "Option B", "Option C", "Option D"],
  "answersEN": ["Option A EN", "Option B EN", "Option C EN", "Option D EN"],
  "correctIndex": 0,
  "category": "democracy",
  "isBerlin": false
}
```

Categories: `democracy`, `history`, `society`

## Data Sources

Questions are based on the official BAMF (Bundesamt für Migration und Flüchtlinge) question catalog:

- [Official BAMF Test Information](https://www.bamf.de/DE/Themen/Integration/ZusijdtAngebote/EinbijrgerungTest/einbiirgerungstest-node.html)
- [Practice Test Portal](https://www.einbuergerungstest-online.eu/)

**Disclaimer**: This is an unofficial practice tool. Always verify with official sources.

## License

MIT License - Feel free to use, modify, and distribute.

## Acknowledgments

- BAMF for providing the official question catalog
- Built for the German immigration community
- Created with assistance from Claude AI

---

**Good luck with your test!** Viel Erfolg bei deinem Test!

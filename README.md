# IELTS Practice

A personal IELTS practice app: exam-style Listening and Reading tests, timed Writing with AI marking, Speaking with an AI examiner, progress tracking, and an importer for tests from material you own.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Everything is stored in your browser (localStorage, plus IndexedDB for audio and recordings). Use **Settings → Export backup** to move data between devices.

## Features

- **Dashboard**: target band, per-skill average, best and accuracy, an estimated overall band, a progress chart with a target line, and a result history by skill.
- **Listening and Reading test screen**:
  - Practice mode or Simulation mode (in simulation, the audio plays once and the test auto-submits).
  - Countdown timer and split-screen reading with a resizable divider.
  - Highlight or add a note to passage text, plus a notepad.
  - Flag questions, use the question navigator, and change text size or theme.
- **Question types**: gap fill, multiple choice (one or several answers), TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, and matching (headings, paragraphs, features).
- **Results**: raw score to band conversion and time spent. Review mode shows your answer against the correct one, with **Explain** and **Locate**. Locate highlights the evidence in the passage or transcript.
- **Writing**:
  - Academic or General Training, with both tasks under a 60-minute timer and a live word count.
  - Task 1 charts are rendered from data.
  - AI examiner report per criterion: band, strengths, improvements and a band-8 model answer.
- **Speaking**:
  - Full test or a single part, with an examiner voice (text-to-speech), a mic test and a Part 2 cue card with 1 minute of preparation.
  - Answers are recorded and transcribed live (Chrome or Edge), then marked by AI on the four criteria.
- **AI tutor** chat, a **band calculator**, and **Import**. Import takes JSON, or pasted text that AI converts to the format, and lets you upload audio files for listening parts.

## AI features

AI marking, the tutor and the converter call Claude (`claude-opus-5-5`) directly from the browser with **your own Anthropic API key**, entered in Settings. The key is kept only in your browser's localStorage. This setup is meant for personal use on your own device. Don't deploy it publicly with a shared key.

## Test format

See `src/types.ts`, or press **Load template** on the Import page. A reading or listening test is a list of sections (passage or transcript, optional audio), each with question groups. Every question has `answer` (the accepted variants) and can have an `explanation` and an `evidence` quote, which powers Locate.

The starter tests in `src/data/` are original material written for this app.

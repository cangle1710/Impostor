# Impostor — Free Online Party Game

A free, browser-based multiplayer party game inspired by social deduction games like Spyfall. No accounts, no downloads — just share a 4-digit code and play!

## How to Play

### Setup
1. One player creates a private room and gets a **4-digit code**
2. Share the code with friends — they enter it to join
3. The host configures settings and hits **Start Game**

### Role Reveal
Each player takes turns privately viewing their role on the device:
- **Crewmates** see the secret word (or question)
- **Impostors** don't know the word — they must bluff their way through

### Discussion
Players take turns asking each other questions about the secret word. Try to sound like you know it without giving it away too obviously. Impostors listen carefully and try to piece together the word from the clues.

### Voting
Everyone votes simultaneously for who they think is the impostor. The player with the most votes is eliminated and their role is revealed.

### Win Conditions
- **Crewmates win** — if the eliminated player is an impostor
- **Impostors win** — if an innocent crewmate is eliminated, or if there's a tie
- **Impostor instant win** — during discussion, an impostor can guess the secret word. Correct = instant win. Wrong = instant reveal!

---

## Game Modes

| Mode | Description |
|---|---|
| **Word Game** | Everyone gets the same secret word except the impostors, who get nothing |
| **Question Game** | Everyone gets the same question except the impostors, who get a slightly different one |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Impostors | 1 | How many players are impostors (scales with group size) |
| Game Mode | Word Game | Word Game or Question Game |
| Category | All Categories | Pick a specific word/question category |
| Show Category to Impostor | Off | Gives the impostor a small hint |
| Show Hint to Impostor | Off | Gives the impostor a descriptive hint for the word |
| Impostors Know Each Other | On | Multi-impostor games: impostors see each other's names |
| Allow Impostor Word Guess | On | Impostors can attempt to guess the word mid-discussion |
| Discussion Time | 3 min | How long the discussion phase lasts |

### Recommended Group Sizes

| Players | Impostors |
|---|---|
| 3–4 | 1 |
| 5–8 | 1–2 |
| 9+ | 2 |

---

## Word Categories

- Places
- Food & Drink
- Sports
- Movies & TV
- Nature
- Jobs & Professions
- Animals
- Technology
- Hobbies
- School Subjects

---

## Running Locally

### Requirements
- [Node.js](https://nodejs.org/) v18+

### Install & Start
```bash
# Install dependencies
npm run install:all

# Start both server and client
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **State**: In-memory (no database required)
- **Real-time**: WebSockets via Socket.IO

---

## Tips

**For Crewmates:**
- Give clues specific enough that other crewmates recognize the word, but vague enough that an impostor couldn't guess it
- Watch for players who are too vague, too general, or reacting strangely to others' clues

**For Impostors:**
- Listen carefully to the first few clues before speaking — they'll tell you the theme
- Give answers that sound plausible for a category rather than a specific word
- Avoid going first if possible — you'll have less information
- If you think you've figured out the word, the guess mechanic is your path to a secret victory!

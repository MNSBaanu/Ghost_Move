# ⚡ PocketDev

AI-powered mobile coding assistant that runs from a pen drive.
View your code and chat with AI from your phone — while your project stays on the PC.

---

## How it works

```
Pen Drive (campus PC)          Your Phone
┌─────────────────────┐        ┌──────────────────┐
│  Node.js server     │◄──────►│  Browser UI      │
│  - Serves files     │  USB   │  - File browser  │
│  - Groq AI proxy    │  tether│  - Code viewer   │
│  - File watcher     │        │  - AI chat       │
└─────────────────────┘        └──────────────────┘
```

1. Plug pen drive into campus PC
2. Run `start.bat` (Windows) or `./start.sh` (Mac/Linux)
3. Enable **USB Tethering** on your phone
4. Scan the QR code shown in the terminal
5. Start vibe-coding from your phone

---

## Setup (one time)

### 1. Get a free Groq API key
- Go to [console.groq.com](https://console.groq.com)
- Sign up (free, no credit card)
- Create an API key

### 2. Configure your .env file
Copy `.env.example` to `.env` and fill in:
```
GROQ_API_KEY=your_key_here
PROJECT_DIR=C:\path\to\your\project
```

Leave `PROJECT_DIR` empty to browse the PocketDev folder itself.

### 3. Run
- **Windows**: Double-click `start.bat`
- **Mac/Linux**: Run `./start.sh` in terminal

---

## USB Tethering setup

**Android:**
Settings → Network → Hotspot & Tethering → USB Tethering → ON

**iPhone:**
Settings → Personal Hotspot → Allow Others to Join → ON, connect via USB

After enabling, the campus PC gets a local IP your phone can reach.
The terminal shows the exact URL and QR code to scan.

---

## Usage

| Tab | What it does |
|-----|-------------|
| 📁 Files | Browse and open project files |
| 📄 Code | View current file with live sync |
| 🤖 AI Chat | Chat with Groq AI about your code |

- Open a file → switch to Code tab → it stays in sync as you save on PC
- Switch to AI Chat → ask anything → tap **✅ Apply** to write changes to the file
- Make manual edits directly on the PC anytime

---

## Requirements

- Node.js installed on the campus PC ([nodejs.org](https://nodejs.org))
- A free Groq API key
- USB cable + tethering enabled on phone

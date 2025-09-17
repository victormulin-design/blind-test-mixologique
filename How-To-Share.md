# How to Create, Share, and Run Your Quiz Night App

This guide will show you how to create your own game packages (especially with audio/images), share them, and run the app for friends.

---

## Creating Your Own Game Package (with Media)

While you can create a game with just a `.json` file, the best way to include audio or images is by creating a `.zip` package. This keeps your files organized and avoids errors.

**Step 1: Create Your Folder Structure**
- Create a main folder for your game (e.g., `my-epic-quiz`).
- Inside it, create your `config.json` file (you can export one from the app as a template).
- Also inside, create an `audio` folder and an `images` folder.

Your structure should look like this:
```
my-epic-quiz/
├── config.json
├── audio/
│   └── song1.mp3
│   └── sound_effect.wav
└── images/
    └── landmark.jpg
    └── movie_poster.png
```

**Step 2: Edit Your `config.json`**
- For any question or prize that needs media, **do not embed the file**. Instead, reference the filename.
- The app will automatically look for the file in the `audio` or `images` folder inside the zip.

**Example `config.json` entry for an audio question:**
```json
{
  "questionText": "Name this symphony!",
  "answer": "Beethoven's 5th",
  "type": "AUDIO",
  "audioFileName": "song1.mp3" 
}
```

**Example `config.json` entry for an image question:**
```json
{
  "questionText": "What is this landmark?",
  "answer": "The Colosseum",
  "type": "IMAGE",
  "imageFileName": "landmark.jpg"
}
```

**Step 3: Create the ZIP File**
- Once your `config.json` and media files are all in place, compress the main folder (`my-epic-quiz`) into a single `.zip` file.
- You can now load this `.zip` file directly into the app, and all your media will work perfectly!

---

## Method 1: The Easiest Way to Share (Recommended for Beta Testers)

We'll use a free service called **Netlify Drop**. You don't even need to sign up!

**Step 1: Get Your Project Files**
- Make sure you have all the files for your application (`index.html`, `index.tsx`, `App.tsx`, `components/`, etc.) saved together in a single folder on your computer. Let's call this folder `blind-test-app`.
- **Crucially**, make sure you also have the `Preconfigured_games` folder inside your `blind-test-app` folder. **If this folder is missing from the upload, the pre-configured games will not appear in the app.** It's needed to load the "Soirée '50 ans'" preset and others.

**Step 2: Open Netlify Drop**
- In your web browser, go to: [https://app.netlify.com/drop](https://app.netlify.com/drop)

**Step 3: Drag and Drop Your Folder**
- Drag your entire `blind-test-app` folder from your computer and drop it onto the area shown on the Netlify Drop webpage.

**Step 4: Share the Link!**
- That's it! Netlify will upload your files and give you a unique, public URL (like `https://random-words-12345.netlify.app`).
- You can copy this link and send it to your friends. Anyone with the link can use your app. The link is temporary but perfect for testing.

---

## Method 2: For Testing on Your Own Computer

Your browser has security rules that prevent `index.html` from loading other files when you just double-click it. To get around this, you need a simple local web server.

### Option A: If you have Python installed (most Macs and many PCs do)

1.  **Open a Terminal or Command Prompt:**
    - On Mac, open the "Terminal" app.
    - On Windows, open "Command Prompt" or "PowerShell".
2.  **Navigate to your project folder:**
    - Use the `cd` (change directory) command. For example: `cd C:\Users\YourName\Documents\blind-test-app`
3.  **Start the server:**
    - Run this simple command: `python -m http.server`
4.  **Open in your browser:**
    - The terminal will show a message like `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...`
    - Open your Chrome browser and go to the address: `http://localhost:8000`
    - Your app will now run correctly!

### Option B: Using the Live Server extension in VS Code

If you use the code editor Visual Studio Code, this is the easiest option.

1.  **Install the "Live Server" extension** from the Extensions marketplace in VS Code.
2.  **Open your `blind-test-app` folder** in VS Code.
3.  In the bottom-right corner of the window, you will see a **"Go Live"** button. Click it.
4.  A new browser tab will automatically open with your app running correctly.
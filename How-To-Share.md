# How to Share and Run Your Blind Test App

This guide will show you two simple ways to run your application outside of the development environment so you can share it with friends for beta testing.

---

## Method 1: The Easiest Way to Share (Recommended for Beta Testers)

We'll use a free service called **Netlify Drop**. You don't even need to sign up!

**Step 1: Get Your Project Files**
- Make sure you have all the files for your application (`index.html`, `index.tsx`, `App.tsx`, `components/`, etc.) saved together in a single folder on your computer. Let's call this folder `blind-test-app`.
- **Crucially**, make sure you also have the `Preconfigured_games` folder inside your `blind-test-app` folder, as it's needed to load the "Soirée '50 ans'" preset.

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

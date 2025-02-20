const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

let mainWindow;
let backendProcess;
const BACKEND_URL = "http://127.0.0.1:8000"; // FastAPI Backend URL
const PROJECT_DIR = path.join(__dirname, "../backend/generated-projects/ReactApp");

// ✅ Create Electron Window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile("index.html");

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    console.log("✅ Electron window loaded.");
}

// ✅ Start Backend (FastAPI)
function startBackend() {
    try {
        const backendDir = path.join(__dirname, "../backend");
        const pythonPath = "python"; // Change to "python3" for macOS/Linux

        console.log("🚀 Starting FastAPI Backend at:", backendDir);

        backendProcess = spawn(
            pythonPath,
            ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
            {
                cwd: backendDir,
                stdio: "inherit",
            }
        );

        backendProcess.on("error", (err) => {
            console.error("❌ Backend Error:", err);
        });

        backendProcess.on("exit", (code, signal) => {
            console.error(`⚠️ Backend process exited with code ${code} and signal ${signal}`);
        });

        return backendProcess;
    } catch (error) {
        console.error("❌ Failed to start backend:", error);
        return null;
    }
}

// ✅ Ensure React Project Exists (Prevents recreation)
function ensureReactProject() {
    if (!fs.existsSync(PROJECT_DIR)) {
        console.log("🛠️ Creating React project directory...");
        fs.mkdirSync(PROJECT_DIR, { recursive: true });

        console.log("⚡ Initializing React project...");
        exec("npx create-react-app .", { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Failed to create React project:", error);
            } else {
                console.log("✅ React project initialized.");
                checkAndFixProjectStructure();
            }
        });
    } else {
        console.log("✅ React project already exists.");
        checkAndFixProjectStructure();
    }
}

// ✅ Ensure Required Files Exist (For React to Run)
function checkAndFixProjectStructure() {
    console.log("🔎 Checking project structure...");

    const requiredFiles = {
        "src/index.js": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,

        "src/App.js": `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
            </Routes>
        </Router>
    );
}

export default App;`,

        "package.json": `{
            "name": "react-app",
            "version": "1.0.0",
            "private": true,
            "dependencies": {
                "react": "^19.0.0",
                "react-dom": "^19.0.0",
                "react-router-dom": "^7.1.5",
                "framer-motion": "^10.16.2",
                "react-scripts": "^5.0.1"
            },
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            }
        }`
    };

    Object.keys(requiredFiles).forEach(file => {
        const filePath = path.join(PROJECT_DIR, file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, requiredFiles[file]);
        }
    });

    installDependencies();
}

// ✅ Install Dependencies (Run Only If Needed)
function installDependencies() {
    console.log("📦 Checking dependencies...");
    if (!fs.existsSync(path.join(PROJECT_DIR, "node_modules"))) {
        console.log("⚡ Running npm install...");
        exec("npm install --legacy-peer-deps", { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ npm install failed:", error);
            } else {
                console.log("✅ Dependencies installed successfully.");
                startReactApp();
            }
        });
    } else {
        console.log("✅ Dependencies already installed.");
        startReactApp();
    }
}

// ✅ Start React App
function startReactApp() {
    console.log("🚀 Starting React App...");
    exec("npm start", { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Failed to start React app:", error);
        } else {
            console.log("✅ React app is running!");
        }
    });
}

// ✅ Generate AI Code & Save Files
ipcMain.handle("generate-code", async (event, userStory) => {
    try {
        if (!userStory || userStory.trim() === "") {
            throw new Error("User story cannot be empty.");
        }

        console.log("🔹 Sending request to AI model for:", userStory);

        const response = await fetch(`${BACKEND_URL}/generate-code/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: userStory }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Code generation successful!");
            return { success: true, message: "✅ Code generated successfully!" };
        } else {
            throw new Error(data.detail || "Failed to generate code.");
        }
    } catch (error) {
        console.error("❌ Error during code generation:", error.message);
        return { error: `❌ AI request failed: ${error.message}` };
    }
});

// ✅ Open React App in Browser
ipcMain.on("open-react-app", async () => {
    try {
        console.log("🔹 Opening React app in browser...");
        shell.openExternal("http://localhost:3000");
    } catch (error) {
        console.error("❌ Failed to open React app:", error);
    }
});

// ✅ Start Electron & Backend
app.whenReady().then(() => {
    startBackend();
    ensureReactProject();
    createWindow();
});

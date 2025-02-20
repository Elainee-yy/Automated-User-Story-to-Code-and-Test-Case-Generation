const { ipcRenderer } = require('electron');

document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById('generate-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const progressBar = document.getElementById("progress-bar");
    const previewBtn = document.getElementById('preview-btn');
    const vscodeBtn = document.getElementById('vscode-btn');

    // Ensure buttons exist before adding event listeners
    if (!generateBtn || !regenerateBtn || !progressBar || !previewBtn || !vscodeBtn) {
        console.error("❌ Missing required DOM elements. Check your HTML.");
        return;
    }

    // Handle "Generate Code" Button Click
    generateBtn.addEventListener('click', async () => {
        const userStory = document.getElementById('user-story').value;
        if (!userStory.trim()) {
            alert("❌ Please enter a user story.");
            return;
        }

        // Update UI progress
        progressBar.innerText = "⏳ Generating...";
        generateBtn.disabled = true;
        regenerateBtn.disabled = true;
        previewBtn.disabled = true;
        vscodeBtn.disabled = true;

        try {
            const response = await ipcRenderer.invoke('generate-code', userStory);
            if (response.error) {
                throw new Error(response.error);
            }

            progressBar.innerText = "✅ Code generated! React app is running...";
            previewBtn.disabled = false;
            vscodeBtn.disabled = false;
        } catch (error) {
            progressBar.innerText = "❌ Error: " + error.message;
        } finally {
            generateBtn.disabled = false;
            regenerateBtn.disabled = false;
        }
    });

    // Handle "Regenerate" Button Click
    regenerateBtn.addEventListener('click', async () => {
        const userStory = document.getElementById('user-story').value;
        if (!userStory.trim()) {
            alert("❌ Please enter a user story.");
            return;
        }

        progressBar.innerText = "🔄 Regenerating...";
        generateBtn.disabled = true;
        regenerateBtn.disabled = true;
        previewBtn.disabled = true;
        vscodeBtn.disabled = true;

        try {
            const response = await ipcRenderer.invoke('generate-code', userStory);
            if (response.error) {
                throw new Error(response.error);
            }

            progressBar.innerText = "✅ Code regenerated! React app is restarting...";
            previewBtn.disabled = false;
            vscodeBtn.disabled = false;
        } catch (error) {
            progressBar.innerText = "❌ Error: " + error.message;
        } finally {
            generateBtn.disabled = false;
            regenerateBtn.disabled = false;
        }
    });

    // Handle "Preview UI" Button Click
    previewBtn.addEventListener('click', () => {
        ipcRenderer.send('open-react-app');
    });

    // Handle "Open in VS Code" Button Click
    vscodeBtn.addEventListener('click', async () => {
        try {
            const response = await ipcRenderer.invoke('open-in-vscode');
            alert(response.success || response.error);
        } catch (error) {
            alert("❌ Error opening VS Code: " + error.message);
        }
    });
});

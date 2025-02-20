import os
import logging
import json
import subprocess
import requests
import re
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ✅ Setup Logging (`backend.log`)
LOG_FILE = "backend.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logging.info("🚀 FastAPI Backend Started")

# ✅ Define FastAPI App
app = FastAPI()

# ✅ Project Directory
BASE_DIR = os.path.dirname(__file__)
PROJECT_DIR = os.path.join(BASE_DIR, "generated-projects", "ReactApp")
PACKAGE_JSON_PATH = os.path.join(PROJECT_DIR, "package.json")


# ✅ API Request Model
class UserStoryRequest(BaseModel):
    text: str


# ✅ Check if Node.js and npm are installed
def check_npm():
    """Check if npm is installed and accessible."""
    try:
        subprocess.run(["npm", "--version"], check=True, capture_output=True, text=True)
        return True
    except FileNotFoundError:
        logging.error("❌ npm not found. Install Node.js and add it to PATH.")
        return False


# ✅ **Fix AI Response Parsing**
def parse_ai_response(response_text: str) -> dict:
    """Extract valid JSON from AI response, handling extra text."""
    try:
        response_text = response_text.strip()

        # ✅ **Fix AI JSON Output Formatting**
        response_text = response_text.replace("```json", "").replace("```", "").strip()

        # ✅ **Ensure JSON starts with '{'**
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON found in AI response.")

        json_text = json_match.group(0).strip()

        # ✅ Log Cleaned JSON Before Parsing
        logging.info(f"🔍 Cleaned AI JSON Response: {json_text[:500]}...")

        # ✅ **Parse JSON safely**
        parsed_data = json.loads(json_text)

        if "files" not in parsed_data:
            raise ValueError("Invalid AI response format: Missing 'files' key.")

        return parsed_data["files"]

    except json.JSONDecodeError as e:
        logging.error(f"❌ AI Response JSON Error: {str(e)}")
        logging.error(f"🔴 Raw AI Response: {response_text[:500]}...")
        raise HTTPException(status_code=500, detail="Invalid JSON from AI.")


# ✅ **Send User Story to AI & Handle Response**
def generate_code_from_ai(user_story: str):
    """Send user story to AI and get structured JSON response for React code."""
    try:
        logging.info(f"🔍 Sending User Story to AI: {user_story}")

        prompt = f"""
        **INSTRUCTIONS FOR AI MODEL:**
        - Return JSON ONLY, do NOT include any explanations.
        - Do NOT include markdown like ```json.
        - Ensure the JSON includes all required React files.

        **User Story:**
        {user_story}

        **Expected JSON Output:**
        {{
            "files": {{
                "src/App.js": "... React App.js code ...",
                "src/index.js": "... ReactDOM code ...",
                "src/components/Dashboard.js": "... Dashboard component ...",
                "src/components/Dashboard.css": "... Dashboard styles ...",
                "src/components/Navbar.js": "... Navigation bar ...",
                "src/components/Navbar.css": "... Navbar styles ...",
                "src/utils/auth.js": "... Logout handling ...",
                "package.json": "... dependencies ...",
                "public/index.html": "... main HTML file ..."
            }}
        }}
        """

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "deepseek-coder-v2:16b", "prompt": prompt},
        )

        if response.status_code != 200:
            logging.error(f"❌ AI Model Error: {response.status_code}")
            raise HTTPException(status_code=500, detail="AI failed to generate code.")

        # ✅ Log Raw AI Response
        raw_ai_response = response.text.strip()
        logging.info(f"✅ AI Raw Response: {raw_ai_response[:500]}...")

        # ✅ Parse AI Response
        return parse_ai_response(raw_ai_response)

    except Exception as e:
        logging.error(f"❌ AI Processing Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process user story.")


# ✅ **Ensure Required Files Exist**
def save_generated_files(files: dict):
    """Save AI-generated React files and auto-create missing ones."""
    try:
        logging.info("📂 Saving AI-generated files...")

        # ✅ Save AI-generated files
        for filepath, content in files.items():
            full_path = os.path.join(PROJECT_DIR, filepath)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            logging.info(f"✅ File Saved: {full_path}")

    except Exception as e:
        logging.error(f"❌ Error Writing Files: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save AI-generated files.")


# ✅ **Ensure package.json is valid**
def ensure_package_json():
    """Ensure package.json exists and add missing dependencies."""
    try:
        os.makedirs(PROJECT_DIR, exist_ok=True)

        if not os.path.exists(PACKAGE_JSON_PATH):
            logging.warning("⚠️ package.json not found. Creating a new one.")
            package_json = {
                "name": "react-app",
                "version": "1.0.0",
                "private": True,
                "dependencies": {},
                "scripts": {
                    "start": "react-scripts start",
                    "build": "react-scripts build",
                    "test": "react-scripts test",
                    "eject": "react-scripts eject"
                }
            }
            with open(PACKAGE_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(package_json, f, indent=2)

        install_dependencies()

    except Exception as e:
        logging.error(f"❌ Failed to update package.json: {str(e)}")


# ✅ **Install Dependencies**
def install_dependencies():
    """Run npm install to set up project dependencies."""
    if not check_npm():
        raise HTTPException(status_code=500, detail="npm not found. Install Node.js and add it to PATH.")

    try:
        logging.info("📦 Installing dependencies...")
        subprocess.run(["npm", "install"], cwd=PROJECT_DIR, check=True)
        logging.info("✅ Dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        logging.error(f"❌ Dependency installation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to install dependencies.")


# ✅ **Start React App**
def start_react_app():
    """Run npm start to launch the React app."""
    if not check_npm():
        raise HTTPException(status_code=500, detail="npm not found. Install Node.js and add it to PATH.")

    try:
        logging.info("🚀 Starting React App...")
        subprocess.Popen(["npm", "start"], cwd=PROJECT_DIR)
    except Exception as e:
        logging.error(f"❌ Failed to start React app: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start React app.")


# ✅ **FastAPI Endpoint: Generate Full React Project**
@app.post("/generate-code/")
def generate_code(user_story_request: UserStoryRequest):
    """Generate React code dynamically from user story."""
    try:
        logging.info(f"🔍 User Story Received: {user_story_request.text}")

        # ✅ Get AI-generated React code
        generated_files = generate_code_from_ai(user_story_request.text)

        # ✅ Save AI-generated code
        save_generated_files(generated_files)

        return {"success": True, "message": "✅ React project generated successfully!"}

    except Exception as e:
        logging.error(f"❌ Error in Code Generation: {str(e)}")
        return {"error": str(e)}


# ✅ **Start FastAPI Server**
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

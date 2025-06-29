# SED Tracker Application (Python Backend + Frontend)

This application helps monitor work/vacation/travel days for HMRC Seafarers’ Earnings Deduction (SED) compliance. This version uses a Python Flask backend for data persistence and API, and a vanilla JavaScript frontend.

## Features (Frontend)

*   Calendar interface for viewing and managing entries.
*   Modal for adding/editing entries (Work Ship, Work Land, Vacation, Travel).
*   Dashboard summary of total days by category, ship, and country.
*   Filtering of entries by date range, category, and keyword.
*   Simplified SED compliance analysis based on user-defined claim periods.
*   Data export to CSV.

## Backend API

*   Provides CRUD operations for entries.
*   Uses SQLite for data storage.
*   Serves the frontend application.

## Setup and Running the Application

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>/sed_tracker_backend
    ```
    (Replace `<repository_url>` and `<repository_name>` with the actual URL and cloned directory name)

2.  **Create and Activate a Python Virtual Environment:**
    It's highly recommended to use a virtual environment.
    ```bash
    python3 -m venv .venv
    ```
    Activate the environment:
    *   On macOS/Linux:
        ```bash
        source .venv/bin/activate
        ```
    *   On Windows:
        ```bash
        .venv\Scripts\activate
        ```

3.  **Install Dependencies:**
    With the virtual environment activated, install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Application:**
    Execute the `run.py` script:
    ```bash
    python run.py
    ```
    This will start the Flask development server. It will:
    *   Initialize the SQLite database (`instance/sed_tracker.db`) and create tables if they don't exist.
    *   Serve the application (frontend and backend API).

5.  **Access in Browser:**
    Open your web browser and navigate to:
    [http://127.0.0.1:5001](http://127.0.0.1:5001)

    If you ran with `host='0.0.0.0'` (as `run.py` does), you can also access it from other devices on your network using your machine's local IP address, e.g., `http://<your_machine_ip>:5001`. Make sure your firewall allows connections to port 5001.

## Project Structure within `sed_tracker_backend/`

*   `app.py`: Main Flask application file (routes, API logic, serves frontend).
*   `models.py`: SQLAlchemy database models.
*   `run.py`: Script to start the application.
*   `requirements.txt`: Python dependencies.
*   `instance/`: This folder is created by Flask to store instance-specific files, like the `sed_tracker.db` SQLite database. It is gitignored.

## Frontend File Locations

**Important:** Due to issues with automated file manipulation during development, the frontend files (`index.html`, `style.css`, `app.js`) remain in their original locations at the **root of the project**:
*   `public/index.html`
*   `public/style.css`
*   `src/app.js`

The Flask application (`sed_tracker_backend/app.py`) is configured to serve these files from their respective root-level directories. The setup and run instructions above are correct and will serve the application as intended.

---

## Idiot's Guide: Running on a Debian Linux LXC Container

This guide assumes you have a fresh Debian LXC container and are logged into it as a non-root user with `sudo` privileges (or as root).

**Step 1: Update Package Lists**

First, make sure your package lists are up to date:
```bash
sudo apt update
```

**Step 2: Install Git**

If Git is not already installed (it might be on some LXC templates):
```bash
sudo apt install -y git
```

**Step 3: Install Python 3, Pip, and Python 3 Venv**

Python 3 is usually present, but ensure `pip` (Python's package installer) and `venv` (for virtual environments) are installed for Python 3:
```bash
sudo apt install -y python3 python3-pip python3-venv
```

**Step 4: Clone the Repository**

Choose a directory where you want to clone the project (e.g., your home directory).
```bash
# Example: Cloning into a 'projects' directory in your home folder
mkdir -p ~/projects
cd ~/projects

git clone <repository_url>
# Replace <repository_url> with the actual URL of this project's repository.
# Example: git clone https://github.com/yourusername/yourproject.git

cd <repository_name> # Replace <repository_name> with the directory name created by git clone
```

**Step 5: Navigate to the Backend Directory**

All subsequent commands will be run from within the `sed_tracker_backend` directory of the cloned project.
```bash
cd sed_tracker_backend
```

**Step 6: Create and Activate Python Virtual Environment**

This creates an isolated environment for the project's Python packages.
```bash
python3 -m venv .venv
```
Activate it:
```bash
source .venv/bin/activate
```
You should see `(.venv)` at the beginning of your command prompt, indicating the virtual environment is active.

**Step 7: Install Python Dependencies**

Install the packages listed in `requirements.txt` into your active virtual environment:
```bash
pip install -r requirements.txt
```

**Step 8: Run the Application**

Now, run the application using the `run.py` script:
```bash
python run.py
```
The output should indicate the server is running, typically like this:
`* Running on http://0.0.0.0:5001/`
`* Running on http://127.0.0.1:5001/` (Press CTRL+C to quit)

The database file `instance/sed_tracker.db` will be created automatically if it doesn't exist.

**Step 9: Accessing the Application**

*   **From within the LXC container (if it has a desktop environment and browser):**
    Open a web browser and go to `http://127.0.0.1:5001` or `http://localhost:5001`.

*   **From your Host Machine (or other devices on your network):**
    1.  **Find the LXC container's IP address.** Inside the LXC, run:
        ```bash
        ip addr show
        ```
        Look for an `inet` address associated with an interface like `eth0` (it will likely be a private IP, e.g., `10.x.x.x` or `192.168.x.x`).
    2.  **Open a web browser on your host machine** (or another device on the same network as the LXC) and navigate to `http://<LXC_IP_ADDRESS>:5001`.
        Replace `<LXC_IP_ADDRESS>` with the actual IP you found.

**Troubleshooting LXC Network Access:**
*   **LXC Networking:** Ensure your LXC container's network is configured correctly to be reachable from your host/network (e.g., bridged mode or appropriate port forwarding if using NAT). This depends on your LXC host setup (LXD, Proxmox, etc.).
*   **Host Firewall:** If you have a firewall running on your *host* machine (the machine running the LXC), it might block access to the LXC's IP and port.
*   **LXC Firewall:** The Debian LXC itself might have a firewall (though less common by default on minimal images). `sudo ufw status` (if `ufw` is installed) could check this. If needed, allow port 5001: `sudo ufw allow 5001/tcp`.

**To Stop the Application:**
Go back to the terminal where `python run.py` is running and press `CTRL+C`.

**To Deactivate the Virtual Environment (when done):**
Simply type:
```bash
deactivate
```

```

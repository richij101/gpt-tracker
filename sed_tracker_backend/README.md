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

```

from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Entry
import uuid # For generating unique IDs

app = Flask(__name__)
CORS(app) # Enable CORS for all routes and origins by default for development

# Configure the SQLAlchemy part of the app instance
# The SQLite database will be created in the instance folder.
# The instance folder is automatically created by Flask if it doesn't exist
# and is a good place for config files, SQLite dbs, etc., that are specific
# to this instance of the application and shouldn't be versioned (already in .gitignore).
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sed_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy with the Flask app
db.init_app(app)

# Command to create database tables
# This can be run via `flask shell` then `db.create_all()` or a custom CLI command
@app.cli.command('init-db')
def init_db_command():
    """Creates the database tables."""
    with app.app_context(): # Ensure we are in application context
        db.create_all()
    print('Initialized the database.')

def create_tables_if_not_exist(app_instance):
    """Checks if DB exists and creates tables if not."""
    import os
    # Correct path for instance folder db
    db_path = os.path.join(app_instance.instance_path, 'sed_tracker.db')

    # Ensure instance path exists
    if not os.path.exists(app_instance.instance_path):
        os.makedirs(app_instance.instance_path)
        print(f"Created instance folder at {app_instance.instance_path}")

    first_run = not os.path.exists(db_path)

    with app_instance.app_context():
        # db.drop_all() # Uncomment for easy reset during dev
        db.create_all()
        if first_run:
            print(f"Database sed_tracker.db created at {db_path} and tables initialized.")
        else:
            print("Database already exists. Tables ensured.")


@app.route('/')
def hello():
    return "Hello from SED Tracker Backend!"

# --- API Endpoints for Entries ---

@app.route('/api/entries', methods=['POST'])
def create_entry():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input, no data provided"}), 400

    # Basic validation (can be expanded)
    required_fields = ['date', 'category', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    new_id = str(uuid.uuid4()) # Generate a new UUID for the entry

    new_entry = Entry(
        id=new_id,
        date=data['date'],
        category=data['category'],
        status=data['status'],
        ship_name=data.get('shipName'), # Use .get for optional fields
        country=data.get('country'),
        notes=data.get('notes')
    )
    try:
        db.session.add(new_entry)
        db.session.commit()
        return jsonify(new_entry.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create entry", "details": str(e)}), 500

@app.route('/api/entries', methods=['GET'])
def get_all_entries():
    try:
        entries = Entry.query.all()
        return jsonify([entry.to_dict() for entry in entries]), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve entries", "details": str(e)}), 500

@app.route('/api/entries/<string:entry_id>', methods=['GET'])
def get_entry(entry_id):
    try:
        entry = Entry.query.get(entry_id)
        if entry:
            return jsonify(entry.to_dict()), 200
        else:
            return jsonify({"error": "Entry not found"}), 404
    except Exception as e:
        return jsonify({"error": "Failed to retrieve entry", "details": str(e)}), 500

@app.route('/api/entries/<string:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input, no data provided"}), 400

    try:
        entry = Entry.query.get(entry_id)
        if not entry:
            return jsonify({"error": "Entry not found"}), 404

        # Update fields if they are provided in the request
        entry.date = data.get('date', entry.date)
        entry.category = data.get('category', entry.category)
        entry.status = data.get('status', entry.status)
        entry.ship_name = data.get('shipName', entry.ship_name)
        entry.country = data.get('country', entry.country)
        entry.notes = data.get('notes', entry.notes)

        db.session.commit()
        return jsonify(entry.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update entry", "details": str(e)}), 500

@app.route('/api/entries/<string:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    try:
        entry = Entry.query.get(entry_id)
        if not entry:
            return jsonify({"error": "Entry not found"}), 404

        db.session.delete(entry)
        db.session.commit()
        return jsonify({"message": "Entry deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete entry", "details": str(e)}), 500


if __name__ == '__main__':
    create_tables_if_not_exist(app)
    app.run(debug=True, port=5001) # Running on a different port, e.g. 5001
                                   # to avoid conflict if frontend is on 5000 (common for http.server)

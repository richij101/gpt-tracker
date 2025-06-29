from app import app, create_tables_if_not_exist # Import the Flask app instance and db init function

if __name__ == '__main__':
    # Ensure database and tables are created before starting the app
    create_tables_if_not_exist(app)

    # Run the Flask app
    # Host '0.0.0.0' makes it accessible on the network
    # Port 5001 is what we've configured
    # Debug should ideally be False for anything resembling production,
    # but True is fine for development and ease of use here.
    app.run(host='0.0.0.0', port=5001, debug=True)

"""
The main application file.

This file sets up the Flask app, initializes the extensions,
configures the logging, and registers the blueprints (routes).
"""
import os
from flask import Flask, send_from_directory
from extensions import db, login_manager, bcrypt, jwt
from flask_cors import CORS
import logging
from database import init_db
from routes import image_routes
from auth import auth_routes


app = Flask(__name__, static_folder='build', static_url_path='')

# Set SQLALCHEMY_DATABASE_URI to connect to the SQLite database
# The value is retrieved from the environment variables
# If not set, it defaults to 'sqlite:///users.db'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///users.db')

# Set SECRET_KEY to a secret key
# The value is retrieved from the environment variables
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Initialize extensions
db.init_app(app)
login_manager.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
CORS(app)

# Logging configuration
# Set the logging level to DEBUG
logging.basicConfig(level=logging.DEBUG)

# Register Blueprints (routes)
# Register the image_routes blueprint under the '/images' prefix
app.register_blueprint(image_routes, url_prefix='/images')

# Register the auth_routes blueprint under the '/auth' prefix
app.register_blueprint(auth_routes, url_prefix='/auth')

# Initialize the database
# This is done in an application context to ensure
# that the database is initialized correctly
with app.app_context():
    init_db()

# Static File Serving (React Frontend)
# This is the main entry point for the React frontend
# It serves static files from the 'build' folder
@app.route('/')
@app.route('/<path:path>')
def serve_react_app(path=''):
    """
    Serves static files from the 'build' folder.

    If the requested path is a file that exists in the 'build' folder,
    it is served directly. Otherwise, it serves the 'index.html' file.
    """
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    """
    Runs the application in debug mode if this file is run directly.
    """
    app.run(debug=True)


"""
The main application file.

This file sets up the Flask app, initializes the extensions,
configures the logging, and registers the blueprints (routes).
"""
import os
from flask import Flask, send_from_directory
from config import Config
from extensions import db, login_manager, bcrypt, jwt
from flask_cors import CORS
import logging
from database import init_db
from routes import image_routes
from auth import auth_routes


app = Flask(__name__, static_folder='build', static_url_path='')

# Load configuration from config.py
app.config.from_object(Config)

# Set SECRET_KEY to a secret key
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Initialize the SQLAlchemy database instance with the Flask app
db.init_app(app)

# Initialize the login manager to manage user sessions and authentication
login_manager.init_app(app)

# Initialize Bcrypt for hashing and verifying user passwords securely
bcrypt.init_app(app)

# Initialize JWT to handle user authentication and authorization through tokens
jwt.init_app(app)

# Enable Cross-Origin Resource Sharing (CORS) to allow requests from different origins
CORS(app)

# Logging configuration
logging.basicConfig(level=logging.DEBUG)

# Register the image_routes blueprint under the '/images' prefix
app.register_blueprint(image_routes, url_prefix='/images')

# Register the auth_routes blueprint under the '/auth' prefix
app.register_blueprint(auth_routes, url_prefix='/auth')

# Initialize the database
with app.app_context():
    db.create_all()

@app.route('/')
def serve():
    """Serve the React frontend from the static folder."""
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    """
    Runs the application in debug mode if this file is run directly.
    """
    app.run(debug=True)


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
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///users.db')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # Retrieve SECRET_KEY from environment variables

# Initialize extensions
db.init_app(app)
login_manager.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
CORS(app)

# Logging configuration
logging.basicConfig(level=logging.DEBUG)

# Register Blueprints (routes)
app.register_blueprint(image_routes, url_prefix='/images')
app.register_blueprint(auth_routes, url_prefix='/auth')

# Initialize the database
with app.app_context():
    init_db()

# Static File Serving (React Frontend)
@app.route('/')
@app.route('/<path:path>')
def serve_react_app(path=''):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    app.run(debug=True)

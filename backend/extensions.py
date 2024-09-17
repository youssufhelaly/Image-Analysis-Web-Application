"""
Extensions for the Flask application.

This module initializes the extensions used in the application.

"""
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

#: The database extension.
db = SQLAlchemy()

#: The Bcrypt extension.
bcrypt = Bcrypt()

#: The LoginManager extension.
login_manager = LoginManager()

#: The JWTManager extension.
jwt = JWTManager()


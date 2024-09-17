"""
Blueprint for authentication routes.

This blueprint contains routes for user registration, login, and logout.

"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_login import login_required, logout_user
from extensions import db, bcrypt, login_manager
from models import User

auth_routes = Blueprint('auth_routes', __name__)


@login_manager.user_loader
def load_user(user_id):
    """
    Load a user by ID.

    This function is used by Flask-Login to load a user by ID.

    Args:
        user_id (int): The ID of the user to load.

    Returns:
        User: The loaded user.
    """
    return User.query.get(int(user_id))


@auth_routes.route('/register', methods=['POST'])
def register():
    """
    Register a new user.

    This route registers a new user with the provided username and password.

    Args:
        data (dict): The request data. Should contain 'username' and 'password' keys.

    Returns:
        tuple: A JSON response with a message and a status code.
    """
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered'}), 201


@auth_routes.route('/login', methods=['POST'])
def login():
    """
    Login a user.

    This route logs in a user with the provided username and password.

    Args:
        data (dict): The request data. Should contain 'username' and 'password' keys.

    Returns:
        tuple: A JSON response with an access token and a status code.
    """
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({'access_token': access_token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401


@auth_routes.route('/logout', methods=['GET'])
@login_required
def logout():
    """
    Logout a user.

    This route logs out a user.

    Returns:
        tuple: A JSON response with a message and a status code.
    """
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


import ast

from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from database import file_exists, get_analysis_results, init_db, save_analysis_results
import logging
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
import boto3

app = Flask(__name__, static_folder='build', static_url_path='')

@app.route('/')
@app.route('/<path:path>')
def serve_react_app(path=''):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # Retrieve SECRET_KEY from environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')  # Retrieve database URI from environment variables
db = SQLAlchemy(app)
login_manager = LoginManager(app)
bcrypt = Bcrypt(app)
CORS(app)  # Consider restricting this in production
jwt = JWTManager(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({'access_token': access_token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

def init_db():
    with app.app_context():  # Ensure the context is pushed
        db.create_all()  # This will create all tables

# Initialize the Rekognition and S3 clients with environment credentials
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-west-2')  # Set your AWS region
)

rekognition_client = boto3.client(
    'rekognition',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-2'  # Set your AWS region
)

S3_BUCKET_NAME = 'objectrekognitionimages'

@app.route('/upload-and-analyze', methods=['POST'])
@jwt_required()
def upload_and_analyze_image():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    responses = []
    
    if 'files' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    files = request.files.getlist('files')

    if not files:
        return jsonify({"msg": "No files uploaded"}), 400

    for file in files:
        if file.filename == '':
            responses.append({"filename": file.filename, "msg": "No selected file"})
            continue

        if file_exists(file.filename):
            # Retrieve existing results if the file is already in the database
            existing_results = get_analysis_results(file.filename)
            responses.append({
                "filename": file.filename,
                "msg": "File already analyzed",
                "results": existing_results
            })
            continue

        s3_key = file.filename

        try:
            s3_client.upload_fileobj(file, S3_BUCKET_NAME, s3_key)
            logging.info(f"File {s3_key} uploaded to S3")

            rekognition_response = rekognition_client.detect_labels(
                Image={'S3Object': {'Bucket': S3_BUCKET_NAME, 'Name': s3_key}},
                MinConfidence=80
            )
            logging.info(f"Rekognition analysis for {s3_key} completed")

            save_analysis_results(file.filename, rekognition_response['Labels'])

            responses.append({
                "filename": file.filename,
                "msg": "File uploaded and analyzed successfully",
                "rekognition_labels": rekognition_response['Labels']
            })

        except Exception as e:
            logging.error(f"Error processing file {file.filename}: {e}")
            responses.append({"filename": file.filename, "msg": "Error processing file", "error": str(e)})

    return jsonify(responses), 200


@app.route('/find-object', methods=['POST'])
@jwt_required()
def find_object():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()
    response = data.get('data')[0].get("results")
    target_object = data.get('object').lower()
    min_count = data.get('count')

    found_target_object = False
    number_of_objects_found = 0

    labels = response[0][2]
    labels = labels[1:len(labels)-1]
    labels = ast.literal_eval(labels)

    for label in labels:
        if label.get('Name', '').lower() == target_object:
            instances = label.get('Instances', [])
            number_of_objects_found += len(instances) if instances else 1

    if (int(min_count) == 0 and number_of_objects_found == 0) or number_of_objects_found >= int(min_count):
        found_target_object = True

    return jsonify({'found': found_target_object, 'number_of_objects_found': number_of_objects_found})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)

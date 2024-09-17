import ast
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User  # No circular import issue anymore
from aws_services import upload_and_analyze_image
from database import file_exists, get_analysis_results, save_analysis_results

image_routes = Blueprint('image_routes', __name__)

@image_routes.route('/upload-and-analyze', methods=['POST'])
@jwt_required()
def upload_and_analyze():
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
            existing_results = get_analysis_results(file.filename)
            responses.append({
                "filename": file.filename,
                "msg": "File already analyzed",
                "results": existing_results
            })
            continue

        result = upload_and_analyze_image(file, file.filename)
        responses.append(result)

    return jsonify(responses), 200

@image_routes.route('/find-object', methods=['POST'])
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
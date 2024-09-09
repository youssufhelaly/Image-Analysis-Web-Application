from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import boto3
from io import BytesIO
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize the Rekognition client with default credentials
rekognition_client = boto3.client(
    'rekognition',
    aws_access_key_id='AKIAQWHCQDLRD4XSAUP7',
    aws_secret_access_key='T3mI4i9HyKZt8y2Agd++MZbCLlux2ziHsc0JVzfb',
    region_name='us-west-2'  # Replace with your preferred region
)

@app.route('/upload', methods=['POST'])
def upload_image():
    responses = []
    if 'files' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    files = request.files.getlist('files')

    for file in files:
        if file.filename == '':
            responses.append({"filename": file.filename, "msg": "No selected file"})
            continue

        # Read the file into memory
        image_bytes = file.read()

        try:
            # Call Rekognition's detect_labels API
            response = rekognition_client.detect_labels(
                Image={'Bytes': image_bytes},
                MaxLabels=10,  # Maximum number of labels to return
                MinConfidence=70  # Minimum confidence level for labels
            )

            # Process the response
            responses.append({
                "filename": file.filename,
                "response": response
            })

        except boto3.exceptions.Boto3Error as e:
            responses.append({
                "filename": file.filename,
                "msg": "Error connecting to Rekognition service",
                "error": str(e)
            })
        except Exception as e:
            responses.append({
                "filename": file.filename,
                "msg": "Error processing image",
                "error": str(e)
            })

    return jsonify(responses), 200


@app.route('/find-object', methods=['POST'])
def find_object():
    data = request.get_json()
    target_object = data.get('targetObject')
    data = data.get('data')

    if not target_object or not data:
        return jsonify({'error': 'Missing targetObject or data'}), 400

    found_target_object = False
    number_of_objects_found = 0
    unique_labels = set()  # To store unique labels

    for item in data:
        if 'response' in item:
            labels = item['response'].get('Labels', [])
            for label in labels:
                label_name = label.get('Name').lower()
                # Check if the label's name matches the target object
                if label_name == target_object.lower():
                    found_target_object = True
                    # If there are instances, count them
                    instances = label.get('Instances', [])
                    if instances:
                        number_of_objects_found += len(instances)
                    else:
                        # If there are no instances, but the label is present, count it as one detection
                        if label_name not in unique_labels:
                            number_of_objects_found += 1
                            unique_labels.add(label_name)

    return jsonify({'found': found_target_object, 'number_of_objects_found': number_of_objects_found})



if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import boto3
import logging

app = Flask(__name__)
CORS(app)  # Consider restricting this in production

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize the Rekognition client with environment credentials
rekognition_client = boto3.client(
    'rekognition',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-west-2')  # Default region as fallback
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
            logging.debug("Calling Rekognition API for file: %s", file.filename)
            # Call Rekognition's detect_labels API
            response = rekognition_client.detect_labels(
                Image={'Bytes': image_bytes},
                MinConfidence=80
            )

            logging.info("Rekognition succeeded for file: %s", file.filename)
            responses.append({
                "filename": file.filename,
                "response": response
            })

        except boto3.exceptions.Boto3Error as e:
            logging.error("Rekognition failed for file: %s, error: %s", file.filename, e)
            responses.append({
                "filename": file.filename,
                "msg": "Error connecting to Rekognition service",
                "error": str(e)
            })
        except Exception as e:
            logging.error("Error processing image for file: %s, error: %s", file.filename, e)
            responses.append({
                "filename": file.filename,
                "msg": "Error processing image",
                "error": str(e)
            })

    return jsonify(responses), 200


@app.route('/find-object', methods=['POST'])
def find_object():
    data = request.get_json()  # Extract the JSON data from the request
    uploaded_data = data.get('data')  # The data returned from the upload
    target_object = data.get('object')  # The target object to search for
    min_count = data.get('count')  # Minimum number of objects required

    if not target_object or not min_count or not uploaded_data:
        return jsonify({'error': 'Missing data, object, or count in request'}), 400

    found_target_object = False
    number_of_objects_found = 0
    target_object = target_object.lower()

    for item in uploaded_data:
        if 'response' in item:
            labels = item['response'].get('Labels', [])
            for label in labels:
                if label.get('Name', '').lower() == target_object:
                    # Count the number of instances of the target object
                    instances = label.get('Instances', [])
                    number_of_objects_found += len(instances)  # Increment by the number of detected instances

    if int(min_count) == 0 and number_of_objects_found > 0:
        found_target_object = False
    elif number_of_objects_found < int(min_count):
        found_target_object = False
    else:
        found_target_object = True

    return jsonify({'found': found_target_object, 'number_of_objects_found': number_of_objects_found})




if __name__ == "__main__":
    app.run(debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import boto3
import logging
from database import init_db, save_analysis_results

app = Flask(__name__)
CORS(app)  # Consider restricting this in production

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize the Rekognition client with environment credentials
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
# S3 bucket name
S3_BUCKET_NAME = 'objectrekognitionimages'

@app.route('/upload-and-analyze', methods=['POST'])
def upload_and_analyze_image():
    responses = []
    if 'files' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    files = request.files.getlist('files')

    for file in files:
        if file.filename == '':
            responses.append({"filename": file.filename, "msg": "No selected file"})
            continue

        s3_key = file.filename

        try:
            s3_client.upload_fileobj(file, S3_BUCKET_NAME, s3_key)
            rekognition_response = rekognition_client.detect_labels(
                Image={
                    'S3Object': {
                        'Bucket': S3_BUCKET_NAME,
                        'Name': s3_key
                    }
                },
                MinConfidence=80
            )

            # Save results in the database
            save_analysis_results(s3_key, rekognition_response['Labels'])

            responses.append({
                "filename": s3_key,
                "rekognition_labels": rekognition_response['Labels']
            })

        except Exception as e:
            responses.append({"filename": file.filename, "msg": "Error processing file", "error": str(e)})

    return jsonify(responses), 200

@app.route('/find-object', methods=['POST'])
def find_object():
    data = request.get_json()  # Extract the JSON data from the request
    labels = data.get('data')[0].get("rekognition_labels")# The data returned from the upload
    target_object = data.get('object')  # The target object to search for
    min_count = data.get('count')  # Minimum number of objects required


    found_target_object = False
    number_of_objects_found = 0
    target_object = target_object.lower()


    for label in labels:
        if label.get('Name', '').lower() == target_object:
            # Count the number of instances of the target object
            instances = label.get('Instances', [])
            if (not instances):
                number_of_objects_found = 1
            else : 
                number_of_objects_found += len(instances)  # Increment by the number of detected instances

    if int(min_count) == 0 and number_of_objects_found == 0:
        found_target_object = False
    elif number_of_objects_found < int(min_count):
        found_target_object = False
    else:
        found_target_object = True

    return jsonify({'found': found_target_object, 'number_of_objects_found': number_of_objects_found})




if __name__ == "__main__":
    init_db()
    app.run(debug=True)

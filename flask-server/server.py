from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)

CLOUDMERSIVE_API_KEY = "e7386a3f-9002-4461-9f7e-0f42be0d258f"

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

        file_path = os.path.join("uploads", file.filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Ensure the directory exists
        file.save(file_path)

        try:
            with open(file_path, 'rb') as image_file:
                headers = {
                    "Apikey": CLOUDMERSIVE_API_KEY
                }
                files = {
                    'imageFile': image_file
                }
                api_response = requests.post(
                    "https://api.cloudmersive.com/image/recognize/detect-objects",
                    headers=headers,
                    files=files
                )

            if api_response.status_code == 200:
                responses.append({
                    "filename": file.filename,
                    "response": api_response.json()
                })
            else:
                responses.append({
                    "filename": file.filename,
                    "msg": "Error processing image",
                    "error": api_response.text
                })

        except requests.RequestException as e:
            responses.append({
                "filename": file.filename,
                "msg": "Error connecting to the recognition service",
                "error": str(e)
            })
        except Exception as e:
            responses.append({
                "filename": file.filename,
                "msg": "Error processing image",
                "error": str(e)
            })

    return jsonify(responses), 200

if __name__ == "__main__":
    app.run(debug=True)

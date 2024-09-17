import logging
from aws_client import s3_client, rekognition_client, S3_BUCKET_NAME
from database import save_analysis_results

def upload_and_analyze_image(file, filename):
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

        return {
            "filename": file.filename,
            "msg": "File uploaded and analyzed successfully",
            "rekognition_labels": rekognition_response['Labels']
        }
    except Exception as e:
        logging.error(f"Error processing file {file.filename}: {e}")
        return {"filename": file.filename, "msg": "Error processing file", "error": str(e)}

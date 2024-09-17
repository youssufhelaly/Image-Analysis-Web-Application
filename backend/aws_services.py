import boto3
import os

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-west-2')
)

rekognition_client = boto3.client(
    'rekognition',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-2'
)

S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

from database import save_analysis_results
import logging

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

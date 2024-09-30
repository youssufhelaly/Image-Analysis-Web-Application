"""
Provides functions to interact with AWS services

* upload_and_analyze_image: upload a file to S3 and analyze it using Rekognition
"""

import boto3
import os
from database import save_analysis_results
import logging

# S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-west-2')
)

# Rekognition client
rekognition_client = boto3.client(
    'rekognition',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-2'
)

# The name of the S3 bucket
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

def upload_and_analyze_image(file):
    """
    Uploads a file to S3 and analyzes it using Rekognition

    Args:
        file (file-like object): The file to upload and analyze

    Returns:
        A dictionary containing the filename, a success message, and the labels
        detected by Rekognition
    """
    s3_key = file.filename
    try:
        # Upload the file to S3
        s3_client.upload_fileobj(file, S3_BUCKET_NAME, s3_key)
        logging.info(f"File {s3_key} uploaded to S3")

        # Analyze the file using Rekognition
        rekognition_response = rekognition_client.detect_labels(
            Image={'S3Object': {'Bucket': S3_BUCKET_NAME, 'Name': s3_key}},
            MinConfidence=80
        )
        logging.info(f"Rekognition analysis for {s3_key} completed")

        # Save the analysis results to the database
        save_analysis_results(file.filename, rekognition_response['Labels'])

        # Return the results
        return {
            "filename": file.filename,
            "msg": "File uploaded and analyzed successfully",
            "rekognition_labels": rekognition_response['Labels']
        }
    except Exception as e:
        # Log any errors that occur
        logging.error(f"Error processing file {file.filename}: {e}", exc_info=True)
        # Return a generic error message
        return {"filename": file.filename, "msg": "Error processing file"}



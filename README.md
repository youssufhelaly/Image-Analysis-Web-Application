# Image Analysis Project

## Overview

This web application allows users to log in, upload images or zip folders, search for multiple objects within those images, and view the count of each object present. It is built using React for the frontend and Flask for the backend, with user authentication and authorization features. The application integrates with AWS Rekognition for image analysis and S3 buckets for image storage, while SQLite is used to manage image analysis results in a database to prevent analyzing the same image more than once.

## Features

- **Image Upload**: Users can upload images or zip files containing images.
- **Object Search**: Users can search for specific objects within the images.
- **Advanced Search**: Users can specify multiple objects to search for, and apply filters like size, shape, or color.
- **Image Analysis**: Utilizes AWS Rekognition for analyzing images.
- **Result Storage**: Analysis results are stored in an SQLite database.
- **User Authentication**: Users can register and log in to access their uploads and search history.

## Technologies Used

- **Frontend**: React, Material-UI
- **Backend**: Flask
- **Database**: SQLite
- **Image Analysis**: AWS Rekognition
- **Image Storage**: AWS S3

# Video Demo
https://github.com/user-attachments/assets/ce0e9f2e-0425-40f3-a5f6-7efbb7dec320

## Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/yourusername/your-repository.git
   cd your-repository

## Frontend Setup

### Navigate to the frontend directory and install dependencies:

`npm install`

## Backend Setup

### Create the virtual environment:
`python -m venv myenv`

#### Activate the virtual environment:
##### On Windows:
`myenv\Scripts\activate`

##### On macOS/Linux:
`source myenv/bin/activate`

### Install necessary packages: Once the virtual environment is activated, you can install the packages you need using pip:

`pip install -r dependencies.txt`

### Environment Variables

#### On macOS/Linux, create a file named .env in your project directory and add the following lines:

`AWS_ACCESS_KEY_ID=your-access-key-id`
`AWS_SECRET_ACCESS_KEY=your-secret-access-key`
`AWS_REGION=your-region`
`S3_BUCKET_NAME=your-bucket-name`
##### To load these variables into your shell session, use:
`export $(cat .env | xargs)`

#### On Windows, set environment variables directly in your terminal session:

`set AWS_ACCESS_KEY_ID=your-access-key-id`
`set AWS_SECRET_ACCESS_KEY=your-secret-access-key`
`set AWS_REGION=your-region`
`set S3_BUCKET_NAME=your-bucket-name`

## Running the Application
### Start the Backend

`cd backend`
`python app.py`
### Start the Frontend

`cd frontend`
`npm start`

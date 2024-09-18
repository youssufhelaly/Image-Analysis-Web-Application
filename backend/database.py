"""
Database initialization and access functions.

This module contains functions to initialize the database tables and
to access the database to store and retrieve analysis results.
"""

import sqlite3

from models import AnalysisResult
from extensions import db

def init_db():
    """
    Initialize the database tables.

    This function creates the tables in the 'users.db' and
    'image_analysis.db' databases if they do not already exist.
    """
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

    conn = sqlite3.connect('image_analysis.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            labels TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def file_exists(filename):
    """
    Check if a file already exists in the database.

    Args:
        filename (str): The name of the file to check.

    Returns:
        bool: True if the file exists, False otherwise.
    """
    # Query the database using SQLAlchemy ORM
    result = db.session.query(AnalysisResult).filter_by(filename=filename).first()
    return result is not None


def save_analysis_results(filename, labels):
    """
    Save the analysis results for a file to the database.

    Args:
        filename (str): The name of the file.
        labels (list): The list of labels for the file.

    Raises:
        sqlite3.IntegrityError: If the filename already exists in the database.
    """
    new_result = AnalysisResult(filename=filename, labels=str(labels))
    try:
        db.session.add(new_result)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error saving file {filename}: {e}")

def get_analysis_results(filename):
    """
    Retrieve the analysis results for a file from the database.
    
    Args:
        filename (str): The name of the file.
    
    Returns:
        list: The list of labels for the file.
    """
    result = db.session.query(AnalysisResult).filter_by(filename=filename).first()
    return result.labels if result else None
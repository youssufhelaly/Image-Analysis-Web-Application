import sqlite3

def init_db():
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
    conn = sqlite3.connect('image_analysis.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT 1 FROM analysis_results WHERE filename = ?
    ''', (filename,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

def save_analysis_results(filename, labels):
    conn = sqlite3.connect('image_analysis.db')
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO analysis_results (filename, labels)
            VALUES (?, ?)
        ''', (filename, str(labels)))
        conn.commit()
    except sqlite3.IntegrityError:
        # Handle the case where the filename already exists
        print(f"File {filename} already exists in the database.")
    finally:
        conn.close()

def get_analysis_results(filename):
    conn = sqlite3.connect('image_analysis.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM analysis_results
        WHERE filename = ?
    ''', (filename,))
    results = cursor.fetchall()
    conn.close()
    return results

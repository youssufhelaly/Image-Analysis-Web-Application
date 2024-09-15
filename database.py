import sqlite3

def init_db():
    conn = sqlite3.connect('image_analysis.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            labels TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_analysis_results(filename, labels):
    conn = sqlite3.connect('image_analysis.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO analysis_results (filename, labels)
        VALUES (?, ?)
    ''', (filename, str(labels)))
    conn.commit()
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

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///users.db'
    SQLALCHEMY_BINDS = {
        'image_analysis': 'sqlite:///image_analysis.db'
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Optional: Disable modification tracking

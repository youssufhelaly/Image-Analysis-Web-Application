from datetime import timedelta


class Config:
    """
    Configuration class for the Flask application.

    Attributes:
        SQLALCHEMY_DATABASE_URI (str): URI for the users database.
        SQLALCHEMY_BINDS (dict): Dictionary of URIs for the image analysis database.
        SQLALCHEMY_TRACK_MODIFICATIONS (bool): Whether to track modifications to the database.
    """

    # URI for the users database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///users.db'

    # Dictionary of URIs for the image analysis database
    SQLALCHEMY_BINDS = {
        'image_analysis': 'sqlite:///image_analysis.db'
    }
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)  # Token expires in 30 days
    # Whether to track modifications to the database
    SQLALCHEMY_TRACK_MODIFICATIONS = False



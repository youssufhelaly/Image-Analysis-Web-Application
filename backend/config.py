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

    # Whether to track modifications to the database
    SQLALCHEMY_TRACK_MODIFICATIONS = False



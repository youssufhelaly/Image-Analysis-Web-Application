from extensions import db

# Models for the user database
class User(db.Model):
    """Represents a user in the database."""
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        """Return a string representation of the user."""
        return f"User('{self.username}')"

# Models for the image_analysis database
class AnalysisResult(db.Model):
    """Represents an analysis result in the database."""
    __bind_key__ = 'image_analysis'
    __tablename__ = 'analysis_results'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), unique=True, nullable=False)
    labels = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        """Return a string representation of the analysis result."""
        return f"AnalysisResult('{self.filename}')"
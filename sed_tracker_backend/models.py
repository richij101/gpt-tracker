from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Entry(db.Model):
    id = db.Column(db.String(36), primary_key=True, unique=True, nullable=False) # Using String for potential UUIDs later, or simple numeric strings
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    ship_name = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'category': self.category,
            'status': self.status,
            'shipName': self.ship_name,
            'country': self.country,
            'notes': self.notes
        }

    def __repr__(self):
        return f'<Entry {self.id} - {self.date} - {self.category}>'

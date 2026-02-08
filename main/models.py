from flask_mongoengine import MongoEngine
from mongoengine import Document, StringField, IntField, BooleanField, ReferenceField, DateTimeField

db = MongoEngine()

class Role(db.Document):
    name = db.StringField(required=True, unique=True)
    department = db.StringField()
    facilities_email = db.BooleanField(required=True)

class User(db.Document):
    user_id = db.StringField(required=True, unique=True)
    email = db.StringField(required=True, unique=True)
    password = db.StringField(required=True)
    role = db.ReferenceField(Role, required=True)

class Rooms(db.Document):
    room_id = db.StringField(required=True, unique=True)
    room_name = db.StringField(required=True, unique=True)
    max_occupancy = db.IntField(required=True)

class SecurityEmails(db.Document):
    room = db.ReferenceField(Rooms, required=True)
    user = db.ReferenceField(User, required=True)

class RoomData(db.Document):
    room = db.ReferenceField(Rooms, required=True)
    time = db.IntField(required=True)
    occupancy = db.IntField(required=True)
    temperature = db.IntField(required=True)
    ac = db.BooleanField(required=True)
    lights = db.BooleanField(required=True)
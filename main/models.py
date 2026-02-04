from flask_mongoengine import MongoEngine
from datetime import datetime

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

# class RoomSensor(db.Document):
#     room = db.ReferenceField(Rooms, required=True)
#     time = db.DateTimeField(required=True, default=datetime.utcnow)
#     temp = db.FloatField(required=True)
#     ac = db.BooleanField(required=True)
#     light = db.BooleanField(required=True)

#     meta = {
#         'indexes': ['room', 'date_time']
#     }

# class OccupancyCoordinates(db.EmbeddedDocument):
#     person_id = db.StringField() 
#     x = db.FloatField(required=True)
#     y = db.FloatField(required=True)

# class RoomOccupancy(db.Document):
#     room = db.ReferenceField('Rooms', required=True)
#     date_time = db.DateTimeField(required=True)
#     reID_metadata = db.StringField() 
#     coordinates = db.ListField(db.EmbeddedDocumentField(OccupancyCoordinates))

#     meta = {
#         'indexes': ['room', 'date_time']
#     }

class RoomData(db.Document):
    room = db.ReferenceField(Rooms, required=True)
    time = db.IntegerField(required=True)
    occupancy = db.IntegerField(required=True)
    temperature = db.FloatField(required=True)
    ac = db.BooleanField(required=True)
    lights = db.BooleanField(required=True)
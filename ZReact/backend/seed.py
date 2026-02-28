import os
from dotenv import load_dotenv
from mongoengine import connect
from models import User, Role, Rooms, SecurityEmails, RoomData
from werkzeug.security import generate_password_hash

# 1. Load environment variables from .env
load_dotenv()

# 2. Connect directly to MongoDB
mongo_uri = os.getenv("MONGODB_URI")
if not mongo_uri:
    raise ValueError("No MONGODB_URI found. Please make sure you have a .env file.")

print("Connecting to database...")
connect(host=mongo_uri)

print("Deleting old data...")
User.objects.delete()
Role.objects.delete()
# also remove rooms and related documents to avoid duplicate key errors
Rooms.objects.delete()
SecurityEmails.objects.delete()
# wipe historical room data if you plan to reseed it too
RoomData.objects.delete()

print("Seeding Database...")

Role(name='Security Admin', department='Security', facilities_email=False).save()
Role(name='Facilities Admin', department='Facilities', facilities_email=True).save()
Role(name='Admin', department='Admin', facilities_email=True).save()
Role(name='Security Officer', department='Security', facilities_email=False).save()

User(
    user_id='security',
    email='security@habib.edu.pk',
    password=generate_password_hash('security123'),
    role=Role.objects(name='Security Admin').first()
).save()

User(
    user_id='facility',
    email='facility@habib.edu.pk',
    password=generate_password_hash('facility123'),
    role=Role.objects(name='Facilities Admin').first()
).save()

User(
    user_id='admin',
    email='admin@habib.edu.pk',
    password=generate_password_hash('admin123'),
    role=Role.objects(name='Admin').first()
).save()

User(
    user_id='nh07884',
    email='nh07884@st.habib.edu.pk',
    password=generate_password_hash('YoGurt67'),
    role=Role.objects(name='Security Officer').first()
).save()

User(
    user_id='mk07899',
    email='mk07899@st.habib.edu.pk',
    password=generate_password_hash('MSK>NNH100'),
    role=Role.objects(name='Security Officer').first()
).save()

Rooms(
    room_id='C-006',
    room_name='Digital Instrumentations Lab',
    max_occupancy=50
).save()

Rooms(
    room_id='C-007',
    room_name='Projects Lab',
    max_occupancy=50
).save()

SecurityEmails(
    room=Rooms.objects(room_id='C-006').first(),
    user=User.objects(user_id='nh07884').first()
).save()

SecurityEmails(
    room=Rooms.objects(room_id='C-007').first(),
    user=User.objects(user_id='mk07899').first()
).save()

print("Database seeded successfully!")
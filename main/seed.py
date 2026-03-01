from app import app
from models import db, User, Role, Rooms, SecurityEmails
from werkzeug.security import generate_password_hash

# Connect to the app context to access the DB
with app.app_context():
    print("Deleting old data...")
    User.objects.delete()
    Role.objects.delete()
    Rooms.objects.delete()
    SecurityEmails.objects.delete()


    print("Seeding Database...")

    Role(name='Security Admin', department='Security', facilities_email=False).save()
    Role(name='Facilities Admin', department='Facilities', facilities_email=True).save()
    Role(name='Admin', department='Admin', facilities_email=True).save()
    Role(name='Security Officer', department='Security', facilities_email=False).save()
    Role(name='Facilities Officer', department='Facilities', facilities_email=True).save()
    
    User(
        user_id='security',
        email='security@none',
        password=generate_password_hash('security123'),
        role=Role.objects(name='Security Admin').first()
    ).save()

    User(
        user_id='facility',
        email='facility@none',
        password=generate_password_hash('facility123'),
        role=Role.objects(name='Facilities Admin').first()
    ).save()

    User(
        user_id='admin',
        email='admin@none',
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

    User(
        user_id='shawaiz',
        email='shawaizniazi917@gmail.com',
        password=generate_password_hash('MSK>NNH100'),
        role=Role.objects(name='Facilities Officer').first()
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
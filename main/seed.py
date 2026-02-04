from app import app
from models import db, User, Role, Rooms, SecurityEmails
from werkzeug.security import generate_password_hash

# Connect to the app context to access the DB
with app.app_context():
    print("Deleting old data...")
    User.objects.delete()
    Role.objects.delete()

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

    Rooms(
        room_id='C-007',
        room_name='Projects Lab',
        max_occupancy=50
    )

    SecurityEmails(
        room='C-007',
        user=User.objects(user_id='nh07884').first()
    )

    print("Database seeded successfully!")
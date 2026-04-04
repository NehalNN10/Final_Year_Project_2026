from app import app
from models import db, User, Role, Rooms, SecurityEmails, RoomData
from werkzeug.security import generate_password_hash
import pandas as pd

# Connect to the app context to access the DB
with app.app_context():
    print("Deleting old data...")
    User.objects.delete()
    Role.objects.delete()
    Rooms.objects.delete()
    SecurityEmails.objects.delete()
    RoomData.objects.delete()

    print("Seeding Database...")

    Role(name='Security Admin', department='Security', facilities_email=False).save()
    Role(name='Facilities Admin', department='Facilities', facilities_email=True).save()
    Role(name='Admin', department='Admin', facilities_email=True).save()
    Role(name='Security Officer', department='Security', facilities_email=False).save()
    Role(name='Facilities Officer', department='Facilities', facilities_email=True).save()
    
    User(
        user_id='security',
        name='Security Admin',
        email='security@none',
        password=generate_password_hash('security123'),
        role=Role.objects(name='Security Admin').first()
    ).save()

    User(
        user_id='facility',
        name='Facilities Admin',
        email='facility@none',
        password=generate_password_hash('facility123'),
        role=Role.objects(name='Facilities Admin').first()
    ).save()

    User(
        user_id='admin',
        name='Admin',
        email='admin@none',
        password=generate_password_hash('admin123'),
        role=Role.objects(name='Admin').first()
    ).save()

    User(
        user_id='nh07884',
        name="Nehal Naeem Haji",
        email='nh07884@st.habib.edu.pk',
        password=generate_password_hash('YoGurt67'),
        role=Role.objects(name='Security Officer').first()
    ).save()

    User(
        user_id='mk07899',
        name="Muhammad Shawaiz Khan",
        email='mk07899@st.habib.edu.pk',
        password=generate_password_hash('MSK>NNH100'),
        role=Role.objects(name='Security Officer').first()
    ).save()

    User(
        user_id='shawaiz',
        name="Shawaiz Niazi",
        email='shawaizniazi917@gmail.com',
        password=generate_password_hash('MSK>NNH100'),
        role=Role.objects(name='Facilities Officer').first()
    ).save()

    Rooms(
        room_id='C-006',
        room_name='Power Lab',
        room_floor='Lower Ground Floor',
        max_occupancy=30
    ).save()

    Rooms(
        room_id='C-007',
        room_name='Projects Lab',
        room_floor='Lower Ground Floor',
        max_occupancy=50
    ).save()

    Rooms(
        room_id='C-109',
        room_name='Arif Habib Classroom',
        room_floor='Ground Floor',
        max_occupancy=35
    ).save()

    SecurityEmails(
        room=Rooms.objects(room_id='C-109').first(),
        user=User.objects(user_id='mk07899').first()
    ).save()

    SecurityEmails(
        room=Rooms.objects(room_id='C-109').first(),
        user=User.objects(user_id='nh07884').first()
    ).save()

    SecurityEmails(
        room=Rooms.objects(room_id='C-006').first(),
        user=User.objects(user_id='nh07884').first()
    ).save()

    SecurityEmails(
        room=Rooms.objects(room_id='C-007').first(),
        user=User.objects(user_id='mk07899').first()
    ).save()

    data_proj = pd.read_csv("static/temp_files/csv_power_lab_iot_15min.csv")
    occu_proj = pd.read_csv('../csv_files/temp_files_15min/combined_count_15min.csv')

    occu_subset = occu_proj.iloc[22550:0:-25].reset_index(drop=True)
    data_proj['occu'] = occu_subset['Count']
    target_room = Rooms.objects(room_id='C-006').first()

    for index, row in data_proj.iterrows():
        RoomData(
            room = target_room,
            time = row['timestamp'],
            occupancy = row['occu'],
            temperature = row['temp'],
            ac = row['ac'] == 'On',
            lights = row['lights'] == 'On'
        ).save()
    
    data_proj = pd.read_csv("static/temp_files/combined_proj_data_15min.csv")
    target_room = Rooms.objects(room_id='C-007').first()

    for index, row in data_proj.iterrows():
        RoomData(
            room = target_room,
            time = row['timestamp'],
            occupancy = row['occu'],
            temperature = row['temp'],
            ac = row['ac'] == 'On',
            lights = row['lights'] == 'On'
        ).save()

    data_proj = pd.read_csv("static/temp_files/arif_iot_15min.csv")
    target_room = Rooms.objects(room_id='C-109').first()

    for index, row in data_proj.iterrows():
        RoomData(
            room = target_room,
            time = row['timestamp'],
            occupancy = row['occu'],
            temperature = row['temp'],
            ac = row['ac'] == 'On',
            lights = row['lights'] == 'On'
        ).save()

    print("Database seeded successfully!")
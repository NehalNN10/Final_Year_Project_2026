from app import app, db, User, Role
from werkzeug.security import generate_password_hash

with app.app_context():
    # Add a role first
    security_role = Role(name='security', facilities_email=False)
    db.session.add(security_role)
    db.session.commit()
    
    # Add a user
    security = User(
        user_id='security',
        email='security@habib.edu.pk',
        password=generate_password_hash('security123'),
        role_id=security_role.id
    )

    facility_role = Role(name='facility', facilities_email=True)
    db.session.add(facility_role)
    db.session.commit()
    
    # Add a user
    facility = User(
        user_id='facility',
        email='facility@habib.edu.pk',
        password=generate_password_hash('facility123'),
        role_id=facility_role.id
    )

    admin_role = Role(name='admin', facilities_email=True)
    db.session.add(admin_role)
    db.session.commit()
    
    # Add a user
    admin = User(
        user_id='admin',
        email='admin@habib.edu.pk',
        password=generate_password_hash('admin123'),
        role_id=admin_role.id
    )

    db.session.add(security)
    db.session.add(facility)
    db.session.add(admin)
    db.session.commit()
    print("User added successfully!")
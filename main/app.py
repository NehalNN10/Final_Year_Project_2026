from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, session
from models import db, Role, User, Rooms, SecurityEmails, RoomSensor, OccupancyCoordinates, RoomOccupancy # Import your DB and Models
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv("SECRET_KEY", "fallback_secret_key_change_in_production")

mongo_uri = os.getenv("MONGODB_URI") 

if not mongo_uri:
    raise ValueError("No MONGODB_URI set for Flask application")

app.config['MONGODB_SETTINGS'] = {
    'host': mongo_uri
}

db.init_app(app)

@app.route('/', methods=['GET', 'POST'])
def index():
    error = None  # Initialize error message
    if request.method == 'POST':
        user_id = request.form['user_id']
        password = request.form['password']

        # Query the user from the database
        id = User.objects(user_id=user_id).first()
        email = User.objects(email=user_id).first()

        if not id and not email:
            error = "User ID/Email does not exist."  # Error for invalid username
        elif not check_password_hash(id.password, password):
            error = "Incorrect password."  # Error for invalid password
        else:
            # Successful login
            session['user_id'] = str(id.id)
            session['department'] = id.role.department  # Store only the role name, not the object
            if id.role.department == 'Facilities':
                return redirect(url_for('facility_home'))
            return redirect(url_for('dashboard'), )  # Redirect to the facility_home or home page
    
    
    return render_template('index.html', error=error)

@app.route('/model')
def model():
    return render_template('model.html', department=session.get('department'))

@app.route('/model_replay')
def model_replay():
    return render_template('model_replay.html', department=session.get('department'))

@app.route('/facility_home')
def facility_home():
    return render_template('facility_home.html', department=session.get('department'))

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', department=session.get('department'))

# Serve files from static/files directory
@app.route('/files/<path:filename>')
def serve_files(filename):
    return send_from_directory('static/files', filename)

# Serve models from static/models directory
@app.route('/models/<path:filename>')
def serve_models(filename):
    return send_from_directory('static/models', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1767, debug=True)
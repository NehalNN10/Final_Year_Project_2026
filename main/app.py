from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///scheduler.db'
app.config['SQLALCHEMY_ECHO'] = True
app.config['SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    facilities_email = db.Column(db.Boolean, nullable=False)

@app.route('/', methods=['GET', 'POST'])
def index():
    error = None  # Initialize error message
    if request.method == 'POST':
        user_id = request.form['user_id']
        password = request.form['password']

        # Query the user from the database
        id = User.query.filter_by(user_id=user_id).first()
        email = User.query.filter_by(email=user_id).first()

        if not id and not email:
            error = "User ID/Email does not exist."  # Error for invalid username
        elif not check_password_hash(id.password, password):
            error = "Incorrect password."  # Error for invalid password
        else:
            # Successful login
            session['user_id'] = id.id
            role = Role.query.get(id.role_id)
            session['role'] = role.name  # Store only the role name, not the object
            if role.name == 'facility':
                return redirect(url_for('facility_home'))
            return redirect(url_for('dashboard'))  # Redirect to the facility_home or home page
    
    
    return render_template('index.html', error=error)

@app.route('/model')
def model():
    return render_template('model.html', role=session.get('role'))

@app.route('/facility_home')
def facility_home():
    return render_template('facility_home.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# Serve files from static/files directory
@app.route('/files/<path:filename>')
def serve_files(filename):
    return send_from_directory('static/files', filename)

# Serve models from static/models directory
@app.route('/models/<path:filename>')
def serve_models(filename):
    return send_from_directory('static/models', filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=1767, debug=True)
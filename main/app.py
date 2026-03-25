import os
import json
import redis
from threading import Thread
from dotenv import load_dotenv

from flask import Flask, request, session, jsonify, send_from_directory
from flask_cors import CORS  # <--- ADD THIS
from flask_socketio import SocketIO, emit, disconnect
from werkzeug.security import generate_password_hash, check_password_hash

# Import your DB and Models
from models import db, Role, User, Rooms, SecurityEmails, RoomData 
from smtp_facilities import send_facilities_alert
from smtp_security import send_emergency_alert

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'csv_files'))

app = Flask(__name__)
CORS(app) # <--- ADD THIS LINE to allow Next.js to fetch files/APIs!

app.secret_key = os.getenv("SECRET_KEY", "fallback_secret_key_change_in_production")

mongo_uri = os.getenv("MONGODB_URI") 
if not mongo_uri:
    raise ValueError("No MONGODB_URI set for Flask application")

app.config['MONGODB_SETTINGS'] = {
    'host': mongo_uri
}

db.init_app(app)

# Redis setup
redis_client = redis.Redis(host='3.109.201.41', port=6379, decode_responses=True)
live_tracking_data = {}
redis_thread = None

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

from flask import send_from_directory

@app.route('/temp_files_15min/<path:filename>')
def serve_temp_files_15min(filename):
    return send_from_directory(os.path.join(CSV_DIR, 'temp_files_15min'), filename)

# ---------------------------------------------------------
# BACKGROUND TASKS & SOCKETS
# ---------------------------------------------------------

def redis_listener():
    """Background thread that listens to Redis and broadcasts to connected clients"""
    pubsub = redis_client.pubsub()
    pubsub.subscribe('tracking_stream')
    
    print("🎧 Redis listener started...")
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = json.loads(message['data'])
                track_id = data.get('id')
                occupancy = data.get('occupancy', 0)
                frame_num = data.get('frame', 0)
                
                # Store latest position for this track
                live_tracking_data[track_id] = {
                    'id': track_id,
                    'x': data.get('x', 0),
                    'z': data.get('z', 0),
                    'frame': frame_num,
                    'timestamp': data.get('timestamp', 0),
                    'occupancy': occupancy,
                    'region': data.get('region', 'Unknown')
                }
                
                # Broadcast to all connected WebSocket clients
                socketio.emit('live_tracking_update', live_tracking_data[track_id], skip_sid=None)
                print(f"📡 Broadcasting track {track_id}: x={data.get('x')}, z={data.get('z')}, occupancy={occupancy}, region={data.get('region', 'Unknown')}")
            except (json.JSONDecodeError, KeyError) as e:
                print(f"❌ Error processing Redis message: {e}")

def start_redis_listener():
    """Start Redis listener in background thread"""
    global redis_thread
    if redis_thread is None or not redis_thread.is_alive():
        redis_thread = Thread(target=redis_listener, daemon=True)
        redis_thread.start()
        print("✅ Redis listener thread started")

@socketio.on('connect')
def handle_connect():
    """Handle new WebSocket connection"""
    print(f"👤 Client connected: {request.sid}")
    socketio.emit('initial_live_data', list(live_tracking_data.values()))

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"👤 Client disconnected: {request.sid}")

@socketio.on('request_tracking_data')
def send_tracking_data():
    """Send all current tracking data on request"""
    socketio.emit('initial_live_data', list(live_tracking_data.values()))


# ---------------------------------------------------------
# AUTHENTICATION APIs
# ---------------------------------------------------------

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user_id_input = data.get('user_id')
    password_input = data.get('password')

    user = User.objects(user_id=user_id_input).first() or User.objects(email=user_id_input).first()

    if not user:
        return jsonify({'error': 'User ID/Email does not exist.'}), 404
    elif not check_password_hash(user.password, password_input):
        return jsonify({'error': 'Incorrect password.'}), 401
    else:
        session['user_id'] = str(user.id)
        session['department'] = user.role.department
        session['role'] = user.role.name 
        
        return jsonify({
            'success': True,
            'department': user.role.department,
            'role': user.role.name,
            'user_id': user.user_id
        }), 200

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear() 
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@app.route('/api/session', methods=['GET'])
def api_session():
    dept = session.get('department', 'Security') 
    return jsonify({'department': dept})


# ---------------------------------------------------------
# ALERT APIs
# ---------------------------------------------------------

@app.route('/api/send_emergency_alert', methods=['POST'])
def send_alert():
    data = request.get_json()
    
    try:
        room_number = data.get('room_number')
        occupancy_count = data.get('occupancy_count')

        recipients = []
        if room_number:
            room_obj = Rooms.objects(room_id=room_number).first()
            if room_obj:
                for se in SecurityEmails.objects(room=room_obj):
                    if se.user and se.user.email:
                        recipients.append(se.user.email)

        if not recipients:
            raise ValueError('No recipient email configured for this room or DEFAULT_EMERGENCY_RECIPIENT not set.')

        for rcpt in recipients:
            send_emergency_alert(room_number, occupancy_count, rcpt)

        print(f"Emergency Alert Sent - Room: {room_number}, Occupancy: {occupancy_count}, recipients={recipients}")
        return jsonify({'success': True, 'message': 'Emergency alert sent successfully!', 'recipients': recipients}), 200
    except Exception as e:
        print(f"Error sending emergency alert: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400
    
@app.route('/api/send_facilities_alert', methods=['POST'])
def send_fac_alert():
    data = request.get_json()
    
    try:
        room_number = data.get('room_number')
        alert_type = data.get('alert_type')
        time_since = data.get('time_since')
        description = data.get('description', '')

        recipients = []
        for officer in User.objects:
            if officer.role and officer.role.department == 'Facilities':
                if officer.email and not officer.email.endswith('@none'):
                    recipients.append(officer.email)

        if not recipients:
            raise ValueError('No recipient email configured or DEFAULT_EMERGENCY_RECIPIENT not set.')

        for rcpt in recipients:
            send_facilities_alert(room_number, alert_type, time_since, rcpt, description)

        print(f"Facilities Alert Sent - Room: {room_number}, Alert Type: {alert_type}, Time Since: {time_since}, Description: {description}, recipients={recipients}")
        return jsonify({'success': True, 'message': 'Facilities alert sent successfully!', 'recipients': recipients}), 200
    except Exception as e:
        print(f"Error sending facilities alert: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400


# ---------------------------------------------------------
# STAFF MANAGEMENT APIs
# ---------------------------------------------------------

@app.route('/api/staff/add', methods=['POST'])
def add_staff():
    data = request.get_json()
    try:
        role = Role.objects(name=data['role']).first()
        if not role:
            return jsonify({'error': 'Role not found'}), 400
            
        new_user = User(
            name=data.get('name'),
            user_id=data['user_id'],
            email=data['email'],
            password=generate_password_hash(data['password']),
            role=role
        )
        new_user.save()

        assigned_ids = data.get('assigned_rooms', [])
        for r_id in assigned_ids:
            room = None
            try:
                room = Rooms.objects(id=r_id).first()
            except Exception:
                pass 

            if not room:
                room = Rooms.objects(room_id=r_id).first()
            
            if room:
                SecurityEmails(user=new_user, room=room).save()

        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Error adding staff: {e}") 
        return jsonify({'error': str(e)}), 400

@app.route('/api/staff/edit', methods=['POST'])
def edit_staff():
    data = request.get_json()
    try:
        user = User.objects(id=data['staffDbId']).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        user.user_id = data['user_id']
        user.name = data.get('name')
        user.email = data['email']
        
        if data.get('password'):
            user.password = generate_password_hash(data['password'])
            
        role = Role.objects(name=data['role']).first()
        if role:
            user.role = role
            
        user.save()

        SecurityEmails.objects(user=user).delete()
        
        assigned_ids = data.get('assigned_rooms', [])
        for r_id in assigned_ids:
            room = None
            try:
                room = Rooms.objects(id=r_id).first()
            except Exception:
                pass
            
            if not room:
                room = Rooms.objects(room_id=r_id).first()
            
            if room:
                SecurityEmails(user=user, room=room).save()

        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Error editing staff: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/staff/delete', methods=['POST'])
def delete_staff():
    data = request.get_json()
    try:
        user = User.objects(id=data['id']).first()
        if user:
            user.delete()
            SecurityEmails.objects(user=user).delete()
            
            return jsonify({'success': True}), 200
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ---------------------------------------------------------
# DATA FETCHING APIs
# ---------------------------------------------------------

@app.route('/api/security_info', methods=['GET'])
def get_security_info():
    """Returns available Security roles and all Rooms"""
    try:
        roles = Role.objects(department='Security')
        roles_data = [{'name': r.name} for r in roles]

        rooms = Rooms.objects()
        rooms_data = [{'id': str(r.id), 'room_id': r.room_id, 'name': r.room_name} for r in rooms]

        return jsonify({'roles': roles_data, 'rooms': rooms_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/room_data', methods=['GET'])
def get_room_data():
    """Returns all RoomData entries for a given room"""
    room_id = request.args.get('room_id')
    try:
        room = Rooms.objects(room_id=room_id).first()
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        data_entries = RoomData.objects(room=room)
        data_list = []
        for d in data_entries:
            data_list.append({
                'time': d.time,
                'occupancy': d.occupancy,
                'temperature': d.temperature,
                'ac': d.ac,
                'lights': d.lights
            })
        
        return jsonify({'room_data': data_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/room_info', methods=['GET'])
def get_room_info():
    """Returns information about a specific room"""
    room_id = request.args.get('room_id')
    try:
        room = Rooms.objects(room_id=room_id).first()
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        return jsonify({
            'room_id': room.room_id,
            'name': room.room_name,
            'room_floor': room.room_floor,
            'max_occupancy': room.max_occupancy
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user_assignments/<user_db_id>', methods=['GET'])
def get_user_assignments(user_db_id):
    """Returns the list of Room IDs assigned to a specific user"""
    try:
        user = User.objects(id=user_db_id).first()
        if not user:
            return jsonify({'assigned_rooms': []})
        
        assignments = SecurityEmails.objects(user=user)
        assigned_room_ids = [str(a.room.id) for a in assignments]
        
        return jsonify({'assigned_rooms': assigned_room_ids})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security_home_data', methods=['GET'])
def api_security_home_data():
    try:
        staff_list = []
        for u in User.objects():
            if u.role and u.role.department == 'Security':
                staff_list.append({
                    'id': str(u.id),
                    'user_id': u.user_id,
                    'name': u.name,
                    'email': u.email,
                    'role': u.role.name
                })
        
        staff_rooms = {}
        for staff in staff_list:
            user_obj = User.objects(id=staff['id']).first()
            rooms_for_staff = []
            for se in SecurityEmails.objects(user=user_obj):
                if se.room:
                    rooms_for_staff.append(se.room.room_name)
            staff_rooms[staff['user_id']] = rooms_for_staff

        rooms_data = []
        for r in Rooms.objects():
            rd_entries = RoomData.objects(room=r).order_by('time')
            timeseries = []
            for rd in rd_entries:
                timeseries.append({
                    'time': rd.time,
                    'occupancy': rd.occupancy,
                    'temperature': rd.temperature,
                    'ac': rd.ac,
                    'lights': rd.lights
                })

            rooms_data.append({
                'id': str(r.id),
                'room_id': r.room_id,
                'name': r.room_name,
                'max_occupancy': r.max_occupancy,
                'timeseries': timeseries
            })

        return jsonify({
            'staff_list': staff_list,
            'staff_rooms': staff_rooms,
            'rooms': rooms_data,
            'current_role': session.get('role', 'Security Admin') 
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/facility_info', methods=['GET'])
def get_facility_info():
    """Returns available Facilities roles"""
    try:
        roles = Role.objects(department='Facilities') 
        roles_data = [{'name': r.name} for r in roles]
        return jsonify({'roles': roles_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/facility_home_data', methods=['GET'])
def api_facility_home_data():
    try:
        staff_list = []
        for u in User.objects():
            if u.role and u.role.department == 'Facilities':
                staff_list.append({
                    'id': str(u.id),
                    'user_id': u.user_id,
                    'name': u.name,
                    'email': u.email,
                    'role': u.role.name
                })

        rooms_data = []
        for r in Rooms.objects():
            rd_entries = RoomData.objects(room=r).order_by('time')
            timeseries = []
            for rd in rd_entries:
                timeseries.append({
                    'time': rd.time,
                    'occupancy': rd.occupancy,
                    'temperature': rd.temperature,
                    'ac': rd.ac,
                    'lights': rd.lights
                })

            rooms_data.append({
                'id': str(r.id),
                'room_id': r.room_id,
                'name': r.room_name,
                'timeseries': timeseries
            })

        return jsonify({
            'staff_list': staff_list,  
            'rooms': rooms_data,
            'current_role': session.get('role', 'Facilities Admin')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Booting up server and starting background tasks...")
    start_redis_listener()

    socketio.run(app, 
                host='0.0.0.0',  
                port=1767,       
                debug=False,
                allow_unsafe_werkzeug=True)
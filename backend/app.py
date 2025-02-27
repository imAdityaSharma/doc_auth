from flask import Flask, jsonify, request, session
from flask_cors import CORS
# from authlib.integrations.flask_client import OAuth
from datetime import datetime, timedelta, timezone
from flask_login import LoginManager, login_user
from database import db, create_app
from Users import BaseUser
import jwt
from flask_bcrypt import Bcrypt 
from routes.doctorapis import doctor_bp
from routes.patientapis import patient_bp
from routes.paraApis import para_bp
from utils.EmailServer import EmailServer
import secrets
from flask_session import Session  # Add this import
import redis
import os
import json
from flask_cors import cross_origin

app = create_app()
bcrypt_var = Bcrypt(app) 

# Configure Redis
redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
app.config.update(
    SESSION_TYPE='redis',
    SESSION_REDIS=redis.from_url(redis_url),
    SESSION_KEY_PREFIX='session:',
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    SECRET_KEY='987qwert65fyhh',
    SESSION_COOKIE_NAME='session_id',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # Set to True in production with HTTPS
    SESSION_COOKIE_SAMESITE='None',  # Changed from 'Lax' to 'None'
    SESSION_COOKIE_PATH='/',
    SESSION_COOKIE_DOMAIN=None,
)

# Initialize Flask-Session
Session(app)
# Define allowed origins
ALLOWED_ORIGINS = ["http://127.0.0.1:3000"]
# Configure CORS
CORS(app, 
     supports_credentials=True,
     origins=ALLOWED_ORIGINS,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials", 
                   "Accept", "Origin", "X-Requested-With", "Access-Control-Request-Method",
                   "Access-Control-Request-Headers", "Access-Control-Allow-Origin"])

# Store verification codes in Redis directly
redis_client = redis.from_url(redis_url)

app.register_blueprint(doctor_bp, url_prefix='/doc')
app.register_blueprint(patient_bp, url_prefix='/puser')
app.register_blueprint(para_bp, url_prefix='/para')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

email_server = EmailServer()

@login_manager.user_loader
def load_user(user_id):
    return BaseUser.query.get(int(user_id))


@app.route("/send-verification", methods=["POST", "OPTIONS"])
def send_verification():
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"success": True})
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Access-Control-Allow-Credentials'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '120'
        return response, 200
        
    try:
        data = request.get_json()
        email = data.get('email')        
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        # Check if email already exists
        existing_user = BaseUser.query.filter_by(primary_email=email).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409
            
        # Generate verification token
        verification_token = secrets.token_hex(3)  # 6-digit hex code
        
        # Store verification data in Redis with expiration
        verification_data = {
            'email': email,
            'token': verification_token,
            'expires': (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
        }
        # Use email as key in Redis
        redis_key = f"verification:{email}"
        redis_client.setex( redis_key, timedelta(minutes=30), json.dumps(verification_data))

        # Send verification email
        if email_server.send_verification_email(email, verification_token):
            return jsonify({
                "success": True,
                "message": "Verification code sent successfully",
                "email": email
            }), 200
        else:
            return jsonify({"error": "Failed to send verification email"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/verify-email", methods=["POST"])
def verify_email():
    try:    
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')
        
        if not email or not code:
            return jsonify({
                "success": False,
                "error": "Email and verification code are required"
            }), 400
            
        # Get verification data from Redis
        redis_key = f"verification:{email}"
        verification_data = redis_client.get(redis_key)
        
        if not verification_data:
            return jsonify({
                "success": False,
                "error": "No verification in progress. Please request a new code."
            }), 400
            
        verification = json.loads(verification_data)
        
        
        # Check expiration
        expiry_time = datetime.fromisoformat(verification['expires'].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) > expiry_time:
            redis_client.delete(redis_key)
            return jsonify({
                "success": False,
                "error": "Verification code has expired. Please request a new code."
            }), 400
            
        # Compare codes
        if verification['token'] != code:
            return jsonify({
                "success": False,
                "error": "Invalid verification code. Please try again."
            }), 400
            
        # Mark email as verified in Redis
        redis_client.setex( f"verified:{email}", timedelta(minutes=30), "true")
        
        return jsonify({
            "success": True,
            "message": "Email verified successfully",
            "email": email
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to verify email",
            "details": str(e)
        }), 500

@app.route("/register", methods=["POST"])
def register():
    if request.method == "POST":    
        try:
            
            data = request.get_json()

            if not data:
                return jsonify({"error": "Invalid request data"}), 400
            
            # Extract and validate all required fields
            required_fields = [
                'first_name', 
                'last_name', 
                'primary_email', 
                'password', 
                'role',
                'date_of_birth',
                'primary_contact',
                'aadhar_ssn'
            ]
            
            # Check for missing fields
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return jsonify({
                    "error": "Missing required fields",
                    "missing_fields": missing_fields
                }), 400

            email = data.get('primary_email')
            
            # Check if email is verified using Redis
            verified = redis_client.get(f"verified:{email}")
            if not verified:
                return jsonify({"error": "Email not verified"}), 400

            # Check if user already exists
            existing_user = BaseUser.query.filter_by(primary_email=email).first()
            if existing_user:
                return jsonify({"error": "User already exists"}), 409

            try:
                # Format date string to date object
                date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
                
                # Hash password
                hashed_password = bcrypt_var.generate_password_hash(data['password']).decode('utf-8')
                
                # Create new user
                new_user = BaseUser(
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    primary_email=email,
                    password_hash=hashed_password,
                    role=data['role'],
                    date_of_birth=date_of_birth,
                    primary_contact=data['primary_contact'],
                    aadhar_ssn=data['aadhar_ssn']
                )
                

                
                db.session.add(new_user)
                db.session.commit()
                # After successful registration, clear Redis keys
                redis_client.delete(f"verification:{email}")
                redis_client.delete(f"verified:{email}")
                
                return jsonify({
                    "success": True,
                    "message": "Registration successful",
                    "user": {
                        "email": new_user.primary_email,
                        "role": new_user.role
                    }
                }), 201
                
            except ValueError as ve:
                return jsonify({
                    "error": "Invalid date format. Please use YYYY-MM-DD"
                }), 400
                
            except Exception as db_error:
                db.session.rollback()
                
                return jsonify({"error": "Database error occurred"}), 500

        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Method not allowed"}), 405

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        # Handle the redirect from @login_required
        return jsonify({"error": "Authentication required"}), 401
        
    if request.method == "POST":
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
         
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Query the user
        user = BaseUser.query.filter_by(primary_email=email).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        elif not bcrypt_var.check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Create JWT token with user info
        token_data = {
            'user_id': user.id,
            'email': user.primary_email,
            'role': user.role,
            'exp': datetime.now(timezone.utc) + timedelta(days=1)  # Using timezone.utc instead of datetime.UTC
        }
        token = jwt.encode(token_data, str(app.config['SECRET_KEY']), algorithm='HS256')

        # Create session
        login_user(user)
        session['user_id'] = user.id
        session['email'] = user.primary_email
        session['role'] = user.role

        # Set redirect URL based on role
        if user.role == "patient":
            redirect_url = "/puser/dashboard"
        elif user.role == "doctor":
            redirect_url = "/duser/dashboard"
        elif user.role == "paramedic":
            redirect_url = "/parauser/dashboard"
        else:
            return jsonify({"error": "Invalid role"}), 400

        return jsonify({
            "success": True,
            "token": token,
            "message": "Login successful",
            "role": user.role,
            "redirect": redirect_url
        }), 200



    return jsonify({"error": "Method not allowed"}), 405

@app.route('/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == "OPTIONS":
        response = jsonify({"success": True})
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Access-Control-Allow-Credentials, Accept, Origin, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '120'
        return response, 200

    session.clear()
    response = jsonify({"message": "Successfully logged out"})
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response, 200

@app.route("/check-session", methods=['GET', 'OPTIONS'])
def check_session():
    if request.method == "OPTIONS":
        response = jsonify({"success": True})
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Access-Control-Allow-Credentials'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '120'
        return response, 200

    try:
        # Check if user is logged in via session
        if 'user_id' not in session:
            return jsonify({"authenticated": False}), 401

        # Get user from database
        user = BaseUser.query.get(session['user_id'])
        if not user:
            return jsonify({"authenticated": False}), 401

        return jsonify({
            "authenticated": True,
            "user": {
                "email": user.primary_email,
                "role": user.role,
                "redirect": f"/{user.role.lower()}user/dashboard"
            }
        }), 200

    except Exception as e:
        print(f"Session check error: {str(e)}")
        return jsonify({"authenticated": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

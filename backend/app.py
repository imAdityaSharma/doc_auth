from flask import Flask, jsonify, request, session
from flask_cors import CORS
# from authlib.integrations.flask_client import OAuth
from flask import send_from_directory, make_response
from datetime import datetime, timedelta, timezone
from flask_login import LoginManager, login_user
from database import db, create_app
from Users import BaseUser, Paramedic, Patient, Doctor
import jwt
from flask_bcrypt import Bcrypt 
from utils.EmailServer import EmailServer
import secrets
from flask_session import Session  # Add this import
import redis
import os
import json
from flask_cors import cross_origin
from decorators import pre_flight_cors
from decorators import token_required
import random
from routes.doctorapis import doctor_bp
from routes.patientapis import patient_bp
from routes.paraApis import para_bp
from routes.commonApis import comms_bp  
app = create_app()
bcrypt_var = Bcrypt(app) 

# Configure Redis
redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
redis_client = redis.from_url(redis_url)

app.config.update(
    SESSION_TYPE='redis',
    SESSION_REDIS=redis.from_url(redis_url),
    SESSION_KEY_PREFIX='session:',
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1),
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
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    #  allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
    #  expose_headers=["Access-Control-Allow-Origin"],
    #  max_age=120)

# Store verification codes in Redis directly


app.register_blueprint(doctor_bp, url_prefix='/doc')
app.register_blueprint(patient_bp, url_prefix='/puser')
app.register_blueprint(para_bp,url_prefix = "/para")
app.register_blueprint(comms_bp,url_prefix = "/comms")



login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

email_server = EmailServer()

@login_manager.user_loader
def load_user(user_id):
    return BaseUser.query.get(int(user_id))

@app.route("/send-verification", methods=["GET", "POST", "OPTIONS"])
def send_verification():
    # Handle preflight request
    if request.method == "OPTIONS":
        return pre_flight_cors()
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request format"}), 400
            
        email = data.get('email')
        is_password_change = data.get('isPasswordChange', False)
        is_forgot_password = data.get('isForgotPassword', False)
        
        # Validate email presence
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        # Check if email exists in the database
        existing_user = BaseUser.query.filter_by(primary_email=email).first()
        
        # For forgot password flow, email must exist but we don't tell the user
        if is_forgot_password:
            if not existing_user:
                # Return success even if email doesn't exist (security through obscurity)
                return jsonify({
                    "success": True,
                    "message": "If your email is registered, a verification code has been sent"
                }), 200
        
        # Generate verification token only if user exists
        if is_forgot_password:
            msg = "forgot_password"
        elif is_password_change:
            msg = "password_change"
        else:
            msg = "new_user"
        if existing_user:
            # Generate numeric OTP
            verification_token = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            # Store verification data with proper expiration
            expiration_minutes = 15
            verification_data = {
                'email': email,
                'token': verification_token,
                'purpose': msg,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)).isoformat(),
                'attempts': 0
            }
            
            # Use a unique key per verification request
            token_id = secrets.token_hex(8)
            redis_key = f"verification:{email}:{token_id}"
            
            # Store in Redis with expiration
            redis_client.setex(
                redis_key,
                timedelta(minutes=expiration_minutes),
                json.dumps(verification_data)
            )
            
            # Store the latest token_id for this email
            redis_client.set(f"latest_verification:{email}", token_id)
            
            # Send verification email
            if email_server.send_verification_email(email, verification_token, 'forgot_password' if is_forgot_password else 'changepassword'):
                return jsonify({
                    "success": True,
                    "message": "If your email is registered, a verification code has been sent"
                }), 200
            else:
                # Log the error but don't expose it to the user
                print(f"Failed to send verification email to {email}")
                return jsonify({
                    "success": True,
                    "message": "If your email is registered, a verification code has been sent"
                }), 200
        
        # Always return success for forgot password flow
        elif not existing_user:
            # Generate numeric OTP
            verification_token = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            # Store verification data with proper expiration
            expiration_minutes = 15
            verification_data = {
                'email': email,
                'token': verification_token,
                'purpose': msg,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)).isoformat(),
                'attempts': 0
            }
            
            # Use a unique key per verification request
            token_id = secrets.token_hex(8)
            redis_key = f"verification:{email}:{token_id}"
            
            # Store in Redis with expiration
            redis_client.setex(
                redis_key,
                timedelta(minutes=expiration_minutes),
                json.dumps(verification_data)
            )
            
            # Store the latest token_id for this email
            redis_client.set(f"latest_verification:{email}", token_id)
            
            # Send verification email
            if email_server.send_verification_email(email, verification_token,'new_user'):
                return jsonify({
                    "success": True,
                    "message": "A verification code has been sent"
                }), 200
            else:
                # Log the error but don't expose it to the user
                print(f"Failed to send verification email to {email}")
                return jsonify({
                    "success": True,
                    "message": "If your email is registered, a verification code has been sent"
                }), 200

        return jsonify({
            "success": True,
            "message": "If your email is registered, a verification code has been sent"
        }), 200
            
    except Exception as e:
        print(f"Error in send_verification: {str(e)}")  # Log the actual error
        return jsonify({
            "success": False,
            "message": "An error occurred. Please try again later."
        }), 500
@app.route("/verify-email", methods=["POST"])
def verify_email():
    try:    
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid request format"
            }), 400

        email = data.get('email')
        code = data.get('code')
        
        if not email or not code:
            return jsonify({
                "success": False,
                "error": "Email and verification code are required"
            }), 400
            
        # Get the latest token_id for this email
        token_id = redis_client.get(f"latest_verification:{email}")
        if not token_id:
            return jsonify({
                "success": False,
                "error": "No verification in progress. Please request a new code."
            }), 400

        # Get verification data using email and token_id
        redis_key = f"verification:{email}:{token_id.decode('utf-8')}"
        verification_data = redis_client.get(redis_key)
        
        if not verification_data:
            return jsonify({
                "success": False,
                "error": "Verification code has expired. Please request a new code."
            }), 400
            
        verification = json.loads(verification_data)
        
        # Check expiration
        expiry_time = datetime.fromisoformat(verification['expires_at'])
        if datetime.now(timezone.utc) > expiry_time:
            # Clean up expired data
            redis_client.delete(redis_key)
            redis_client.delete(f"latest_verification:{email}")
            return jsonify({
                "success": False,
                "error": "Verification code has expired. Please request a new code."
            }), 400
            
        # Check attempts
        max_attempts = 3
        if verification['attempts'] >= max_attempts:
            # Clean up after max attempts
            redis_client.delete(redis_key)
            redis_client.delete(f"latest_verification:{email}")
            return jsonify({
                "success": False,
                "error": "Maximum verification attempts exceeded. Please request a new code."
            }), 400

        # Update attempts
        verification['attempts'] += 1
        redis_client.setex(
            redis_key,
            timedelta(minutes=15),  # Reset expiration time
            json.dumps(verification)
        )
            
        # Compare codes
        if verification['token'] != code:
            return jsonify({
                "success": False,
                "error": "Invalid verification code. Please try again."
            }), 400
            
        # Get verification purpose
        purpose = verification.get('purpose', 'email_verification')
        
        # Mark email as verified in Redis with purpose
        verified_data = {
            'email': email,
            'purpose': purpose,
            'verified_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Store verification status with expiration
        redis_client.setex(
            f"verified:{email}:{purpose}",
            timedelta(minutes=30),
            json.dumps(verified_data)
        )
        
        # Clean up verification data
        redis_client.delete(redis_key)
        redis_client.delete(f"latest_verification:{email}")
        
        return jsonify({
            "success": True,
            "message": "Email verified successfully",
            "email": email,
            "purpose": purpose
        }), 200
        
    except Exception as e:
        print(f"Error in verify_email: {str(e)}")  # Log the error
        return jsonify({
            "success": False,
            "error": "An error occurred. Please try again later."
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
                if data['role']=='patient':
                    new_user = Patient(
                        first_name=data['first_name'],
                        last_name=data['last_name'],
                        primary_email=email,
                        password_hash=hashed_password,
                        role=data['role'],
                        date_of_birth=date_of_birth,
                        primary_contact=data['primary_contact'],
                        aadhar_ssn=data['aadhar_ssn'],
                        weight=data['weight'],
                        medications=data['medical_history'],
                        allergies=data['allergies']
                    )
                elif data['role']=='paramedic':
                    new_user = Paramedic(
                        first_name=data['first_name'],
                        last_name=data['last_name'],
                        primary_email=email,
                        password_hash=hashed_password,
                        role=data['role'],
                        date_of_birth=date_of_birth,
                        primary_contact=data['primary_contact'],
                        aadhar_ssn=data['aadhar_ssn'],
                        emt_certification_number=data['emt_license'],
                        als_bls_training = data['als_bls_training'],
                        years_experience=data['years_of_experience'],
                        additional_certifications=data['additional_certifications'],
                    )
                elif data['role']=='doctor':
                    new_user = Doctor(
                            first_name=data['first_name'],
                            last_name=data['last_name'],
                            primary_email=email,
                            password_hash=hashed_password,
                            role=data['role'],
                            date_of_birth=date_of_birth,
                            primary_contact=data['primary_contact'],
                            aadhar_ssn=data['aadhar_ssn'],
                            medical_license=data['license_number'],
                            specialty=data['specialization'],
                            years_experience=float(data['years_of_experience']),
                            organization=data['hospital_affiliation'],
                        )
                else:
                    return jsonify({"message":"invalid role"}), 404

                
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
                print(db_error)
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
@cross_origin(supports_credentials=True)
def logout():
    if request.method == "OPTIONS":
        return pre_flight_cors()

    try:
        # Get session ID from cookie
        session_id = request.cookies.get('session_id')
        
        # Get user info before clearing session
        user_id = session.get('user_id')
        email = session.get('email')

        # Clear Flask session
        session.clear()

        # Clear Redis session using session ID
        if session_id:
            redis_key = f"session:{session_id}"
            redis_client.delete(redis_key)
            print(f"Deleted Redis session key: {redis_key}")

        # Clear all sessions for this user (optional, if you want to logout from all devices)
        if user_id:
            user_sessions_pattern = f"*{user_id}*"
            for key in redis_client.scan_iter(match=user_sessions_pattern):
                redis_client.delete(key)
                print(f"Deleted additional Redis key: {key}")

        # Clear any email verification data
        if email:
            redis_client.delete(f"verification:{email}")
            redis_client.delete(f"verified:{email}")

        # Prepare response
        response = jsonify({
            "status": "success",
            "message": "Successfully logged out"
        })

        # Clear cookies
        response.delete_cookie('session_id', path='/', domain=None)
        response.delete_cookie('remember_token', path='/', domain=None)
        
        # Set CORS headers
        response.headers.update({
            'Access-Control-Allow-Origin': request.origin or 'http://127.0.0.1:3000',
            'Access-Control-Allow-Credentials': 'true'
        })

        print("Logout successful")
        return response, 200

    except Exception as e:
        print(f"Logout error: {str(e)}")
        # Try to clear session even if there's an error
        try:
            session.clear()
        except:
            pass
        
        return jsonify({
            "status": "error",
            "message": "Error during logout"
        }), 500

@app.route("/check-session", methods=['GET', 'OPTIONS'])
def check_session():
    if request.method == "OPTIONS":
        return pre_flight_cors()

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
    

@app.route('/uploads/<path:filename>')
@token_required
def uploaded_file(filename):
    try:
        if '..' in filename or filename.startswith('/'):
            return jsonify({"error": "Invalid file path"}), 403
            
        if not filename.startswith('profile_pics/'):
            return jsonify({"error": "Access denied"}), 403

        # Get the file path
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404

        # Send file with cache control headers
        response = make_response(send_from_directory(app.config['UPLOAD_FOLDER'], filename))
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    except Exception as e:
        print(f"Error serving file: {str(e)}")
        return jsonify({"error": "File not found"}), 404

@app.route("/password_change", methods=['POST'])
def password_change():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request data"}), 400

        # Extract required fields
        email = data.get('email')
        new_password = data.get('newPassword')
        
        # Validate required fields
        if not email or not new_password:
            return jsonify({
                "error": "Missing required fields",
                "details": "Email and new password are required"
            }), 400

        # Check if user exists
        existing_user = BaseUser.query.filter_by(primary_email=email).first()
        if not existing_user:
            return jsonify({"error": "User not found"}), 404

        # Check if email was verified for password change
        verified_key = f"verified:{email}:forgot_password"
        verification_data = redis_client.get(verified_key)
        
        if not verification_data:
            return jsonify({
                "error": "Email verification required",
                "details": "Please verify your email before changing password"
            }), 403

        # Validate password requirements
        if len(new_password) < 8:
            return jsonify({
                "error": "Invalid password",
                "details": "Password must be at least 8 characters long"
            }), 400

        try:
            # Hash new password
            hashed_password = bcrypt_var.generate_password_hash(new_password).decode('utf-8')
            
            # Update user's password
            existing_user.password_hash = hashed_password
            db.session.commit()
            
            # Clear all verification and session data for security
            redis_client.delete(verified_key)
            redis_client.delete(f"verified:{email}:*")
            
            # Clear any active sessions for this user
            user_sessions_pattern = f"session:*:{existing_user.id}:*"
            for key in redis_client.scan_iter(match=user_sessions_pattern):
                redis_client.delete(key)
            
            return jsonify({
                "success": True,
                "message": "Password updated successfully. Please login with your new password."
            }), 200
                
        except Exception as db_error:
            print(f"Database error in password_change: {str(db_error)}")
            db.session.rollback()
            return jsonify({
                "error": "Failed to update password",
                "details": "A database error occurred"
            }), 500

    except Exception as e:
        print(f"Error in password_change: {str(e)}")
        return jsonify({
            "error": "An unexpected error occurred",
            "details": "Please try again later"
        }), 500







def is_rate_limited(email):
    """Check if the email is being rate limited for verification requests"""
    rate_limit_key = f"rate_limit:verification:{email}"
    count = redis_client.get(rate_limit_key)
    
    if count is None:
        # First request in the window
        redis_client.setex(rate_limit_key, 3600, 1)  # 1 hour window
        return False
        
    count = int(count)
    if count >= 5:  # Max 5 verification emails per hour
        return True
        
    # Increment the counter
    redis_client.incr(rate_limit_key)
    return False



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

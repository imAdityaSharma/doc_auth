from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.urls import quote
import os
from authlib.integrations.flask_client import OAuth
from datetime import datetime, timedelta
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from database import db, create_app
from Users import BaseUser
from flask_migrate import Migrate
import bcrypt
import uuid
import jwt
from functools import wraps
salt = bcrypt.gensalt()
app = create_app()

CORS(app, supports_credentials=True,
     resources={
         r"/*": {
             "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin"],
             "expose_headers": ["Access-Control-Allow-Origin"],
             "supports_credentials": True
         }
     })  # Allow React frontend

app.config['SECRET_KEY'] = '987qwert65fyhh'

# oauth = OAuth(app)    


login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(user_id):
    return BaseUser.query.get(int(user_id))

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "Invalid request"}), 400
            
            # Print raw data to see exact structure
            print("Raw registration data:", data)
            
            role = data.get("role")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            email = data.get("primary_email")  # Changed from "email" to "primary_email"
            password = data.get("password")
            dob = data.get("date_of_birth")
            primary_contact = data.get("primary_contact")
            aadhar_ssn = data.get("aadhar_ssn")
            
            # Patient specific fields
            # if role == "patient":
            #     blood_group = data.get("blood_group")
            #     height = data.get("height") 
            #     weight = data.get("weight")
            #     allergies = data.get("allergies")
            #     current_medications = data.get("current_medications")
            #     past_medications = data.get("past_medications")
            #     chronic_conditions = data.get("chronic_conditions")
            #     injuries = data.get("injuries")
            #     surgeries = data.get("past_surgeries")
                
            #     # Add patient specific fields to new_user
            #     new_user.blood_group = blood_group
            #     new_user.height = height
            #     new_user.weight = weight
            #     new_user.allergies = allergies
            #     new_user.current_medications = current_medications
            #     new_user.past_medications = past_medications
            #     new_user.chronic_conditions = chronic_conditions
            #     new_user.injuries = injuries
            #     new_user.past_surgeries = surgeries
            
            # Print individual fields
            # print("Parsed fields:", {
            #     'role': role,
            #     'first_name': first_name,
            #     'last_name': last_name,
            #     'email': email,
            #     'password': password
            # })
            
            # Validate required fields
            if not all([role, first_name, last_name, email, password]):
                missing_fields = {
                    'role': role is None,
                    'first_name': first_name is None,
                    'last_name': last_name is None,
                    'email': email is None,
                    'password': password is None
                }
                print("Missing or empty fields:", missing_fields)
                return jsonify({"error": "All fields are required", "missing_fields": missing_fields}), 400

            # Check if user already exists
            existing_user = BaseUser.query.filter_by(primary_email=email).first()
            if existing_user:
                print(f"User with email {email} already exists")
                return jsonify({"error": "User already exists"}), 409

            # Fix the password hashing
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
            
            new_user = BaseUser(
                first_name=first_name,
                last_name=last_name,
                primary_email=email,
                password_hash=hashed_password,  # This should now be proper bytes
                role=role
            )
            
            print("Attempting to add new user to database:", {
                'email': new_user.primary_email,
                'first_name': new_user.first_name,
                'role': new_user.role
            })
            
            try:
                db.session.add(new_user)
                db.session.commit()
                print("User successfully added to database")
            except Exception as db_error:
                db.session.rollback()
                print("Database error:", str(db_error))
                return jsonify({"error": "Database error occurred"}), 500

            return jsonify({"success": True, "message": "Registration successful"}), 201

        except Exception as e:
            print("Registration error:", str(e))
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
        password = bcrypt.hashpw(password.encode('utf-8'), salt)
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Query the user
        user = BaseUser.query.filter_by(primary_email=email).first()
        print("Hashed password:", password)
        print("Password:", user.password_hash)
        
        # Add debug prints to see what we're comparing
        # if user:
        #     print("Login password:", password)
        #     print("Stored hash from DB:", user.password_hash)
        #     print("New hash of login password:", bcrypt.hashpw(password.encode('utf-8'), user.password_hash))
        #     print("Password verification result:", bcrypt.checkpw(password.encode('utf-8'), user.password_hash))

        if not user or not password == user.password_hash:
            return jsonify({"error": "Invalid credentials"}), 401

        # Create JWT token with user info
        token_data = {
            'user_id': user.id,
            'email': user.primary_email,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=1)  # Use UTC time for expiration
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

        # except Exception as e:
        #     return jsonify({"error": str(e)}), 500

    return jsonify({"error": "Method not allowed"}), 405

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    response = jsonify({"message": "Successfully logged out"})
    response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


@app.route("/duser/dashboard")
@app.route("/parauser/dashboard")
@login_required
def dashboard():
    user_data = {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "date_of_birth": current_user.date_of_birth.strftime('%Y-%m-%d') if current_user.date_of_birth else None,
        "house_no": current_user.house_no,
        "apartment": current_user.apartment,
        "colony": current_user.colony,
        "city": current_user.city,
        "pin_code": current_user.pin_code,
        "state": current_user.state,
        "primary_contact": current_user.primary_contact,
        "recovery_contact": current_user.recovery_contact,
        "primary_email": current_user.primary_email,
        "recovery_email": current_user.recovery_email,
        "aadhar_ssn": current_user.aadhar_ssn,
        "profile_pic": current_user.profile_pic,
        "role": current_user.role
    }

    # Add patient-specific data if user is a patient
    if current_user.role == 'patient':
        user_data.update({
            "allergies": current_user.allergies,
            "chronic_conditions": current_user.chronic_conditions,
            "medications": current_user.medications,
            "past_surgeries": current_user.past_surgeries,
            "medical_docs": current_user.medical_docs,
            "weight": current_user.weight,
            "height": current_user.height,
            "blood_pressure": current_user.blood_pressure,
            "blood_glucose": current_user.blood_glucose,
            "additional_metrics": current_user.additional_metrics
        })

    return jsonify(user_data), 200

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, str(app.config['SECRET_KEY']), algorithms=["HS256"])
            current_user = BaseUser.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated

@app.route('/puser/dashboard', methods=['GET'])
@token_required
def get_patient_dashboard():
    try:
        # Get token data
        token = request.headers['Authorization'].split(" ")[1]
        data = jwt.decode(token, str(app.config['SECRET_KEY']), algorithms=["HS256"])
        current_user = BaseUser.query.get(data['user_id'])

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        patient_data = {
            "name": f"{current_user.first_name} {current_user.last_name}",
            "email": current_user.primary_email,
            "role": current_user.role,
            "upcomingAppointments": [],  # TODO: Query appointments table
            "recentPrescriptions": []  # TODO: Query prescriptions table
        }
        
        response = jsonify(patient_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": "Failed to fetch dashboard data"}), 500

# @app.route("/api/messages", methods=["GET"])
# def func():
#     return jsonify({"message": "This is a beckend message!"})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

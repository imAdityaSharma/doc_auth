from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.urls import quote
import os
from authlib.integrations.flask_client import OAuth
from datetime import datetime, timedelta, timezone
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from database import db, create_app
from Users import BaseUser
from flask_migrate import Migrate
from decorators import token_required
import uuid
import jwt
from functools import wraps
from flask_bcrypt import Bcrypt 
from routes.doctorapis import doctor_bp
from routes.patientapis import patient_bp
from routes.paraApis import para_bp


app = create_app()
bcrypt = Bcrypt(app) 

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

app.register_blueprint(doctor_bp, url_prefix='/doc')
app.register_blueprint(patient_bp, url_prefix='/puser')
app.register_blueprint(para_bp, url_prefix='/para')



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
            
            # Print individual fields
            print("Parsed fields:", {
                'role': role,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'password': password,
                'date_of_birth': dob,
                'primary_contact': primary_contact,
                'aadhar_ssn': aadhar_ssn
            })
            
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
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            
            new_user = BaseUser(
                first_name=first_name,
                last_name=last_name,
                primary_email=email,
                password_hash=hashed_password,
                role=role,
                date_of_birth=dob,
                primary_contact=primary_contact,
                aadhar_ssn=aadhar_ssn
            )
            
            print("Attempting to add new user to database:", {
                'email': new_user.primary_email,
                'first_name': new_user.first_name,
                'role': new_user.role,
                'date_of_birth': new_user.date_of_birth,
                'primary_contact': new_user.primary_contact,
                'aadhar_ssn': new_user.aadhar_ssn
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
         
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Query the user
        user = BaseUser.query.filter_by(primary_email=email).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        elif not bcrypt.check_password_hash(user.password_hash, password):
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



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

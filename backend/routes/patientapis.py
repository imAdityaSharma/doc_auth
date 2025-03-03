from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient
from database import db
from flask_login import current_user, login_required
from functools import wraps
import jwt
from flask import current_app
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from decorators import token_required
from sqlalchemy import text

patient_bp = Blueprint('patient', __name__)


@patient_bp.route('/dashboard', methods=['GET'])
@token_required
def get_patient_dashboard():
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token
            data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
            current_user = Patient.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({"error": "User not found"}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        patient_data = {
            "name": f"{current_user.first_name} {current_user.last_name}",
            "email": current_user.primary_email,
            "role": current_user.role,
            "profile_pic": current_user.profile_pic if current_user.profile_pic else None,
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



@patient_bp.route('/profile_update', methods=['POST','GET'])
@token_required
def profile_update():
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(" ")[1]
        
        # Verify token
        data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
        user_id = data.get('user_id')
        
        # Get current user first
        current_user = BaseUser.query.get(user_id)
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        if request.method == 'POST':
            try:
                profile_data = request.form.to_dict()
                print("Profile data received:", profile_data)  # Debug print
                
                profile_pic = request.files.get('profile_pic')
                profile_pic_path = None
                
                # Handle profile picture upload
                if profile_pic:
                    filename = secure_filename(f"{user_id}_{datetime.now().timestamp()}_{profile_pic.filename}")
                    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pics')
                    os.makedirs(upload_folder, exist_ok=True)
                    file_path = os.path.join(upload_folder, filename)
                    profile_pic.save(file_path)
                    profile_pic_path = f"/uploads/profile_pics/{filename}"

                # Prepare parameters ensuring required fields are never null
                base_params = {
                    'user_id': user_id,
                    'first_name': profile_data.get('first_name') or current_user.first_name,
                    'last_name': profile_data.get('last_name') or current_user.last_name,
                    'primary_email': profile_data.get('primary_email') or current_user.primary_email,
                    'primary_contact': profile_data.get('primary_contact') or current_user.primary_contact,
                    'password_hash': current_user.password_hash,
                    'role': current_user.role,
                    'date_of_birth': profile_data.get('date_of_birth', current_user.date_of_birth),
                    'house_no': profile_data.get('house_no', current_user.house_no),
                    'apartment': profile_data.get('apartment', current_user.apartment),
                    'colony': profile_data.get('colony', current_user.colony),
                    'city': profile_data.get('city', current_user.city),
                    'pin_code': profile_data.get('pin_code', current_user.pin_code),
                    'state': profile_data.get('state', current_user.state),
                    'profile_pic': profile_pic_path if profile_pic_path else current_user.profile_pic,
                    'aadhar_ssn': current_user.aadhar_ssn
                }

                print("Parameters for update:", base_params)  # Debug print

                # Update BaseUser table
                base_user_update = text("""
                    UPDATE base_users 
                    SET first_name = :first_name,
                        last_name = :last_name,
                        primary_email = :primary_email,
                        primary_contact = :primary_contact,
                        password_hash = :password_hash,
                        role = :role,
                        date_of_birth = :date_of_birth,
                        house_no = :house_no,
                        apartment = :apartment,
                        colony = :colony,
                        city = :city,
                        pin_code = :pin_code,
                        state = :state,
                        profile_pic = :profile_pic,
                        aadhar_ssn = :aadhar_ssn
                    WHERE id = :user_id AND role = 'patient'
                    RETURNING *
                """)

                base_result = db.session.execute(base_user_update, base_params)
                db.session.commit()

                return jsonify({
                    "message": "Profile updated successfully",
                    "user": {
                        "first_name": base_params['first_name'],
                        "last_name": base_params['last_name'],
                        "primary_email": base_params['primary_email'],
                        "primary_contact": base_params['primary_contact'],
                        "profile_pic": base_params['profile_pic'],
                        "date_of_birth": base_params['date_of_birth'].strftime('%Y-%m-%d') if isinstance(base_params['date_of_birth'], datetime) else base_params['date_of_birth'],
                        "address": {
                            "house_no": base_params['house_no'],
                            "apartment": base_params['apartment'],
                            "colony": base_params['colony'],
                            "city": base_params['city'],
                            "pin_code": base_params['pin_code'],
                            "state": base_params['state']
                        }
                    }
                }), 200

            except Exception as e:
                db.session.rollback()
                print(f"Profile update error: {str(e)}")
                return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500

        elif request.method == 'GET':
            # Handle GET request
            return jsonify({"message": "GET method not implemented"}), 501

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token
            data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
            user_id = data.get('user_id')
            
            # First query BaseUser to ensure user exists
            base_user = BaseUser.query.get(user_id)
            if not base_user or base_user.role != 'patient':
                return jsonify({"error": "User not found or invalid role"}), 404

            # Then query Patient table with the same ID
            current_user = Patient.query.filter_by(id=user_id).first()
            if not current_user:
                # If patient record doesn't exist, create one
                current_user = Patient(id=user_id)
                db.session.add(current_user)

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        if  request.method == 'POST':            
            # Handle form data and file upload
            print("profile data")
            
            print("Profile data received:", profile_data)
            try:
                profile_data = request.form.to_dict()
                profile_pic = request.files.get('profile_pic')
                
                # Handle profile picture upload if provided
                if profile_pic:
                    filename = secure_filename(f"{user_id}_{datetime.now().timestamp()}_{profile_pic.filename}")
                    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pics')
                    os.makedirs(upload_folder, exist_ok=True)
                    file_path = os.path.join(upload_folder, filename)
                    profile_pic.save(file_path)
                    profile_pic_path = f"/uploads/profile_pics/{filename}"

                # Update BaseUser fields
                base_user_update = text("""
                UPDATE base_users 
                SET first_name = COALESCE(:first_name, first_name),
                    last_name = COALESCE(:last_name, last_name),
                    primary_contact = COALESCE(:primary_contact, primary_contact),
                    primary_email = COALESCE(:primary_email, primary_email),
                    password_hash = COALESCE(:password_hash, password_hash),
                    role = COALESCE(:role, role),
                    date_of_birth = COALESCE(:date_of_birth, date_of_birth),
                    house_no = COALESCE(:house_no, house_no),
                    apartment = COALESCE(:apartment, apartment),
                    colony = COALESCE(:colony, colony),
                    city = COALESCE(:city, city),
                    pin_code = COALESCE(:pin_code, pin_code),
                    state = COALESCE(:state, state),
                    profile_pic = COALESCE(:profile_pic, profile_pic),
                    aadhar_ssn = COALESCE(:aadhar_ssn, aadhar_ssn)
                WHERE id = :user_id AND role = 'patient'
                RETURNING *
                """)


                base_params = {
                'user_id': user_id,
                'first_name': profile_data.get('first_name', current_user.first_name),
                'last_name': profile_data.get('last_name', current_user.last_name),
                'primary_contact': profile_data.get('primary_contact', current_user.primary_contact),
                'primary_email': profile_data.get('primary_email', current_user.primary_email),
                'password_hash': current_user.password_hash,  # Preserve existing password
                'role': current_user.role,  # Preserve existing role
                'date_of_birth': profile_data.get('date_of_birth', current_user.date_of_birth),
                'house_no': profile_data.get('house_no', current_user.house_no),
                'apartment': profile_data.get('apartment', current_user.apartment),
                'colony': profile_data.get('colony', current_user.colony),
                'city': profile_data.get('city', current_user.city),
                'pin_code': profile_data.get('pin_code', current_user.pin_code),
                'state': profile_data.get('state', current_user.state),
                'profile_pic': profile_pic_path if profile_pic_path else current_user.profile_pic,
                'aadhar_ssn': current_user.aadhar_ssn  # Preserve existing SSN
            }

                
                try:
                    base_result = db.session.execute(base_user_update, base_params)
                    db.session.commit()
        

                    return jsonify({
                            "message": "Profile updated successfully"                   }), 200
                except Exception as e:
                    db.session.rollback()
                    print(f"Database update error: {str(e)}")
                    return jsonify({"error": "Failed to update profile"}), 500

    

            except Exception as e:
                print(f"Profile update error: {str(e)}")
                return jsonify({"error": "Failed to update profile"}), 500
    except Exception as e:
                # print(f"Profile update error: {str(e)}")
                return jsonify({"error": "Method not allowed"}), 500

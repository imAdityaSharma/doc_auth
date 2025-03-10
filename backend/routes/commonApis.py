from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient, Paramedic

import jwt
from flask import current_app

import os

from decorators import token_required
from werkzeug.utils import secure_filename
from database import db
from sqlalchemy import text
from datetime import datetime
import redis


redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
redis_client = redis.from_url(redis_url)
comms_bp = Blueprint('comms', __name__)

@comms_bp.route("/filldata", methods = ['GET'])
@token_required
def fill_data():
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token
            data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
            current_user = BaseUser.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({"error": "User not found"}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        User_data = {
            "name": current_user.first_name,
            "email": current_user.primary_email,
            "primary_contact": current_user.primary_contact,
	        "last_name": current_user.last_name,
	        "date_of_birth":current_user.date_of_birth,
	        "house_no":current_user.house_no,
            "apartment":current_user.apartment,
            "colony":current_user.colony,
            "city": current_user.city ,
            "pin_code":current_user.pin_code,
            "state":current_user.state ,
            "primary_email":current_user.primary_email,
            "aadhar_ssn":current_user.aadhar_ssn ,
            "profile_pic": current_user.profile_pic,
        }
        
        response = jsonify(User_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": "Failed to fetch data"}), 500


@comms_bp.route('/profile_pic_update', methods=['POST'])
@token_required
def profile_pic_update():

    try:
        # Get current user
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
        
        # Get user with the correct model based on role
        user_role = data.get('role', '')
        user_id = data.get('user_id')
        
        if user_role == 'patient':
            current_user = Patient.query.get(user_id)
        elif user_role == 'doctor':
            current_user = Doctor.query.get(user_id)
        elif user_role == 'paramedic':
            current_user = Paramedic.query.get(user_id)
        else:
            return jsonify({"message":"invalid User"})

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        profile_data = request.form.to_dict()

        # Handle profile picture upload
        if 'profile_pic' in request.files:
            profile_pic = request.files['profile_pic']
            if profile_pic:
                # Remove old profile picture if it exists
                if current_user.profile_pic:
                    old_file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pics', current_user.profile_pic.split('/')[-1])
                    print(old_file_path)
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)

                filename = secure_filename(f"{user_id}_{datetime.now().timestamp()}_{profile_pic.filename}")
                upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profile_pics')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                profile_pic.save(file_path)
                current_user.profile_pic = f"/uploads/profile_pics/{filename}"
                

        try:
            # Commit changes
            db.session.commit()
            return jsonify({
                "message": "Profile updated successfully"
            }), 200

        except Exception as db_error:
            db.session.rollback()
            print(f"Database error: {str(db_error)}")
            raise

    except Exception as e:
        print(f"Profile update error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@comms_bp.route('/user_data_update', methods=['POST'])
@token_required
def profile_update():

    try:
        # Get current user
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
        
        # Get user with the correct model based on role
        user_role = data.get('role', '')
        user_id = data.get('user_id')
        
        if user_role == 'patient':
            current_user = Patient.query.get(user_id)
        elif user_role == 'doctor':
            current_user = Doctor.query.get(user_id)
        elif user_role == 'paramedic':
            current_user = Paramedic.query.get(user_id)
        else:
            current_user = BaseUser.query.get(user_id)

        if not current_user:
            return jsonify({"error": "User not found"}), 404

        profile_data = request.form.to_dict()
        print("Received profile data:", profile_data)
        
        # Check if email is being changed
        new_email = profile_data.get('primary_email')
        if new_email and new_email != current_user.primary_email:
            verification_key = f"verification:{new_email}"
            verification_data = redis_client.get(verification_key)
            
            if not verification_data:
                return jsonify({
                    "error": "Email verification required for new email address"
                }), 400
                
            redis_client.delete(verification_key)

        # Update user fields
        current_user.first_name = profile_data.get('first_name', current_user.first_name)
        current_user.last_name = profile_data.get('last_name', current_user.last_name)
        current_user.primary_email = profile_data.get('primary_email', current_user.primary_email)
        current_user.primary_contact = profile_data.get('primary_contact', current_user.primary_contact)
        
        if dob := profile_data.get('date_of_birth'):
            try:
                current_user.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
            except ValueError:
                print(f"Invalid date format: {dob}")

        current_user.house_no = profile_data.get('house_no', current_user.house_no)
        current_user.apartment = profile_data.get('apartment', current_user.apartment)
        current_user.colony = profile_data.get('colony', current_user.colony)
        current_user.city = profile_data.get('city', current_user.city)
        current_user.pin_code = profile_data.get('pin_code', current_user.pin_code)
        current_user.state = profile_data.get('state', current_user.state)

        try:
            # Commit changes
            db.session.commit()
            return jsonify({
                "message": "Profile updated successfully"
            }), 200

        except Exception as db_error:
            db.session.rollback()
            print(f"Database error: {str(db_error)}")
            raise

    except Exception as e:
        print(f"Profile update error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
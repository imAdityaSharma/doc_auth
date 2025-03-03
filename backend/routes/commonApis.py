from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient

import jwt
from flask import current_app

import os

from decorators import token_required

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

        patient_data = {
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
        
        response = jsonify(patient_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": "Failed to fetch data"}), 500
    

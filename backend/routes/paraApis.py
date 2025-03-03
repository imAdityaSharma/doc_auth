from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient, Paramedic
from database import db
import jwt
from flask import current_app
from decorators import token_required

para_bp = Blueprint('para', __name__)



@para_bp.route('/paraDashboard', methods=['GET'])
@token_required
def paraDashboard():
    # Get the Authorization header
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token
            data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
            current_user = Paramedic.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({"error": "User not found"}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        para_data = {
            "first_name": current_user.first_name,
            "last_name":current_user.last_name,
            "email": current_user.primary_email,
            "role": current_user.role,
            "primary_contact":current_user.primary_contact,
            "dob":current_user.date_of_birth,
            "upcomingAppointments": [],  # Query appointments table
            "recentPrescriptions": []    # Query prescriptions table
        }
        
        response = jsonify(para_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": "Failed to fetch dashboard data"}), 500

    

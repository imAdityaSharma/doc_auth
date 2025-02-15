from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient
from database import db
from flask_login import current_user, login_required
from functools import wraps
import jwt
from flask import current_app
from decorators import token_required

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/dashboard', methods=['GET'])
@token_required
def get_patient_dashboard():
    try:
        # Get token data
        token = request.headers['Authorization'].split(" ")[1]
        data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
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
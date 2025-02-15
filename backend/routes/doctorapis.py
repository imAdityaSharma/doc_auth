from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient
from database import db
from flask_login import current_user, login_required
import jwt
from flask import current_app
from decorators import token_required

doctor_bp = Blueprint('doctor', __name__)



@doctor_bp.route('/docDashboard', methods=['GET'])
@token_required
def docDashboard():
    # Get the Authorization header
    token = request.headers['Authorization'].split(" ")[1]
    data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
    doctor_id = data['user_id']
    
    # Query the doctor's appointments
    try:
        doctor = BaseUser.query.filter_by(id=doctor_id).first()
        
        if not doctor:
            return jsonify({"error": "Doctor not found"}), 404

        doctor_data = {
            "id": doctor.id,
            "first_name": doctor.first_name,
            "last_name": doctor.last_name,
            "primary_email": doctor.primary_email,
            "primary_contact": doctor.primary_contact,
            # "specialization": doctor.specialization,
            # "experience": doctor.experience,
            # "hospital": doctor.hospital,
            # "availability": doctor.availability
        }
        response = jsonify(doctor_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

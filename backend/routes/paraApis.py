from flask import Blueprint, request, jsonify
from Users import BaseUser, Doctor, Patient, Paramedic
from database import db
import jwt
from flask import current_app
from decorators import token_required

para_bp = Blueprint('paramedic', __name__)



@para_bp.route('/paraDashboard', methods=['GET'])
@token_required
def paraDashboard():
    # Get the Authorization header
    token = request.headers['Authorization'].split(" ")[1]
    data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
    paramedic_id = data['user_id']
    
    # Query the doctor's appointments
    try:
        paramedic = BaseUser.query.filter_by(id=paramedic_id).first()
        
        if not paramedic:
            return jsonify({"error": "Paramedic not found"}), 404

        paramedic_data = {
            "id": paramedic.id,
            "first_name": paramedic.first_name,
            "last_name": paramedic.last_name,
            "primary_email": paramedic.primary_email,
            "primary_contact": paramedic.primary_contact,
            # "specialization": doctor.specialization,
            # "experience": doctor.experience,
            # "hospital": doctor.hospital,
            # "availability": doctor.availability
        }
        response = jsonify(paramedic_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

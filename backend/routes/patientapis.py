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
import json

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

        # Prepare patient health data
        patient_data = {
            "name": f"{current_user.first_name} {current_user.last_name}",
            "email": current_user.primary_email,
            "role": current_user.role,
            "profile_pic": current_user.profile_pic if current_user.profile_pic else None,
            "weight": current_user.weight,
            "height": current_user.height,
            "bloodPressure": current_user.blood_pressure,
            "bloodGlucose": current_user.blood_glucose,
            "chronic_conditions": current_user.chronic_conditions,
            "medications": current_user.medications,
            "past_surgeries": current_user.past_surgeries,
            "allergies": current_user.allergies,
            "additional_metrics": current_user.additional_metrics,
            "medical_docs": current_user.medical_docs,
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


@patient_bp.route('/update-healthmetrics', methods=['POST','GET'])
@token_required
def health_metrics():
    
    if request.method == 'POST':
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
            else:
                return jsonify({"error": "Only patients can update health metrics"}), 403

            if not current_user:
                return jsonify({"error": "User not found"}), 404

            profile_data = request.form.to_dict()
            print("Received profile data:", profile_data)
            
            print ("data updater 1")
            # Process basic health metrics
            current_user.weight = float(profile_data.get('weight', current_user.weight))
            current_user.height = float(profile_data.get('height', current_user.height))
            current_user.blood_pressure = profile_data.get('bloodPressure', current_user.blood_pressure)
            current_user.blood_glucose = profile_data.get('bloodGlucose', current_user.blood_glucose)
            
            print ("data updater 2")
            # Process list-based health metrics stored as JSON strings
            if 'chronic_conditions' in profile_data:
                try:
                    # Validate that it's proper JSON
                    json.loads(profile_data['chronic_conditions'])
                    current_user.chronic_conditions = profile_data['chronic_conditions']
                except json.JSONDecodeError:
                    print(f"Invalid JSON for chronic_conditions: {profile_data['chronic_conditions']}")
                    # Keep existing data if JSON is invalid
            
            if 'medications' in profile_data:
                try:
                    json.loads(profile_data['medications'])
                    current_user.medications = profile_data['medications']
                except json.JSONDecodeError:
                    print(f"Invalid JSON for medications: {profile_data['medications']}")
            
            if 'past_surgeries' in profile_data:
                try:
                    json.loads(profile_data['past_surgeries'])
                    current_user.past_surgeries = profile_data['past_surgeries']
                except json.JSONDecodeError:
                    print(f"Invalid JSON for past_surgeries: {profile_data['past_surgeries']}")
            
            if 'allergies' in profile_data:
                try:
                    json.loads(profile_data['allergies'])
                    current_user.allergies = profile_data['allergies']
                except json.JSONDecodeError:
                    print(f"Invalid JSON for allergies: {profile_data['allergies']}")
            
            if 'additional_metrics' in profile_data:
                try:
                    json.loads(profile_data['additional_metrics'])
                    current_user.additional_metrics = profile_data['additional_metrics']
                except json.JSONDecodeError:
                    print(f"Invalid JSON for additional_metrics: {profile_data['additional_metrics']}")

            # Handle medical document upload
            if 'medicalDocs' in request.files:
                medical_doc = request.files['medicalDocs']
                if medical_doc:
                    filename = secure_filename(f"med_doc_{user_id}_{datetime.now().timestamp()}_{medical_doc.filename}")
                    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'medical_docs')
                    os.makedirs(upload_folder, exist_ok=True)
                    file_path = os.path.join(upload_folder, filename)
                    medical_doc.save(file_path)
                    current_user.medical_docs = f"/uploads/medical_docs/{filename}"

            try:
                # Commit changes
                db.session.commit()
                
                # Return updated user data
                return jsonify({
                    "message": "Health metrics updated successfully",
                    "user": {
                        # "weight": current_user.weight,
                        "height": current_user.height,
                        "bloodPressure": current_user.blood_pressure,
                        "bloodGlucose": current_user.blood_glucose,
                        "chronic_conditions": current_user.chronic_conditions,
                        "medications": current_user.medications,
                        "past_surgeries": current_user.past_surgeries,
                        "allergies": current_user.allergies,
                        "additional_metrics": current_user.additional_metrics,
                        "medical_docs": current_user.medical_docs
                    }
                }), 200

            except Exception as db_error:
                db.session.rollback()
                print(f"Database error: {str(db_error)}")
                raise

        except Exception as e:
            print(f"Health metrics update error: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    if request.method == 'GET':
        try:
            auth_header = request.headers.get('Authorization')
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, str(current_app.config['SECRET_KEY']), algorithms=["HS256"])
            
            # Get user with the correct model based on role
            user_role = data.get('role', '')
            user_id = data.get('user_id')
            
            if user_role == 'patient':
                current_user = Patient.query.get(user_id)
            else:
                return jsonify({"error": "Only patients can update health metrics"}), 403

            if not current_user:
                return jsonify({"error": "User not found"}), 404
            
            Patient_Health_metrics={               
                "weight": current_user.weight,
                "height": current_user.height,
                "bloodPressure": current_user.blood_pressure,
                "bloodGlucose": current_user.blood_glucose,
                "chronic_conditions": current_user.chronic_conditions,
                "medications": current_user.medications,
                "past_surgeries": current_user.past_surgeries,
                "allergies": current_user.allergies,
                "additional_metrics": current_user.additional_metrics,
                "medical_docs": current_user.medical_docs,
            }
            return jsonify(Patient_Health_metrics)
        except Exception as e:
            print(f"Health metrics update error: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
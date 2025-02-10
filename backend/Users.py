from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from database  import db





# --- Base User Model ---
class BaseUser(UserMixin, db.Model):
    __tablename__ = "base_users"
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date)#, nullable=False)
    
    # Address Information
    house_no = db.Column(db.String(20))
    apartment = db.Column(db.String(50))
    colony = db.Column(db.String(100))
    city = db.Column(db.String(50))
    pin_code = db.Column(db.String(10))
    state = db.Column(db.String(50))
    
    # Contact Information
    primary_contact = db.Column(db.String(15), unique=True)#, nullable=False)
    recovery_contact = db.Column(db.String(15), unique=True)
    primary_email = db.Column(db.String(100), unique=True)#, nullable=False)
    recovery_email = db.Column(db.String(100), unique=True)
    
    # Identity Information
    aadhar_ssn = db.Column(db.String(20), unique=True) #, nullable=False)
    profile_pic = db.Column(db.String(255))  # URL to profile picture

    # Authentication
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # "patient", "doctor", "paramedic"

    def set_password(self, password):
        """Hashes and stores the password securely."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifies the password."""
        return check_password_hash(self.password_hash, password)

    __mapper_args__ = {
        'polymorphic_identity': 'base_user',
        'polymorphic_on': role
    }

# --- Patient Model ---
class Patient(BaseUser):
    __tablename__ = "patients"
    
    id = db.Column(db.Integer, db.ForeignKey("base_users.id"), primary_key=True)
    
    # Medical History
    allergies = db.Column(db.Text)  # JSON list of allergies
    chronic_conditions = db.Column(db.Text)  # JSON list of conditions
    medications = db.Column(db.Text)  # JSON list of current medications
    past_surgeries = db.Column(db.Text)  # JSON list of past surgeries
    medical_docs = db.Column(db.Text)  # URLs to past medical documents (optional)
    
    # Health Metrics
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    blood_pressure = db.Column(db.String(20))
    blood_glucose = db.Column(db.String(20))
    additional_metrics = db.Column(db.Text)  # JSON object for custom metrics

    __mapper_args__ = {
        'polymorphic_identity': 'patient'
    }

# --- Doctor Model ---
class Doctor(BaseUser):
    __tablename__ = "doctors"
    
    id = db.Column(db.Integer, db.ForeignKey("base_users.id"), primary_key=True)
    
    # Professional Information
    medical_license = db.Column(db.String(50), unique=True, nullable=False)
    specialty = db.Column(db.String(100))
    years_experience = db.Column(db.Integer)
    organization = db.Column(db.String(100))

    # Clinical Data
    patient_list = db.Column(db.Text)  # JSON list of assigned patients
    treatment_plans = db.Column(db.Text)  # JSON object for treatments & progress notes
    lab_results = db.Column(db.Text)  # JSON list of lab reports

    # Education & Training
    medical_school = db.Column(db.String(100))
    residency = db.Column(db.String(100))
    continuing_education = db.Column(db.Text)  # JSON list of certifications

    # Availability
    availability_schedule = db.Column(db.Text)  # JSON object with availability slots

    __mapper_args__ = {
        'polymorphic_identity': 'doctor'
    }

# --- Paramedic Model ---
class Paramedic(BaseUser):
    __tablename__ = "paramedics"
    
    id = db.Column(db.Integer, db.ForeignKey("base_users.id"), primary_key=True)
    
    # Professional Information
    emt_certification_number = db.Column(db.String(50), unique=True, nullable=False)
    years_experience = db.Column(db.Integer)

    # Incident Data
    emergency_responses = db.Column(db.Text)  # JSON list of emergencies responded to
    patient_vitals = db.Column(db.Text)  # JSON object for vitals recorded
    incident_reports = db.Column(db.Text)  # JSON list of reports

    # Training & Certifications
    certification_level = db.Column(db.String(50))  # EMT-B, EMT-I, EMT-P
    als_bls_training = db.Column(db.String(50))  # ALS/BLS training
    additional_certifications = db.Column(db.Text)  # JSON list of certifications

    __mapper_args__ = {
        'polymorphic_identity': 'paramedic'
    }


# --- Admin Model ---
class Admin(BaseUser):
    __tablename__ = "admins"
    
    id = db.Column(db.Integer, db.ForeignKey("base_users.id"), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'admin'
    }

    def __init__(self, **kwargs):
        super(Admin, self).__init__(**kwargs)
        self.role = 'admin'

    @staticmethod
    def create_superadmin(email, password):
        """Creates a superadmin user"""
        admin = Admin(
            first_name='Super',
            last_name='Admin', 
            primary_email=email,
            role='admin'
        )
        admin.set_password(password)
        return admin

    def get_all_users(self):
        """Get all users regardless of role"""
        return BaseUser.query.all()

    def get_all_patients(self):
        """Get all patient records"""
        return BaseUser.query.filter_by(role='patient').all()

    def get_all_doctors(self):
        """Get all doctor records"""
        return BaseUser.query.filter_by(role='doctor').all()
        
    def get_all_paramedics(self):
        """Get all paramedic records"""
        return BaseUser.query.filter_by(role='paramedic').all()

    def get_user_details(self, user_id):
        """Get detailed information for any user"""
        return BaseUser.query.get(user_id)
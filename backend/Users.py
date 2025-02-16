from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash
from database  import db
import pyotp  # For 2FA
from datetime import datetime, timedelta, timezone
import json
import secrets




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

    # 2FA Fields
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(32))  # For storing TOTP secret
    backup_codes = db.Column(db.Text)  # JSON list of backup codes
    preferred_2fa_method = db.Column(db.String(20))  # 'app', 'sms', or 'email'
    
    # Verification Fields
    email_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(100))
    email_verification_sent_at = db.Column(db.DateTime)
    
    phone_verified = db.Column(db.Boolean, default=False)
    phone_verification_code = db.Column(db.String(6))
    phone_verification_sent_at = db.Column(db.DateTime)
    
    # Account Security
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime)
    account_locked_until = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        super(BaseUser, self).__init__(**kwargs)
        if not self.two_factor_secret:
            self.two_factor_secret = pyotp.random_base32()

    def set_password(self, password):
        """Hashes and stores the password securely."""
        self.password_hash = generate_password_hash(password)


    __mapper_args__ = {
        'polymorphic_identity': 'base_user',
        'polymorphic_on': role
    }

    # 2FA Methods
    # def enable_2fa(self):
    #     """Enable 2FA for the user"""
    #     self.two_factor_enabled = True
    #     self.generate_backup_codes()
    #     db.session.commit()

    # def disable_2fa(self):
    #     """Disable 2FA for the user"""
    #     self.two_factor_enabled = False
    #     self.two_factor_secret = pyotp.random_base32()  # Generate new secret
    #     self.backup_codes = None
    #     db.session.commit()

    # def verify_totp(self, token):
    #     """Verify a TOTP token"""
    #     totp = pyotp.TOTP(self.two_factor_secret)
    #     return totp.verify(token)

    # def generate_backup_codes(self, count=8):
    #     """Generate new backup codes"""
    #     import secrets
    #     codes = [secrets.token_hex(4) for _ in range(count)]
    #     self.backup_codes = json.dumps(codes)
    #     return codes

    # Email Verification Methods
    def generate_email_verification_token(self):
        """Generate a new email verification token"""
        
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_sent_at = datetime.utcnow()
        db.session.commit()
        return self.email_verification_token

    def verify_email(self, token):
        """Verify email with token"""
        if token == self.email_verification_token:
            if self.email_verification_sent_at + timedelta(hours=24) > datetime.utcnow():
                self.email_verified = True
                self.email_verification_token = None
                db.session.commit()
                return True
        return False

    # Phone Verification Methods
    # def generate_phone_verification_code(self):
    #     """Generate a new phone verification code"""
    #     import random
    #     self.phone_verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    #     self.phone_verification_sent_at = datetime.utcnow()
    #     db.session.commit()
    #     return self.phone_verification_code

    # def verify_phone(self, code):
    #     """Verify phone with code"""
    #     if code == self.phone_verification_code:
    #         if self.phone_verification_sent_at + timedelta(minutes=10) > datetime.utcnow():
    #             self.phone_verified = True
    #             self.phone_verification_code = None
    #             db.session.commit()
    #             return True
    #     return False

    # Account Security Methods
    def record_failed_login(self):
        """Record a failed login attempt"""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.now(timezone.utc)
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.account_locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
        
        db.session.commit()

    def reset_failed_login_attempts(self):
        """Reset failed login attempts after successful login"""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.account_locked_until = None
        db.session.commit()

    def is_account_locked(self):
        """Check if account is locked"""
        if self.account_locked_until:
            if self.account_locked_until > datetime.now(timezone.utc):
                return True
            # Reset lock if time has passed
            self.account_locked_until = None
            db.session.commit()
        return False

    # Password Management
    def change_password(self, new_password):
        """Change user password and record the time"""
        from app import bcrypt_var
        self.password_hash = bcrypt_var.generate_password_hash(new_password).decode('utf-8')
        self.password_changed_at = datetime.now(timezone.utc)
        db.session.commit()

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
# class Admin(BaseUser):
#     __tablename__ = "admins"
    
#     id = db.Column(db.Integer, db.ForeignKey("base_users.id"), primary_key=True)

#     __mapper_args__ = {
#         'polymorphic_identity': 'admin'
#     }

#     def __init__(self, **kwargs):
#         super(Admin, self).__init__(**kwargs)
#         self.role = 'admin'

#     @staticmethod
#     def create_superadmin(email, password):
#         """Creates a superadmin user"""
#         admin = Admin(
#             first_name='Super',
#             last_name='Admin', 
#             primary_email=email,
#             role='admin'
#         )
#         admin.set_password(password)
#         return admin

#     def get_all_users(self):
#         """Get all users regardless of role"""
#         return BaseUser.query.all()

#     def get_all_patients(self):
#         """Get all patient records"""
#         return BaseUser.query.filter_by(role='patient').all()

#     def get_all_doctors(self):
#         """Get all doctor records"""
#         return BaseUser.query.filter_by(role='doctor').all()
        
#     def get_all_paramedics(self):
#         """Get all paramedic records"""
#         return BaseUser.query.filter_by(role='paramedic').all()

#     def get_user_details(self, user_id):
#         """Get detailed information for any user"""
#         return BaseUser.query.get(user_id)
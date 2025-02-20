import os
import click
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask.cli import with_appcontext
from flask_migrate import Migrate

db = SQLAlchemy()

def create_app():
    """Initialize Flask App"""
    app = Flask(__name__)

    # PostgreSQL Database URI
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://Admin:Admin@db:5432/MaxRayUsers')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate = Migrate(app, db) # Initialize Flask-Migrate for updating database schema

    with app.app_context():
        from Users import BaseUser  # Ensure models are imported after db is initialized
        db.create_all()

    return app

def init_db():
    """Create database tables."""
    from Users import BaseUser 
    with create_app().app_context():
        db.create_all()

@click.command("init-db")
@with_appcontext
def init_db_command():
    """Initialize the database."""
    init_db()
    click.echo("Initialized the database.")

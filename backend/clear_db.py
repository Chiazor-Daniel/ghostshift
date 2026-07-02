import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.database import Base
# Import all models so Base knows about them
import models 

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def clear_database():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL is not set in your .env file!")
        return

    print(f"Connecting to database to wipe tables...")
    engine = create_engine(database_url)
    
    # Drop all tables and recreate them
    print("Dropping all tables... This might take a moment.")
    Base.metadata.drop_all(bind=engine)
    
    print("✅ All tables dropped successfully!")
    print("When you restart your FastAPI server, it will automatically recreate the clean tables and seed the demo data.")

if __name__ == "__main__":
    confirm = input("⚠️ WARNING: This will DELETE ALL DATA in the database specified by DATABASE_URL. Are you sure? (type 'yes' to confirm): ")
    if confirm.lower() == 'yes':
        clear_database()
    else:
        print("Aborted.")

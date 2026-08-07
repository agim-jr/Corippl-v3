import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Get the project directory structure
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent

# Add the backend directory to the path
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
dotenv_path = backend_dir / '.env'
load_dotenv(dotenv_path=dotenv_path)

# Verify key environment variables are loaded
if not os.getenv('SECRET_KEY'):
    print("WARNING: Environment variables may not be loading correctly!")

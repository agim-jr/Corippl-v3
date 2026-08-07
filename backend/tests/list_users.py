# backend/tests/list_users.py
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
import os

# Get the correct path to the backend directory
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent

# Add the backend directory to the Python path
sys.path.append(str(backend_dir))

# Database credentials from your .env
DB_NAME = 'echo_db'
DB_USER = 'echo_admin'
DB_PASSWORD = 'Junebug2025'
DB_HOST = 'localhost'
DB_PORT = '5432'

# Create DATABASE_URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def list_users():
    try:
        # Connect to the database
        print(f"Attempting to connect to database: {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}")
        engine = create_engine(DATABASE_URL)

        # Check if the connection works
        with engine.connect() as conn:
            print("Connected to database successfully!")

            # Try to get user table name
            try:
                result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
                tables = [row[0] for row in result]
                print(f"Found tables: {tables}")

                # Look for user table (may be named 'user', 'users', etc.)
                user_tables = [table for table in tables if 'user' in table.lower()]

                if user_tables:
                    print(f"Found potential user tables: {user_tables}")

                    for user_table in user_tables:
                        # Try to get column names
                        try:
                            result = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{user_table}'"))
                            columns = [row[0] for row in result]
                            print(f"Table '{user_table}' has columns: {columns}")

                            # Check for username/email columns
                            identity_cols = []
                            if 'username' in columns:
                                identity_cols.append('username')
                            if 'email' in columns:
                                identity_cols.append('email')

                            # Get user list with available columns
                            if identity_cols:
                                select_cols = ", ".join(["id"] + identity_cols)
                                result = conn.execute(text(f"SELECT {select_cols} FROM {user_table} LIMIT 5"))
                                print(f"\nSample users from '{user_table}':")
                                for row in result:
                                    user_info = f"ID: {row[0]}"
                                    for i, col in enumerate(identity_cols):
                                        user_info += f", {col}: {row[i+1]}"
                                    print(user_info)
                            else:
                                print(f"Could not find username or email columns in {user_table}")
                                # Try to show some data anyway
                                result = conn.execute(text(f"SELECT * FROM {user_table} LIMIT 3"))
                                for row in result:
                                    print(row)
                        except Exception as e:
                            print(f"Error querying table {user_table}: {str(e)}")
                else:
                    print("No user tables found. Listing all tables:")
                    for table in tables:
                        print(f"- {table}")

                        # Try to get a sample of data
                        try:
                            result = conn.execute(text(f"SELECT * FROM {table} LIMIT 1"))
                            for row in result:
                                print(f"  Sample: {row}")
                        except:
                            print(f"  Could not query {table}")
            except Exception as e:
                print(f"Error listing tables: {str(e)}")

    except Exception as e:
        print(f"Database connection error: {str(e)}")

if __name__ == "__main__":
    list_users()

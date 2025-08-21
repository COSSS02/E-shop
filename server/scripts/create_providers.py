import os
import mysql.connector
import bcrypt
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE'),
    'port': os.getenv('DB_PORT', 3306)
}

ids = [5, 6, 7, 8]

emails = ['forit@mail.com', 'vexio@mail.com', 'itgalaxy@mail.com', 'shop4pc@mail.com']

first_names = ['For', 'Ve', 'IT', 'Shop']

last_names = ['IT', 'Xio', 'Galaxy', '4PC']

company_names = ['ForIT', 'Vexio', 'ITGalaxy', 'Shop4PC']

def create_provider(cursor, index):
    id = ids[index]
    email = emails[index]
    first_name = first_names[index]
    last_name = last_names[index]
    company_name = company_names[index]

    # Generate a salt and hash the password
    password = bcrypt.hashpw(b'password', bcrypt.gensalt(10)).decode('utf-8')

    cursor.execute(
        "INSERT INTO users (id, email, first_name, last_name, company_name, password_hash, role) VALUES (%s, %s, %s, %s, %s, %s, 'provider')",
        (id, email, first_name, last_name, company_name, password)
    )

db_connection = None
try:
    db_connection = mysql.connector.connect(**DB_CONFIG)
    cursor = db_connection.cursor()

    for i in range(len(ids)):
        create_provider(cursor, i)

    db_connection.commit()
    print("Providers created successfully.")

except mysql.connector.Error as err:
    print(f"Database connection failed: {err}")
finally:
    # Ensure the connection is closed
    if db_connection and db_connection.is_connected():
        cursor.close()
        db_connection.close()
        print("Database connection closed.")
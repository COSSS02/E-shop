import pandas as pd
import random
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE'),
    'port': os.getenv('DB_PORT', 3306)
}

categories=["CPU","CPU Cooler", "GPU", "Motherboard", "PC Case", "PC Fans", "PSU", "RAM", "Storage"]
data=["cpu.csv", "cpu_cooler.csv", "gpu.csv", "motherboard.csv", "pc_case.csv", "pc_fans.csv", "psu.csv", "ram.csv", "storage.csv"]

category_id_dict={
    "GPU": 1,
    "CPU": 2,
    "RAM": 3,
    "Motherboard": 4,
    "Storage": 5,
    "PSU": 7,
    "PC Case": 8,
    "CPU Cooler": 9,
    "PC Fans": 10
}

capitalized_attributes = ["CAS", "GB", "PWM", "RPM","TDP"]

def get_provider_id(index):
    if index < 9:
        return 5
    elif index < 19:
        return 6
    elif index < 29:
        return 7
    else:
        return 8

def convert_attribute(attribute):
    return ' '.join(
    word.upper() if word.upper() in capitalized_attributes else word.capitalize()
    for word in attribute.replace('_', ' ').lower().split(' ')
)

db_connection = None
try:
    # Establish database connection
    db_connection = mysql.connector.connect(**DB_CONFIG)
    cursor = db_connection.cursor()
    print("✅ Database connection successful.")

    for (category, ds) in zip(categories, data):
        df = pd.read_csv(f"../data/{ds}")
        df[['price']] = df[['price']].fillna(0)
        print(f"\n--- Processing category: {category} ---")

        for index, product in enumerate(df.itertuples(), start=0):
            try:
                # Start a new transaction for each product
                db_connection.start_transaction()

                # 1. INSERT THE CORE PRODUCT
                provider_id = get_provider_id(index)
                category_id = category_id_dict[category]
                name = product.name
                description = ""  # Assuming empty description
                price = product.price
                stock_quantity = random.randint(0, 100)

                product_sql = """
                    INSERT INTO products (name, description, price, stock_quantity, category_id, provider_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                product_values = (name, description, price, stock_quantity, category_id, provider_id)
                cursor.execute(product_sql, product_values)
                product_id = cursor.lastrowid
                print(f"  -> Inserted product '{name[:40]}...' with ID: {product_id}")

                # 2. HANDLE ATTRIBUTES (CHECKING FOR DUPLICATES)
                for attribute_name in product._fields[3:]:
                    value = getattr(product, attribute_name)
                    if pd.isna(value):
                        continue

                    # Use your conversion function
                    formatted_attribute_name = convert_attribute(attribute_name)

                    # Check if attribute already exists for this category
                    find_attr_sql = "SELECT id FROM attributes WHERE name = %s AND category_id = %s"
                    cursor.execute(find_attr_sql, (formatted_attribute_name, category_id))
                    result = cursor.fetchone()

                    attribute_id = None
                    if result:
                        # Attribute exists, use its ID
                        attribute_id = result[0]
                    else:
                        # Attribute does not exist, create it
                        insert_attr_sql = "INSERT INTO attributes (name, category_id) VALUES (%s, %s)"
                        cursor.execute(insert_attr_sql, (formatted_attribute_name, category_id))
                        attribute_id = cursor.lastrowid

                    # 3. LINK PRODUCT TO ATTRIBUTE WITH ITS VALUE
                    link_sql = """
                        INSERT INTO product_attributes (product_id, attribute_id, value)
                        VALUES (%s, %s, %s)
                    """
                    # Ensure value is a string for insertion
                    cursor.execute(link_sql, (product_id, attribute_id, str(value)))

                # If everything was successful, commit the transaction
                db_connection.commit()

            except mysql.connector.Error as err:
                print(f"  ❌ Error processing product '{name}': {err}")
                if db_connection:
                    db_connection.rollback() # Rollback the failed transaction
                continue # Move to the next product

    print("\n✅ Database seeding completed successfully!")

except mysql.connector.Error as err:
    print(f"Database connection failed: {err}")
finally:
    # Ensure the connection is closed
    if db_connection and db_connection.is_connected():
        cursor.close()
        db_connection.close()
        print("Database connection closed.")
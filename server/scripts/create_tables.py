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

def create_users_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `email` varchar(255) NOT NULL,
            `password_hash` varchar(255) NOT NULL,
            `first_name` varchar(100) DEFAULT NULL,
            `last_name` varchar(100) DEFAULT NULL,
            `role` enum('client','admin','provider') NOT NULL DEFAULT 'client',
            `created_at` timestamp NULL DEFAULT current_timestamp(),
            `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            `company_name` varchar(255) DEFAULT NULL,
            `stripe_customer_id` varchar(255) DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `email` (`email`)
        )
    """)
    print("Users table created.")

def create_addresses_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS addresses (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `address_type` enum('shipping','billing','provider') NOT NULL DEFAULT 'shipping',
            `street` varchar(255) NOT NULL,
            `city` varchar(100) NOT NULL,
            `state` varchar(100) NOT NULL,
            `zip_code` varchar(20) NOT NULL,
            `country` varchar(100) NOT NULL,
            `created_at` timestamp NULL DEFAULT current_timestamp(),
            `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (`id`),
            KEY `addresses_ibfk_1` (`user_id`),
            CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )
    """)
    print("Addresses table created.")

def create_categories_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `name` (`name`)
        )
    """)
    print("Categories table created.")

def create_products_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `provider_id` int(11) NOT NULL,
            `category_id` int(11) NOT NULL,
            `name` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `price` decimal(10,2) NOT NULL,
            `stock_quantity` int(11) NOT NULL DEFAULT 0,
            `created_at` timestamp NULL DEFAULT current_timestamp(),
            `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (`id`),
            KEY `provider_id` (`provider_id`),
            KEY `category_id` (`category_id`),
            CONSTRAINT `products_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`),
            CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)        )
    """)
    print("Products table created.")

def create_attributes_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attributes (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `category_id` int(11) NOT NULL,
            `name` varchar(255) NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uk_name_per_category` (`name`,`category_id`),
            KEY `fk_attribute_category` (`category_id`),
            CONSTRAINT `fk_attribute_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
        )
    """)
    print("Attributes table created.")

def create_product_attributes_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_attributes (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `product_id` int(11) NOT NULL,
            `attribute_id` int(11) NOT NULL,
            `value` varchar(255) NOT NULL,
            PRIMARY KEY (`id`),
            KEY `product_id` (`product_id`),
            KEY `attribute_id` (`attribute_id`),
            CONSTRAINT `product_attributes_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
            CONSTRAINT `product_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETECASCADE
        )
    """)
    print("Product Attributes table created.")

def create_wishlist_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wishlists (
            `user_id` int(11) NOT NULL,
            `product_id` int(11) NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (`user_id`,`product_id`),
            KEY `product_id` (`product_id`),
            CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
        )
    """)
    print("Wishlist table created.")

def create_cart_items_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cart_items (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `product_id` int(11) NOT NULL,
            `quantity` int(11) NOT NULL DEFAULT 1,
            `created_at` timestamp NULL DEFAULT current_timestamp(),
            PRIMARY KEY (`id`),
            UNIQUE KEY `user_id` (`user_id`,`product_id`),
            KEY `product_id` (`product_id`),
            CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
        )
    """)
    print("Cart Items table created.")

def create_orders_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `shipping_address_id` int(11) NOT NULL,
            `billing_address_id` int(11) NOT NULL,
            `total_amount` decimal(10,2) NOT NULL,
            `created_at` timestamp NULL DEFAULT current_timestamp(),
            `stripe_session_id` varchar(255) DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `stripe_session_id` (`stripe_session_id`),
            KEY `orders_ibfk_1` (`user_id`),
            KEY `orders_ibfk_2` (`shipping_address_id`),
            KEY `orders_ibfk_3` (`billing_address_id`),
            CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`id`) ON DELETE CASCADE,
            CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses` (`id`) ON DELETE CASCADE
        )
    """)
    print("Orders table created.")

def create_order_items_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `order_id` int(11) NOT NULL,
            `product_id` int(11) NOT NULL,
            `quantity` int(11) NOT NULL,
            `price_at_purchase` decimal(10,2) NOT NULL,
            `status` enum('Pending','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
            PRIMARY KEY (`id`),
            KEY `order_id` (`order_id`),
            KEY `product_id` (`product_id`),
            CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
            CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
        )
    """)
    print("Order Items table created.")


db_connection = None
try:
    # Establish database connection
    db_connection = mysql.connector.connect(**DB_CONFIG)
    cursor = db_connection.cursor()
    print("Database connection successful.")

    create_users_table(cursor)
    create_addresses_table(cursor)
    create_categories_table(cursor)
    create_products_table(cursor)
    create_attributes_table(cursor)
    create_product_attributes_table(cursor)
    create_wishlist_table(cursor)
    create_cart_items_table(cursor)
    create_orders_table(cursor)
    create_order_items_table(cursor)

    db_connection.commit()

except mysql.connector.Error as err:
    print(f"Database connection failed: {err}")
finally:
    # Ensure the connection is closed
    if db_connection and db_connection.is_connected():
        cursor.close()
        db_connection.close()
        print("Database connection closed.")
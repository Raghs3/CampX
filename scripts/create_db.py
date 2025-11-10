import sqlite3

# Create or connect to the database file

conn = sqlite3.connect("campus.db")
cursor = conn.cursor()

# USERS TABLE

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,                               -- Added phone number column
    avatar TEXT,
    role TEXT DEFAULT 'student',              -- 'student', 'admin'
    email_verified INTEGER DEFAULT 0,         -- Email verification status (0=not verified, 1=verified)
    verification_token TEXT,                  -- Token for email verification
    token_expires INTEGER,                    -- Token expiration timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
""")

# ----------------------------
# Migration: ensure `phone` column exists on older DBs
# ----------------------------
def ensure_phone_column():
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'phone' not in cols:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
            print("Migration: added 'phone' column to users table")
        except Exception as e:
            print("Failed to add phone column:", e)

ensure_phone_column()

# ----------------------------
# Migration: ensure email verification columns exist on older DBs
# ----------------------------
def ensure_email_verification_columns():
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'email_verified' not in cols:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
            print("Migration: added 'email_verified' column to users table")
        except Exception as e:
            print("Failed to add email_verified column:", e)
    if 'verification_token' not in cols:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN verification_token TEXT")
            print("Migration: added 'verification_token' column to users table")
        except Exception as e:
            print("Failed to add verification_token column:", e)
    if 'token_expires' not in cols:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN token_expires INTEGER")
            print("Migration: added 'token_expires' column to users table")
        except Exception as e:
            print("Failed to add token_expires column:", e)

ensure_email_verification_columns()

# ----------------------------
# Migration: ensure `contact_method` column exists on products table
# ----------------------------
def ensure_contact_method_column():
    cursor.execute("PRAGMA table_info(products)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'contact_method' not in cols:
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN contact_method TEXT DEFAULT 'Email'")
            print(" Migration: added 'contact_method' column to products table")
        except Exception as e:
            print(" Failed to add contact_method column:", e)

# NOTE: We call the contact_method/status migrations AFTER ensuring the products table exists

# ============================================
# PRODUCTS TABLE (Marketplace)
# ============================================
cursor.execute("""
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    buyer_id INTEGER,
    title TEXT NOT NULL,
    category TEXT,
    price REAL NOT NULL DEFAULT 0,
    condition TEXT DEFAULT 'Good',
    description TEXT,
    image1 TEXT,
    image2 TEXT,
    image3 TEXT,
    quantity INTEGER DEFAULT 1,                 -- Stock quantity
    status TEXT DEFAULT 'Available',          -- 'Available', 'Reserved', 'Sold'
    contact_method TEXT DEFAULT 'Email',      -- 'Email' or 'Phone'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (user_id),
    FOREIGN KEY (buyer_id) REFERENCES users (user_id)
);
""")

# After products table creation, ensure extra columns exist (for older DBs)
def ensure_products_extra_columns():
    cursor.execute("PRAGMA table_info(products)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'contact_method' not in cols:
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN contact_method TEXT DEFAULT 'Email'")
            print(" Migration: added 'contact_method' column to products table")
        except Exception as e:
            print(" Failed to add contact_method column:", e)
    if 'status' not in cols:
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'Available'")
            print(" Migration: added 'status' column to products table")
        except Exception as e:
            print(" Failed to add status column:", e)
    # Ensure image columns exist so sellers can add up to 3 images
    for img_col in ('image1','image2','image3'):
        if img_col not in cols:
            try:
                cursor.execute(f"ALTER TABLE products ADD COLUMN {img_col} TEXT")
                print(f" Migration: added '{img_col}' column to products table")
            except Exception as e:
                print(f" Failed to add {img_col} column:", e)
    # Ensure buyer_id column exists so booking can set buyer_id when product is booked
    if 'buyer_id' not in cols:
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN buyer_id INTEGER")
            print(" Migration: added 'buyer_id' column to products table")
        except Exception as e:
            print(" Failed to add buyer_id column:", e)
    # Ensure quantity column exists for stock management
    if 'quantity' not in cols:
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 1")
            print(" Migration: added 'quantity' column to products table")
        except Exception as e:
            print(" Failed to add quantity column:", e)
        except Exception as e:
            print(" Failed to add buyer_id column:", e)

ensure_products_extra_columns()

# ============================================
# WISHLIST TABLE
# ============================================
cursor.execute("""
CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);
""")

# ============================================
# MESSAGES TABLE (Buyer ↔ Seller chat)
# ============================================
cursor.execute("""
CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    sender_id INTEGER,
    receiver_id INTEGER,
    message_text TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES products (product_id),
    FOREIGN KEY (sender_id) REFERENCES users (user_id),
    FOREIGN KEY (receiver_id) REFERENCES users (user_id)
);
""")

# Ensure item_id column exists on older DBs
def ensure_messages_item_id_column():
    cursor.execute("PRAGMA table_info(messages)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'item_id' not in cols:
        try:
            cursor.execute("ALTER TABLE messages ADD COLUMN item_id INTEGER")
            print(" Migration: added 'item_id' column to messages table")
        except Exception as e:
            print(" Failed to add item_id column to messages:", e)

ensure_messages_item_id_column()

# ============================================
# SUCCESS STORIES TABLE
# ============================================
cursor.execute("""
CREATE TABLE IF NOT EXISTS success_stories (
    story_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    student_name TEXT,
    vit_email TEXT,
    story TEXT NOT NULL,
    approved INTEGER DEFAULT 0,               -- 0 = pending, 1 = approved
    date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users (user_id)
);
""")

# ============================================
# SOLD ITEMS (snapshot when an item is booked/sold)
# ============================================
cursor.execute("""
CREATE TABLE IF NOT EXISTS sold_items (
    sold_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    seller_id INTEGER,
    buyer_id INTEGER,
    title TEXT,
    category TEXT,
    price REAL,
    condition TEXT,
    description TEXT,
    contact_method TEXT,
    image1 TEXT,
    image2 TEXT,
    image3 TEXT,
    sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (user_id),
    FOREIGN KEY (buyer_id) REFERENCES users (user_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);
""")

# After sold_items table creation, ensure extra columns exist (for older DBs)
def ensure_sold_items_extra_columns():
    cursor.execute("PRAGMA table_info(sold_items)")
    cols = [row[1] for row in cursor.fetchall()]
    # Add contact_method if missing
    if 'contact_method' not in cols:
        try:
            cursor.execute("ALTER TABLE sold_items ADD COLUMN contact_method TEXT")
            print(" Migration: added 'contact_method' column to sold_items table")
        except Exception as e:
            print(" Failed to add contact_method column to sold_items:", e)
    # Add image columns if missing
    for img_col in ('image1','image2','image3'):
        if img_col not in cols:
            try:
                cursor.execute(f"ALTER TABLE sold_items ADD COLUMN {img_col} TEXT")
                print(f" Migration: added '{img_col}' column to sold_items table")
            except Exception as e:
                print(f" Failed to add {img_col} column to sold_items:", e)

ensure_sold_items_extra_columns()

# ============================================
# REVIEWS TABLE (buyer reviews seller after transaction)
# ============================================
cursor.execute("""
CREATE TABLE IF NOT EXISTS reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    product_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (user_id),
    FOREIGN KEY (buyer_id) REFERENCES users (user_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);
""")

# ============================================
# VIEW: PRODUCTS + SELLER INFO (for frontend display)
# ============================================
cursor.execute("""
CREATE VIEW IF NOT EXISTS products_with_sellers AS
SELECT 
    p.product_id, p.title, p.category, p.price, p.condition,
    p.description, p.status, p.contact_method,
    p.seller_id, u.full_name AS seller_name, u.avatar AS seller_avatar, u.email AS seller_email,
        p.buyer_id, u2.full_name AS buyer_name, u2.email AS buyer_email
FROM products p
LEFT JOIN users u ON p.seller_id = u.user_id
LEFT JOIN users u2 ON p.buyer_id = u2.user_id;
""")

# ============================================
# VIEW: APPROVED SUCCESS STORIES
# ============================================
cursor.execute("""
CREATE VIEW IF NOT EXISTS approved_stories AS
SELECT story_id, student_name, vit_email, story, date_posted
FROM success_stories
WHERE approved = 1;
""")

# ============================================
# Finalize
# ============================================
conn.commit()
conn.close()
print(" Database created & updated successfully with all new features (campus.db)")

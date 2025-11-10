import sqlite3

# Connect to database
conn = sqlite3.connect('campus.db')
cursor = conn.cursor()

# Email to delete
email = input("Enter email to delete: ")

# Delete user
cursor.execute("DELETE FROM users WHERE email = ?", (email,))
conn.commit()

print(f"✅ Deleted user with email: {email}")
print(f"   Rows affected: {cursor.rowcount}")

conn.close()

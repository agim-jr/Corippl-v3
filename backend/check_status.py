import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdW5pb3IuYWdpbSIsInVzZXJfaWQiOjgxLCJpc19wcmVtaXVtIjp0cnVlLCJpc19haV90aWVyIjp0cnVlLCJpc19hZG1pbiI6ZmFsc2UsImV4cCI6MTc3NDk0MzQ2OH0.5ANTywn7f-r-aGwrqAeC1cHalSD3P7OSwKd_Gah9_I4"

headers = {"Authorization": f"Bearer {TOKEN}"}
response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
user = response.json()

print(f"Username: {user['username']}")
print(f"Is Premium: {user['is_premium']}")
print(f"Credits: {user['share_count']}")
print(f"Credit Threshold: {user.get('credit_threshold', 'N/A')}")

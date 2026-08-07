# -*- coding: utf-8 -*-
import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdW5pb3IuYWdpbSIsInVzZXJfaWQiOjgxLCJpc19wcmVtaXVtIjp0cnVlLCJpc19haV90aWVyIjp0cnVlLCJpc19hZG1pbiI6ZmFsc2UsImV4cCI6MTc3NDk0MzQ2OH0.5ANTywn7f-r-aGwrqAeC1cHalSD3P7OSwKd_Gah9_I4"

headers = {"Authorization": f"Bearer {TOKEN}"}

print("=== DEBUGGING UNLOCK FLOW ===\n")

# Step 1: Get all your content and their statuses
print("Step 1: Your current content:")
response = requests.get(f"{BASE_URL}/content/", headers=headers)
my_content = response.json()
pending_content = [c for c in my_content if c['status'] == 'pending']
active_content = [c for c in my_content if c['status'] == 'active']

print(f"  PENDING: {len(pending_content)} items")
for c in pending_content[:5]:
    print(f"    - ID {c['id']}: {c['title']}")

print(f"  ACTIVE: {len(active_content)} items")
for c in active_content[:3]:
    print(f"    - ID {c['id']}: {c['title']}")

# Step 2: Check credits
response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
user = response.json()
print(f"\nStep 2: Current credits: {user['share_count']}")

# Step 3: Get pool content
print("\nStep 3: Getting content to review from pool...")
response = requests.get(f"{BASE_URL}/pool/queue", headers=headers)
if response.status_code == 200:
    pool = response.json()
    results = pool.get('results', [])
    print(f"  Found {len(results)} items in pool")
    
    if results:
        to_review = results[0]
        print(f"  Will review: ID {to_review['content_id']} - {to_review['title']}")
        
        # Step 4: Submit review
        print("\nStep 4: Submitting review...")
        review_data = {
            "content_id": to_review['content_id'],
            "rating": 5,
            "feedback": "Testing unlock system",
            "categories_match": True,
            "is_spam": False,
            "is_quality": True
        }
        
        response = requests.post(f"{BASE_URL}/pool/review", headers=headers, json=review_data)
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n  Review Response:")
            print(f"    success: {result.get('success')}")
            print(f"    message: {result.get('message')}")
            print(f"    unlocked_content: {result.get('unlocked_content')}")
            print(f"    remaining_credits: {result.get('remaining_credits')}")
            
            # Step 5: Check content status again
            print("\nStep 5: Checking content status after review...")
            response = requests.get(f"{BASE_URL}/content/", headers=headers)
            my_content_after = response.json()
            pending_after = [c for c in my_content_after if c['status'] == 'pending']
            active_after = [c for c in my_content_after if c['status'] == 'active']
            
            print(f"  PENDING: {len(pending_after)} items (was {len(pending_content)})")
            print(f"  ACTIVE: {len(active_after)} items (was {len(active_content)})")
            
            if len(pending_after) < len(pending_content):
                print("\n  ✅ SUCCESS! Something was unlocked!")
                unlocked = [c for c in my_content_after if c['id'] in [p['id'] for p in pending_content] and c['status'] == 'active']
                for c in unlocked:
                    print(f"    Unlocked: ID {c['id']} - {c['title']}")
            else:
                print("\n  ❌ PROBLEM! No content was unlocked")
                print(f"     Pending count stayed at {len(pending_content)}")
        else:
            print(f"  ❌ Review failed: {response.text}")
    else:
        print("  No content available to review")
else:
    print(f"  ❌ Failed to get pool: {response.text}")

print("\n=== CHECK YOUR BACKEND LOGS FOR ERRORS ===")

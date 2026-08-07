# -*- coding: utf-8 -*-
import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdW5pb3IuYWdpbSIsInVzZXJfaWQiOjgxLCJpc19wcmVtaXVtIjp0cnVlLCJpc19haV90aWVyIjp0cnVlLCJpc19hZG1pbiI6ZmFsc2UsImV4cCI6MTc3NDk0MzQ2OH0.5ANTywn7f-r-aGwrqAeC1cHalSD3P7OSwKd_Gah9_I4"

headers = {"Authorization": f"Bearer {TOKEN}"}

print("=== STEP 1: Create Pending Content ===")
timestamp = int(time.time())
form_data = {
    "title": f"Test Unlock System {timestamp}",
    "url": f"https://example.com/test-{timestamp}",
    "content_type": "article",
    "description": "This should start as pending",
    "categories": "[]"
}

response = requests.post(f"{BASE_URL}/content/", headers=headers, data=form_data)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    content = response.json()
    print(f"Content Created! ID: {content['id']}, Status: {content['status']}")
    content_id = content['id']
    
    if content['status'] == 'active':
        print("\nWARNING: Content is 'active' instead of 'pending'")
        print("Setting it to pending manually...")
        
        update_data = {"status": "pending"}
        response = requests.put(
            f"{BASE_URL}/content/{content_id}",
            headers=headers,
            json=update_data
        )
        if response.status_code == 200:
            print("Status changed to pending!")
        else:
            print(f"Failed to change status: {response.text}")
else:
    print(f"Failed: {response.text}")
    exit()

print("\n=== STEP 2: Check Current Credits ===")
response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
user_data = response.json()
print(f"Current credits: {user_data['share_count']}")

print("\n=== STEP 3: Get Content to Review ===")
response = requests.get(f"{BASE_URL}/pool/queue", headers=headers)
if response.status_code == 200:
    pool = response.json()
    results = pool.get('results', [])
    print(f"Found {len(results)} items in pool")
    
    reviewable = [r for r in results if r['content_id'] != content_id]
    
    if reviewable:
        to_review = reviewable[0]
        print(f"\nReviewing: {to_review['title']} (ID: {to_review['content_id']})")
        
        print("\n=== STEP 4: Submit Review (Should Unlock Content) ===")
        review_data = {
            "content_id": to_review['content_id'],
            "rating": 5,
            "feedback": "Testing unlock system - great content!",
            "categories_match": True,
            "is_spam": False,
            "is_quality": True
        }
        
        response = requests.post(f"{BASE_URL}/pool/review", headers=headers, json=review_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("Review submitted!")
            print(f"Response: {result}")
            
            if result.get('unlocked_content'):
                print("\n*** SUCCESS! Content WAS unlocked! ***")
                print(f"  Title: {result['unlocked_content']['title']}")
                print(f"  URL: {result['unlocked_content']['url']}")
                print(f"  ID: {result['unlocked_content']['id']}")
            else:
                print("\n*** PROBLEM: No content unlocked ***")
            
            print(f"\nRemaining credits: {result.get('remaining_credits')}")
        else:
            print(f"Review failed: {response.text}")
    else:
        print("Only your own content in pool - cannot test")
else:
    print(f"Failed to get pool: {response.text}")

print("\n=== STEP 5: Verify Content Status ===")
response = requests.get(f"{BASE_URL}/content/", headers=headers)
if response.status_code == 200:
    my_content = response.json()
    created = [c for c in my_content if c['id'] == content_id]
    if created:
        final_status = created[0]['status']
        print(f"Your content final status: {final_status}")
        
        if final_status == 'active':
            print("*** UNLOCK WORKED! Status changed from pending to active ***")
        else:
            print(f"*** UNLOCK DID NOT WORK - Status is still: {final_status} ***")

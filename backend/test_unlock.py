# -*- coding: utf-8 -*-
import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdW5pb3IuYWdpbSIsInVzZXJfaWQiOjgxLCJpc19wcmVtaXVtIjp0cnVlLCJpc19haV90aWVyIjp0cnVlLCJpc19hZG1pbiI6ZmFsc2UsImV4cCI6MTc3NDk0MzQ2OH0.5ANTywn7f-r-aGwrqAeC1cHalSD3P7OSwKd_Gah9_I4"

headers = {"Authorization": f"Bearer {TOKEN}"}

print("=== STEP 1: Creating Content ===")
form_data = {
    "title": "Premium User Testing Unlock",
    "url": "https://github.com/premium/unlock-test",
    "content_type": "article",
    "description": "Testing unlock system",
    "categories": "[]"
}

response = requests.post(f"{BASE_URL}/content/", headers=headers, data=form_data)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    content = response.json()
    print(f"Content Created! ID: {content['id']}, Status: {content['status']}")
    content_id = content['id']
else:
    print(f"Failed: {response.text}")
    exit()

print("\n=== STEP 2: Submitting to Pool ===")
pool_data = {
    "title": "Premium User Testing Unlock",
    "original_url": "https://github.com/premium/unlock-test",
    "category": "Technology",
    "pitch": "Testing the unlock system"
}

response = requests.post(f"{BASE_URL}/pool/submit", headers=headers, json=pool_data)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print("Submitted to pool!")
else:
    print(f"Pool submission: {response.text}")

print("\n=== STEP 3: Getting Pool Content ===")
response = requests.get(f"{BASE_URL}/pool/queue", headers=headers)
if response.status_code == 200:
    pool = response.json()
    results = pool.get('results', [])
    print(f"Found {len(results)} items in pool")
    
    reviewable = [r for r in results if r['content_id'] != content_id]
    
    if reviewable:
        to_review = reviewable[0]
        print(f"\nReviewing: {to_review['title']} (ID: {to_review['content_id']})")
        
        print("\n=== STEP 4: Submitting Review ===")
        review_data = {
            "content_id": to_review['content_id'],
            "rating": 5,
            "feedback": "Great content!",
            "categories_match": True,
            "is_spam": False,
            "is_quality": True
        }
        
        response = requests.post(f"{BASE_URL}/pool/review", headers=headers, json=review_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("Review submitted!")
            
            if result.get('unlocked_content'):
                print("\nSUCCESS! Content unlocked:")
                print(f"  Title: {result['unlocked_content']['title']}")
                print(f"  URL: {result['unlocked_content']['url']}")
            else:
                print("\nNo content unlocked")
            
            print(f"\nRemaining credits: {result.get('remaining_credits')}")
        else:
            print(f"Review failed: {response.text}")
    else:
        print("Only your own content in pool")
else:
    print(f"Failed to get pool: {response.text}")

print("\n=== STEP 5: Final Status ===")
response = requests.get(f"{BASE_URL}/content/", headers=headers)
if response.status_code == 200:
    my_content = response.json()
    created = [c for c in my_content if c['id'] == content_id]
    if created:
        print(f"Your content status: {created[0]['status']}")

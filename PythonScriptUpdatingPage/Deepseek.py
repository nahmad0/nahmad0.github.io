import os
import requests
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")

# Define endpoint and headers
url = "https://api.deepseek.com/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Define payload
payload = {
    "model": "deepseek-chat",  # Replace with the actual model name if needed
    "messages": [
        {"role": "user", "content": "Write a short poem about cybersecurity."}
    ]
}

# Make request
response = requests.post(url, json=payload, headers=headers)

# Print the result
if response.status_code == 200:
    print("✅ Response:")
    print(response.json()['choices'][0]['message']['content'])
else:
    print(f"❌ Error {response.status_code}: {response.text}")

import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content":"Give me the most recent updates from the news use deep search before giving me the message."}
    ]
)

print(response['choices'][0]['message']['content'])

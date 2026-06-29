"""
Test Groq API
"""

import os
from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI

groq_api_key = os.getenv('GROQ_API_KEY')
print(f'Groq API Key: {groq_api_key[:20]}...')

client = OpenAI(api_key=groq_api_key, base_url='https://api.groq.com/openai/v1')

response = client.chat.completions.create(
    model='llama-3.3-70b-versatile',
    messages=[
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {'role': 'user', 'content': 'Say hello in 5 words.'}
    ],
    max_tokens=50
)

print('Groq API Response:', response.choices[0].message.content)

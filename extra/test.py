# import ollama

# response = ollama.chat(model='llama3.2', messages=[
# {
#     'role': 'user',
#     'content': 'Why is the sky blue?',
# },
# ])
# print(response['message']['content'])


import hashlib

# Example usage of hashlib
doc_content = "Some document content here"
doc_hash = hashlib.md5(doc_content.encode('utf-8')).hexdigest()

print(doc_hash)

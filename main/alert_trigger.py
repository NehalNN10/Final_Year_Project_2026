import requests
# Using the port 1767 defined in your app.py
response = requests.post("http://localhost:1767/api/test/trigger_waste")
print(response.json())
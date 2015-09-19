import requests
payload = {'keywords': ['vodafone','crm'], 'page': 1,'limit':20}
r = requests.post("http://localhost/twitter/get", params=payload)
# print (r.json()["more"])
print r.json()
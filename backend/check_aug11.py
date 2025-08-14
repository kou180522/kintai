import json
import requests

url = "http://localhost:8001/subpage/daily-chart?days=31&top_users=15"
response = requests.get(url)
data = response.json()

# Find August 11 data
for day_data in data.get('chart_data', []):
    if '08/11' in day_data.get('date', ''):
        print("August 11 data found:")
        print(f"  kouki0802.ao: {day_data.get('kouki0802.ao_formatted', 'None')}")
        print(f"  erin.isozu: {day_data.get('erin.isozu_formatted', 'None')}")
        print(f"  marikou180522: {day_data.get('marikou180522_formatted', 'None')}")
        break

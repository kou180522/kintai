from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta
import csv
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Parse query parameters
        query_string = self.path.split('?')[1] if '?' in self.path else ''
        params = {}
        if query_string:
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=')
                    params[key] = value
        
        days = int(params.get('days', 31))
        top_users = int(params.get('top_users', 15))
        month_offset = int(params.get('month_offset', 0))
        
        # Load CSV data
        csv_path = os.path.join(os.path.dirname(__file__), '../../data/attendance_data.csv')
        attendance_data = []
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    attendance_data.append(row)
        except Exception as e:
            response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Process data (simplified version)
        # This is a simplified implementation - you'll need to port the full logic
        chart_data = []
        user_configs = {}
        
        # Generate sample data for now
        now = datetime.now()
        target_month = now.month - month_offset
        target_year = now.year
        
        if target_month <= 0:
            target_month += 12
            target_year -= 1
        
        # Generate dates for the month
        for day in range(1, min(days + 1, 32)):
            date_str = f"{target_month:02d}/{day:02d}"
            day_data = {'date': date_str}
            
            # Add sample data for top users
            sample_users = ['theoj246', 'ryo4ryo4n66', 'A', 'osaryo523778', 'kimoppy126'][:top_users]
            for i, user in enumerate(sample_users):
                if user not in user_configs:
                    user_configs[user] = {
                        'label': user,
                        'color': f"hsl({i * 360 / top_users}, 70%, 50%)"
                    }
                # Random hours between 0 and 10
                import random
                day_data[user] = round(random.uniform(0, 10), 1) if random.random() > 0.3 else None
            
            chart_data.append(day_data)
        
        response = {
            'success': True,
            'chart_data': chart_data,
            'user_configs': user_configs
        }
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
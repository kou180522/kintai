from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta
import csv
import os
from urllib.parse import parse_qs, urlparse
from collections import defaultdict

# ユーザーごとの色設定
USER_COLORS = {
    "theoj246": "hsl(265, 70%, 50%)",
    "ryo4ryo4n66": "hsl(340, 70%, 50%)",
    "A": "hsl(45, 70%, 50%)",
    "osaryo523778": "hsl(120, 70%, 50%)",
    "kimoppy126": "hsl(200, 70%, 50%)",
    "yuta.takasu": "hsl(15, 70%, 50%)",
    "hinako.tsutsumi2525": "hsl(300, 70%, 50%)",
    "ujwal.kumar252725": "hsl(180, 70%, 50%)",
    "kouki0802.ao": "hsl(60, 70%, 50%)",
    "erin.isozu": "hsl(240, 70%, 50%)",
    "marikou180522": "hsl(90, 70%, 50%)",
    "Yohei Watanabe": "hsl(150, 70%, 50%)",
    "info": "hsl(30, 70%, 50%)",
    "deerveryone": "hsl(270, 70%, 50%)",
    "hara_kento09": "hsl(330, 70%, 50%)"
}

def parse_time_str(time_str):
    """時間文字列をfloatに変換"""
    if not time_str or time_str == '' or time_str == 'nan':
        return 0.0
    
    # "1:30:00" 形式の場合
    if ':' in str(time_str):
        parts = time_str.split(':')
        if len(parts) == 3:
            try:
                hours = int(parts[0])
                minutes = int(parts[1])
                return hours + minutes / 60
            except:
                return 0.0
    
    # 数値の場合
    try:
        return float(time_str)
    except:
        return 0.0

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
        parsed_url = urlparse(self.path)
        params = parse_qs(parsed_url.query)
        
        days = int(params.get('days', ['31'])[0])
        top_users = int(params.get('top_users', ['15'])[0])
        month_offset = int(params.get('month_offset', ['0'])[0])
        
        # Load CSV data - Vercelではpublicディレクトリから読む
        # ローカルとVercelの両方で動作するようにパスを調整
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        csv_paths = [
            os.path.join(base_dir, 'public', 'attendance_data.csv'),
            os.path.join(base_dir, 'data', 'attendance_data.csv'),
            '/var/task/public/attendance_data.csv',  # Vercel runtime path
            '/var/task/data/attendance_data.csv'
        ]
        
        csv_path = None
        for path in csv_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if not csv_path:
            response = {
                'success': False,
                'error': 'CSV file not found',
                'tried_paths': csv_paths
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # ユーザーごとの日別勤務時間を集計
        daily_hours = defaultdict(lambda: defaultdict(float))
        user_monthly_totals = defaultdict(float)
        
        # 対象月を計算
        now = datetime.now()
        target_month = now.month - month_offset
        target_year = now.year
        
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        
        row_count = 0
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                sessions = defaultdict(list)  # ユーザーごとのセッション
                
                for row in reader:
                    row_count += 1
                    if not row.get('日付') or not row.get('ユーザー'):
                        continue
                    
                    date_str = row['日付']
                    user = row['ユーザー']
                    status = row.get('ステータス', '')
                    work_time = row.get('合計稼働時間', '')
                    
                    # 日付をパース
                    try:
                        date = datetime.strptime(date_str, '%Y/%m/%d')
                    except:
                        continue
                    
                    # 月のフィルタリング
                    if date.year != target_year or date.month != target_month:
                        continue
                    
                    # 終了ステータスの場合、勤務時間を記録
                    if status == '終了' and work_time:
                        hours = parse_time_str(work_time)
                        if hours > 0:
                            day_key = f"{date.month:02d}/{date.day:02d}"
                            daily_hours[user][day_key] += hours
                            user_monthly_totals[user] += hours
                
        except Exception as e:
            response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # トップユーザーを選定（月間勤務時間順）
        sorted_users = sorted(user_monthly_totals.items(), key=lambda x: x[1], reverse=True)
        top_user_list = [user for user, _ in sorted_users[:top_users]]
        
        # デバッグ: ユーザーが見つからない場合
        if not top_user_list:
            response = {
                'success': False,
                'error': 'No users found in data',
                'debug': {
                    'csv_path': csv_path,
                    'row_count': row_count,
                    'user_count': len(user_monthly_totals),
                    'month_offset': month_offset,
                    'target_month': target_month,
                    'target_year': target_year
                }
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # チャートデータを生成
        chart_data = []
        
        # 月の日数を取得
        if target_month == 12:
            next_month = 1
            next_year = target_year + 1
        else:
            next_month = target_month + 1
            next_year = target_year
        
        last_day = (datetime(next_year, next_month, 1) - timedelta(days=1)).day
        
        # 現在月の場合は今日まで、過去月の場合は月末まで
        if month_offset == 0:
            end_day = min(now.day, last_day)
        else:
            end_day = last_day
        
        for day in range(1, min(end_day + 1, 32)):
            date_str = f"{target_month:02d}/{day:02d}"
            day_data = {'date': date_str}
            
            for user in top_user_list:
                hours = daily_hours[user].get(date_str, 0)
                day_data[user] = round(hours, 1) if hours > 0 else None
                # フォーマット済みの値も追加
                if hours > 0:
                    h = int(hours)
                    m = int((hours - h) * 60)
                    day_data[f"{user}_formatted"] = f"{h}時間{m}分" if m > 0 else f"{h}時間"
            
            chart_data.append(day_data)
        
        # ユーザー設定を生成
        user_configs = {}
        for i, user in enumerate(top_user_list):
            color = USER_COLORS.get(user, f"hsl({i * 360 / len(top_user_list)}, 70%, 50%)")
            user_configs[user] = {
                'label': user,
                'color': color
            }
        
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
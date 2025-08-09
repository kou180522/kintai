from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.services.csv_loader import csv_loader

router = APIRouter()

class UserSummary(BaseModel):
    employee_id: str
    name: str
    total_hours: int
    total_minutes: int
    total_time_formatted: str
    work_days: int
    department: str
    position: str
    
class MonthlyData(BaseModel):
    month: str
    total_hours: int
    total_minutes: int
    total_time_formatted: str
    work_days: int
    users_count: int

class DailyData(BaseModel):
    date: str
    user_name: str
    work_hours: int
    work_minutes: int
    work_time_formatted: str
    start_time: Optional[str]
    end_time: Optional[str]

class SubpageResponse(BaseModel):
    success: bool
    users_summary: List[UserSummary]
    monthly_summary: List[MonthlyData]
    recent_activities: List[DailyData]
    statistics: Dict[str, Any]
    timestamp: str

@router.get("/update", response_model=SubpageResponse)
async def get_subpage_data(
    limit: int = Query(default=10, description="表示するユーザー数の上限"),
    months: int = Query(default=12, description="表示する月数")
):
    """
    サブページ（Page2）更新用のAPIエンドポイント
    全ユーザーの勤務時間サマリーと月別データを返す
    """
    try:
        # ユーザー時間データを取得
        user_time_data = csv_loader.get_user_time_data()
        
        # 1. ユーザーサマリーを作成（上位N人）
        users_summary = []
        sorted_users = sorted(
            user_time_data.items(),
            key=lambda x: x[1]["total_hours"] * 60 + x[1]["total_minutes"],
            reverse=True
        )
        
        for i, (user_name, data) in enumerate(sorted_users[:limit]):
            # ユーザー基本情報を取得
            user_info = csv_loader.get_user_by_name(user_name)
            
            users_summary.append(UserSummary(
                employee_id=user_info["employee_id"] if user_info else f"user_{i+1:03d}",
                name=user_name,
                total_hours=data["total_hours"],
                total_minutes=data["total_minutes"],
                total_time_formatted=data["total_time_formatted"],
                work_days=data["work_days"],
                department=user_info["department"] if user_info else "未設定",
                position=user_info["position"] if user_info else "一般社員"
            ))
        
        # 2. 月別サマリーを作成
        monthly_data = {}
        for user_name, data in user_time_data.items():
            for month_key, month_info in data.get("monthly_hours", {}).items():
                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        "total_minutes": 0,
                        "work_days": 0,
                        "users": set()
                    }
                monthly_data[month_key]["total_minutes"] += month_info["total_minutes"]
                monthly_data[month_key]["work_days"] += month_info["work_days"]
                monthly_data[month_key]["users"].add(user_name)
        
        # 月別データをリストに変換（直近N月分）
        monthly_summary = []
        sorted_months = sorted(monthly_data.keys(), reverse=True)[:months]
        
        for month_key in sorted_months:
            month_info = monthly_data[month_key]
            total_minutes = month_info["total_minutes"]
            hours = total_minutes // 60
            minutes = total_minutes % 60
            
            monthly_summary.append(MonthlyData(
                month=month_key,
                total_hours=hours,
                total_minutes=minutes,
                total_time_formatted=f"{hours}時間{minutes}分",
                work_days=month_info["work_days"],
                users_count=len(month_info["users"])
            ))
        
        # 3. 最近のアクティビティ（直近の勤務データ）
        recent_activities = []
        all_daily_records = []
        
        for user_name, data in user_time_data.items():
            for date, day_info in data.get("daily_hours", {}).items():
                if day_info.get("hours", 0) > 0 or day_info.get("minutes", 0) > 0:
                    all_daily_records.append({
                        "date": date,
                        "user_name": user_name,
                        "work_hours": day_info.get("hours", 0),
                        "work_minutes": day_info.get("minutes", 0),
                        "work_time_formatted": day_info.get("formatted", "0時間0分")
                    })
        
        # 日付でソートして直近10件を取得
        sorted_records = sorted(all_daily_records, key=lambda x: x["date"], reverse=True)[:10]
        for record in sorted_records:
            recent_activities.append(DailyData(
                date=record["date"],
                user_name=record["user_name"],
                work_hours=record["work_hours"],
                work_minutes=record["work_minutes"],
                work_time_formatted=record["work_time_formatted"],
                start_time=None,
                end_time=None
            ))
        
        # 4. 統計情報
        total_users = len(user_time_data)
        active_users = len([u for u in user_time_data.values() 
                           if u["total_hours"] > 0 or u["total_minutes"] > 0])
        
        total_work_minutes = sum(u["total_hours"] * 60 + u["total_minutes"] 
                                for u in user_time_data.values())
        total_work_hours = total_work_minutes // 60
        total_work_mins = total_work_minutes % 60
        
        avg_hours_per_user = total_work_hours // active_users if active_users > 0 else 0
        
        statistics = {
            "total_users": total_users,
            "active_users": active_users,
            "total_work_time": f"{total_work_hours}時間{total_work_mins}分",
            "average_hours_per_user": avg_hours_per_user,
            "total_work_days": sum(u["work_days"] for u in user_time_data.values())
        }
        
        return SubpageResponse(
            success=True,
            users_summary=users_summary,
            monthly_summary=monthly_summary,
            recent_activities=recent_activities,
            statistics=statistics,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"サブページデータの取得中にエラーが発生しました: {str(e)}"
        )

@router.get("/user/{user_name}/monthly")
async def get_user_monthly_data(
    user_name: str,
    months: int = Query(default=12, description="表示する月数")
):
    """
    特定ユーザーの月別勤務データを取得
    """
    try:
        user_time_data = csv_loader.get_user_time_data()
        
        if user_name not in user_time_data:
            raise HTTPException(
                status_code=404,
                detail=f"ユーザー '{user_name}' のデータが見つかりません"
            )
        
        user_data = user_time_data[user_name]
        monthly_data = []
        
        # 月別データを取得
        sorted_months = sorted(user_data.get("monthly_hours", {}).keys(), reverse=True)[:months]
        
        for month_key in sorted_months:
            month_info = user_data["monthly_hours"][month_key]
            monthly_data.append({
                "month": month_key,
                "hours": month_info["hours"],
                "minutes": month_info["minutes"],
                "formatted": month_info["formatted"],
                "work_days": month_info["work_days"]
            })
        
        return {
            "success": True,
            "user_name": user_name,
            "monthly_data": monthly_data,
            "total_time": user_data["total_time_formatted"],
            "total_work_days": user_data["work_days"],
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"月別データの取得中にエラーが発生しました: {str(e)}"
        )

@router.get("/daily-chart")
async def get_daily_chart_data(
    days: int = Query(default=31, description="表示する日数"),
    top_users: int = Query(default=15, description="表示するユーザー数")
):
    """
    日別勤務時間グラフ用のデータを取得
    全ユーザーの日別勤務時間を返す
    """
    try:
        from datetime import datetime, timedelta
        
        user_time_data = csv_loader.get_user_time_data()
        
        # 勤務時間が多い順にユーザーを取得（全15人）
        sorted_users = sorted(
            user_time_data.items(),
            key=lambda x: x[1]["total_hours"] * 60 + x[1]["total_minutes"],
            reverse=True
        )[:top_users]
        
        # 日付リストを作成（過去N日分）
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        date_list = []
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y/%m/%d")
            # 月と日だけ表示用（01/15のような形式）
            display_date = current_date.strftime("%m/%d")
            date_list.append(display_date)
            current_date += timedelta(days=1)
        
        # グラフデータを作成
        chart_data = []
        for display_date in date_list:
            # YYYY/MM/DD形式に変換（2025年と仮定）
            month, day = display_date.split("/")
            full_date = f"2025/{month}/{day}"
            
            data_point = {"date": display_date}
            
            # 各ユーザーの勤務時間を追加
            for user_name, user_data in sorted_users:
                daily_hours_info = user_data.get("daily_hours", {}).get(full_date)
                if daily_hours_info:
                    # 時間を小数に変換（例：1時間30分 = 1.5）
                    hours = daily_hours_info.get("hours", 0)
                    minutes = daily_hours_info.get("minutes", 0)
                    decimal_hours = hours + (minutes / 60)
                    data_point[user_name] = round(decimal_hours, 2)
                    # 時間分形式も追加
                    data_point[f"{user_name}_formatted"] = f"{hours}時間{minutes}分" if hours > 0 or minutes > 0 else None
                else:
                    data_point[user_name] = None
                    data_point[f"{user_name}_formatted"] = None
            
            chart_data.append(data_point)
        
        # ユーザー情報（名前と色）
        user_configs = {}
        colors = [
            "hsl(var(--chart-1))",   # 1. 青
            "hsl(var(--chart-2))",   # 2. 緑
            "hsl(var(--chart-3))",   # 3. オレンジ
            "hsl(var(--chart-4))",   # 4. 紫
            "hsl(var(--chart-5))",   # 5. 赤
            "#06B6D4",               # 6. シアン
            "#8B5CF6",               # 7. バイオレット
            "#EC4899",               # 8. ピンク
            "#14B8A6",               # 9. ティール
            "#F59E0B",               # 10. アンバー
            "#84CC16",               # 11. ライム
            "#6366F1",               # 12. インディゴ
            "#F43F5E",               # 13. ローズ
            "#0EA5E9",               # 14. スカイ
            "#A855F7",               # 15. パープル
        ]
        
        for i, (user_name, _) in enumerate(sorted_users):
            user_configs[user_name] = {
                "label": user_name,
                "color": colors[i % len(colors)]
            }
        
        return {
            "success": True,
            "chart_data": chart_data,
            "user_configs": user_configs,
            "period": f"過去{days}日間",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"日別グラフデータの取得中にエラーが発生しました: {str(e)}"
        )

@router.get("/ranking")
async def get_ranking(
    period: str = Query(default="all", description="集計期間: all, month, week"),
    limit: int = Query(default=10, description="表示する人数")
):
    """
    勤務時間ランキングを取得
    """
    try:
        user_time_data = csv_loader.get_user_time_data()
        
        if period == "month":
            # 今月のランキング
            current_month = datetime.now().strftime("%Y/%m")
            ranking_data = []
            
            for user_name, data in user_time_data.items():
                month_data = data.get("monthly_hours", {}).get(current_month, {})
                if month_data:
                    total_minutes = month_data.get("total_minutes", 0)
                    ranking_data.append({
                        "name": user_name,
                        "total_minutes": total_minutes,
                        "hours": total_minutes // 60,
                        "minutes": total_minutes % 60,
                        "formatted": f"{total_minutes // 60}時間{total_minutes % 60}分",
                        "work_days": month_data.get("work_days", 0)
                    })
        else:
            # 全期間のランキング
            ranking_data = []
            for user_name, data in user_time_data.items():
                total_minutes = data["total_hours"] * 60 + data["total_minutes"]
                if total_minutes > 0:
                    ranking_data.append({
                        "name": user_name,
                        "total_minutes": total_minutes,
                        "hours": data["total_hours"],
                        "minutes": data["total_minutes"],
                        "formatted": data["total_time_formatted"],
                        "work_days": data["work_days"]
                    })
        
        # ソートして上位を取得
        ranking_data.sort(key=lambda x: x["total_minutes"], reverse=True)
        ranking_data = ranking_data[:limit]
        
        # ランク付け
        for i, item in enumerate(ranking_data):
            item["rank"] = i + 1
        
        return {
            "success": True,
            "period": period,
            "ranking": ranking_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ランキングデータの取得中にエラーが発生しました: {str(e)}"
        )
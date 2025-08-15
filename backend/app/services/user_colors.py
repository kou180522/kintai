"""
ユーザー名に基づいて固定の色を割り当てるモジュール
すべてのAPIエンドポイントで同じユーザーが同じ色になるように管理
"""

import hashlib

# 15色の固定カラーパレット
USER_COLORS = [
    "#3B82F6",  # 1. Blue - 青
    "#10B981",  # 2. Green - 緑
    "#F59E0B",  # 3. Orange - オレンジ
    "#8B5CF6",  # 4. Purple - 紫
    "#EF4444",  # 5. Red - 赤
    "#06B6D4",  # 6. Cyan - シアン
    "#EC4899",  # 7. Pink - ピンク
    "#14B8A6",  # 8. Teal - ティール
    "#F97316",  # 9. Dark Orange - ダークオレンジ
    "#84CC16",  # 10. Lime - ライム
    "#6366F1",  # 11. Indigo - インディゴ
    "#F43F5E",  # 12. Rose - ローズ
    "#0EA5E9",  # 13. Sky - スカイ
    "#A855F7",  # 14. Purple - パープル
    "#22C55E",  # 15. Emerald - エメラルド
]

# ユーザー名と色のマッピングをキャッシュ
_user_color_cache = {}
_color_index_counter = 0


def get_user_color(user_name: str) -> str:
    """
    ユーザー名に基づいて固定の色を返す
    同じユーザー名は常に同じ色を返す
    """
    global _user_color_cache, _color_index_counter
    
    if user_name not in _user_color_cache:
        # ユーザー名のハッシュ値を使って色を決定（一貫性のため）
        # ハッシュを使うことで、同じユーザー名は常に同じ色になる
        hash_value = int(hashlib.md5(user_name.encode()).hexdigest(), 16)
        color_index = hash_value % len(USER_COLORS)
        _user_color_cache[user_name] = USER_COLORS[color_index]
    
    return _user_color_cache[user_name]


def get_user_color_sequential(user_name: str) -> str:
    """
    ユーザー名に基づいて順番に色を割り当てる
    最初に登録されたユーザーから順に色を割り当てる
    """
    global _user_color_cache, _color_index_counter
    
    if user_name not in _user_color_cache:
        # 新しいユーザーには次の色を割り当て
        _user_color_cache[user_name] = USER_COLORS[_color_index_counter % len(USER_COLORS)]
        _color_index_counter += 1
    
    return _user_color_cache[user_name]


def get_all_user_colors(user_names: list) -> dict:
    """
    ユーザー名のリストに対して色のマッピングを返す
    順番に色を割り当てる（ユーザー名でソートして一貫性を保つ）
    """
    # ユーザー名でソートして、常に同じ順序で色を割り当てる
    sorted_users = sorted(user_names)
    color_map = {}
    
    for i, user_name in enumerate(sorted_users):
        color_map[user_name] = USER_COLORS[i % len(USER_COLORS)]
    
    return color_map


def reset_color_cache():
    """
    色のキャッシュをリセット（テスト用）
    """
    global _user_color_cache, _color_index_counter
    _user_color_cache = {}
    _color_index_counter = 0
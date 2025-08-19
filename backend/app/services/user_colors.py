"""
ユーザー名に基づいて固定の色を割り当てるモジュール
すべてのAPIエンドポイントで同じユーザーが同じ色になるように管理
"""

import hashlib

# 15色のプレミアムグラデーションカラーパレット
# モダンで洗練されたグラデーション色彩
USER_COLORS = [
    "#4F46E5",  # 1. ロイヤルパープル (Royal Purple) - 深みのある紫
    "#FB7185",  # 2. コーラルピンク (Coral Pink) - 優しいピンク
    "#0EA5E9",  # 3. オーシャンブルー (Ocean Blue) - 海のような青
    "#F97316",  # 4. サンセットオレンジ (Sunset Orange) - 夕焼け色
    "#10B981",  # 5. エメラルド (Emerald) - 宝石のような緑
    "#8B5CF6",  # 6. アメジスト (Amethyst) - 紫水晶色
    "#06B6D4",  # 7. ターコイズ (Turquoise) - 鮮やかな青緑
    "#EC4899",  # 8. マジェンタ (Magenta) - 華やかなピンク
    "#EAB308",  # 9. ゴールド (Gold) - 金色
    "#14B8A6",  # 10. ティール (Teal) - 青緑
    "#F59E0B",  # 11. アンバー (Amber) - 琥珀色
    "#6366F1",  # 12. インディゴ (Indigo) - 深い藍色
    "#84CC16",  # 13. ライム (Lime) - ライムグリーン
    "#A855F7",  # 14. ラベンダー (Lavender) - 藤色
    "#EF4444",  # 15. クリムゾン (Crimson) - 深紅色
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
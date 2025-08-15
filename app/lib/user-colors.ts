// ユーザーカラーの統一定義
// 15人分の固定カラーパレット

export const USER_COLORS = [
  "#3B82F6",  // 1. Blue - 青
  "#10B981",  // 2. Green - 緑
  "#F59E0B",  // 3. Orange - オレンジ
  "#8B5CF6",  // 4. Purple - 紫
  "#EF4444",  // 5. Red - 赤
  "#06B6D4",  // 6. Cyan - シアン
  "#EC4899",  // 7. Pink - ピンク
  "#14B8A6",  // 8. Teal - ティール
  "#F97316",  // 9. Dark Orange - ダークオレンジ
  "#84CC16",  // 10. Lime - ライム
  "#6366F1",  // 11. Indigo - インディゴ
  "#F43F5E",  // 12. Rose - ローズ
  "#0EA5E9",  // 13. Sky - スカイ
  "#A855F7",  // 14. Purple - パープル
  "#22C55E",  // 15. Emerald - エメラルド
];

// ユーザー名から対応する色を取得する関数
export function getUserColor(userIndex: number): string {
  return USER_COLORS[userIndex % USER_COLORS.length];
}

// ユーザー名のリストからカラー設定オブジェクトを生成
export function generateUserColorConfig(userNames: string[]): Record<string, string> {
  const config: Record<string, string> = {};
  userNames.forEach((name, index) => {
    config[name] = getUserColor(index);
  });
  return config;
}
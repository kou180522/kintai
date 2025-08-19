// ユーザーカラーの統一定義
// 15人分のプレミアムグラデーションカラーパレット
// モダンで洗練されたグラデーション色彩

export const USER_COLORS = [
  "#4F46E5",  // 1. ロイヤルパープル (Royal Purple) - 深みのある紫
  "#FB7185",  // 2. コーラルピンク (Coral Pink) - 優しいピンク
  "#0EA5E9",  // 3. オーシャンブルー (Ocean Blue) - 海のような青
  "#F97316",  // 4. サンセットオレンジ (Sunset Orange) - 夕焼け色
  "#10B981",  // 5. エメラルド (Emerald) - 宝石のような緑
  "#8B5CF6",  // 6. アメジスト (Amethyst) - 紫水晶色
  "#06B6D4",  // 7. ターコイズ (Turquoise) - 鮮やかな青緑
  "#EC4899",  // 8. マジェンタ (Magenta) - 華やかなピンク
  "#EAB308",  // 9. ゴールド (Gold) - 金色
  "#14B8A6",  // 10. ティール (Teal) - 青緑
  "#F59E0B",  // 11. アンバー (Amber) - 琥珀色
  "#6366F1",  // 12. インディゴ (Indigo) - 深い藍色
  "#84CC16",  // 13. ライム (Lime) - ライムグリーン
  "#A855F7",  // 14. ラベンダー (Lavender) - 藤色
  "#EF4444",  // 15. クリムゾン (Crimson) - 深紅色
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
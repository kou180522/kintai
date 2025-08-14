import type { Route } from "./+types/guidelines";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ガイドライン" },
    { name: "description", content: "勤怠管理システムの使い方ガイド" },
  ];
}

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 ease-in-out">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(100,100,120,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(100,100,120,0.3),transparent_50%)]"></div>
      </div>
      <div className="w-full max-w-4xl mx-auto px-4 py-8 relative z-10">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl transition-all duration-500 ease-in-out">
          <CardHeader className="py-6 px-8 bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm border-b border-gray-200/20 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                打刻方法ガイド
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* 基本的な使い方 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-amber-500">📝</span> 基本的な記録方法
              </h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">勤務開始時：</p>
                  <div className="space-y-2">
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">s</code> または <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">開始</code> と入力</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ※ 必ず勤務を開始する時点で記録してください
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ※ 休憩時間は記録不要です（勤務時間から自動的に除外されません）
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <p className="font-medium mb-2">勤務終了時：</p>
                  <div className="space-y-2">
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">f</code> または <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">終了</code> と入力</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ※ 終了記録を忘れると、その日の勤務時間が計算されません
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                  <p className="font-medium mb-2">重要なルール：</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 1日に複数回の勤務セッション（s→f）を記録できます</li>
                    <li>• 開始（s）と終了（f）は必ずペアで記録してください</li>
                    <li>• 日付が変わっても勤務が継続している場合、終了時刻は翌日の日付で記録されます</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 時刻調整機能 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-amber-500">⏰</span> 時刻調整機能（記録忘れの対処）
              </h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p>記録を忘れた場合や、実際の勤務時刻と異なる時刻に記録してしまった場合の調整方法：</p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium mb-3">調整パターン：</p>
                  <ul className="space-y-3 ml-4">
                    <li>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">s+90</code> - 現在時刻から90分後の時刻として記録
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        例：10:00に記録 → 11:30として記録される
                      </p>
                    </li>
                    <li>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">s-30</code> - 現在時刻から30分前の時刻として記録
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        例：10:00に記録 → 9:30として記録される
                      </p>
                    </li>
                    <li>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">f-120</code> - 2時間前に終了したものとして記録
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        例：20:00に記録 → 18:00として記録される
                      </p>
                    </li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="font-medium mb-2">使用例：</p>
                  <ul className="text-sm space-y-2">
                    <li>• 朝9時に出社したが記録を忘れ、10時半に気づいた場合：<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">s-90</code></li>
                    <li>• 18時に退社したが記録を忘れ、20時に気づいた場合：<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">f-120</code></li>
                  </ul>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-l-4 border-indigo-500">
                  <p className="font-medium mb-3">特定時刻の直接指定：</p>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">s18:00</code> - 18:00に開始として記録
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        例：21:00に記録 → 18:00として記録される
                      </p>
                    </li>
                    <li>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">f19:30</code> - 19:30に終了として記録  
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        例：20:00に記録 → 19:30として記録される
                      </p>
                    </li>
                  </ul>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded mt-3">
                    <p className="text-xs font-mono">
                      使用例：<br/>
                      実際：09:00出社、18:00退社<br/>
                      記録忘れ：20:00に気づく<br/>
                      入力：<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">s09:00</code> → 09:00として記録<br/>
                      入力：<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">f18:00</code> → 18:00として記録
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded mt-3">
                    <p className="text-xs">
                      <span className="font-semibold">メリット：</span> 指定時刻が直接記録されるため、正確な勤務時間を後から入力できます
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <p className="text-sm"><span className="font-semibold">重要：</span></p>
                  <ul className="text-sm space-y-1 ml-4 mt-2">
                    <li>• 調整値は必ず分単位で指定してください（60 = 1時間）</li>
                    <li>• マイナス値で過去、プラス値で未来の時刻になります</li>
                    <li>• 日付をまたぐ調整も自動的に処理されます</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* エラー時の対処 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-amber-500">⚠️</span> 入力ミスの自動補正機能
              </h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <p className="font-medium mb-3">ケース1：連続して開始を入力（s/s/f パターン）</p>
                  <div className="ml-4 space-y-2">
                    <p className="text-sm">誤って開始を2回入力してしまった場合の処理：</p>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded mt-2">
                      <p className="text-xs font-mono">
                        09:00 s ← <span className="text-red-500">無視される</span><br/>
                        09:30 s ← <span className="text-green-500">採用される</span><br/>
                        18:00 f
                      </p>
                      <p className="text-sm mt-2">
                        → 勤務時間：09:30〜18:00（8時間30分）として計算
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <p className="font-medium mb-3">ケース2：連続して終了を入力（s/f/f パターン）</p>
                  <div className="ml-4 space-y-2">
                    <p className="text-sm">誤って終了を2回入力してしまった場合の処理：</p>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded mt-2">
                      <p className="text-xs font-mono">
                        09:00 s<br/>
                        18:00 f ← <span className="text-green-500">採用される</span><br/>
                        18:30 f ← <span className="text-red-500">無視される</span>
                      </p>
                      <p className="text-sm mt-2">
                        → 勤務時間：09:00〜18:00（9時間）として計算
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
                  <p className="font-medium mb-2">注意事項：</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 自動補正はあくまで補助機能です</li>
                    <li>• 正確な記録を心がけてください</li>
                    <li>• 不明な点は管理者に確認してください</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* データの見方 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-amber-500">📊</span> データの見方
              </h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">ホームページ：</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• 日別の勤務時間グラフ</li>
                      <li>• リアルタイム更新（30秒ごと）</li>
                      <li>• 直近31日間のデータ</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">履歴ページ：</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• 月別の勤務時間推移</li>
                      <li>• 過去12ヶ月のデータ</li>
                      <li>• ユーザー別の詳細表示</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 注意事項 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-amber-500">📌</span> 重要な注意事項とルール
              </h2>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
                  <p className="font-medium mb-2">システムの制限事項：</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <span className="font-semibold">12時間超の勤務</span>：連続12時間を超える勤務は異常値として検出され、警告が表示されます</li>
                    <li>• <span className="font-semibold">未完了セッション</span>：終了時刻（f）がない記録は勤務時間に含まれません</li>
                    <li>• <span className="font-semibold">開始なしの終了</span>：開始時刻（s）なしで終了（f）を記録した場合、その終了記録は無視されます</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium mb-2">データ同期について：</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <span className="font-semibold">Google スプレッドシート</span>：全データは自動的にGoogleスプレッドシートと同期されます</li>
                    <li>• <span className="font-semibold">更新頻度</span>：30秒ごとに自動更新（手動更新も可能）</li>
                    <li>• <span className="font-semibold">データ保持期間</span>：全期間のデータが保存されます</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="font-medium mb-2">深夜勤務・日またぎ勤務：</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <span className="font-semibold">深夜勤務</span>：22:00〜翌5:00の勤務も正しく計算されます</li>
                    <li>• <span className="font-semibold">日付またぎ</span>：23:00開始、翌2:00終了のような勤務も正確に処理</li>
                    <li>• <span className="font-semibold">記録の日付</span>：開始と終了はそれぞれの実際の日付で記録してください</li>
                  </ul>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded mt-3">
                    <p className="text-xs font-mono">
                      例：<br/>
                      2025/08/12 23:00 s<br/>
                      2025/08/13 02:00 f<br/>
                      → 3時間の勤務として正しく計算
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
                  <p className="font-medium mb-2">勤務時間の計算ルール：</p>
                  <ul className="space-y-2 text-sm">
                    <li>• <span className="font-semibold">複数セッション</span>：1日に複数回の s→f がある場合、全セッションの合計が計算されます</li>
                    <li>• <span className="font-semibold">休憩時間</span>：休憩時間は自動で除外されません（手動で終了・開始を記録）</li>
                    <li>• <span className="font-semibold">最小単位</span>：1分単位で記録・計算されます</li>
                    <li>• <span className="font-semibold">月次集計</span>：月の合計勤務時間は自動集計されます</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ショートカット */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-amber-500">⌨️</span> 便利な機能
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                  <p className="font-medium mb-2">自動更新：</p>
                  <p className="text-sm">データは30秒ごとに自動更新されます</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg">
                  <p className="font-medium mb-2">手動更新：</p>
                  <p className="text-sm">更新ボタンで即座にデータを取得</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                  <p className="font-medium mb-2">ユーザー選択：</p>
                  <p className="text-sm">グラフのユーザー名をクリックで強調表示</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                  <p className="font-medium mb-2">テーマ切替：</p>
                  <p className="text-sm">左上のボタンでライト/ダークモード切替</p>
                </div>
              </div>
            </section>

            {/* お問い合わせ */}
            <section className="border-t pt-6">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <p className="text-sm">不明な点がある場合は、管理者にお問い合わせください</p>
                <p className="text-xs mt-2">Version 1.0.0</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
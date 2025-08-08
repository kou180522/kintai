import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // リクエストボディの内容をログ出力
    console.log('APIテスト - 受信データ:', body)
    
    // レスポンスデータの作成
    const responseData = {
      success: true,
      message: 'APIテスト成功',
      received: body,
      serverTime: new Date().toISOString(),
      processedBy: 'テストAPIエンドポイント'
    }
    
    // 成功レスポンスを返す
    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('APIエラー:', error)
    
    // エラーレスポンスを返す
    return NextResponse.json(
      { 
        success: false, 
        error: 'APIの処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: true,
      message: 'テストAPIエンドポイントは正常に動作しています',
      methods: ['GET', 'POST'],
      endpoint: '/api/test'
    },
    { status: 200 }
  )
}
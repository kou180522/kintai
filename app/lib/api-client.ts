/**
 * APIクライアント設定
 * 環境に応じて適切なAPIエンドポイントを返す
 */

export function getApiUrl(): string {
  // 開発環境
  if (import.meta.env.DEV) {
    return 'http://localhost:8001';
  }
  
  // 本番環境では同じドメインの/apiパスを使用
  // Vercel Functionsが/apiで自動的にルーティングされる
  return '';
}

export async function fetchApi(path: string, options?: RequestInit) {
  const apiUrl = getApiUrl();
  
  // キャッシュを無効化するためにタイムスタンプを追加
  const separator = path.includes('?') ? '&' : '?';
  const pathWithTimestamp = `${path}${separator}_t=${Date.now()}`;
  
  const url = apiUrl ? `${apiUrl}${pathWithTimestamp}` : pathWithTimestamp;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}
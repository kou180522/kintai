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
  const url = apiUrl ? `${apiUrl}${path}` : path;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
/**
 * APIクライアント設定
 * 環境に応じて適切なAPIエンドポイントを返す
 */

export function getApiUrl(): string {
  // 本番環境とローカル環境の両方でVercel Functionsを使用
  // React Router v7はローカルでもAPIルートを処理可能
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
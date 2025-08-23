/**
 * APIクライアント設定
 * 環境に応じて適切なAPIエンドポイントを返す
 */

export function getApiUrl(): string {
  // ビルド時の環境変数を優先
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 本番環境かどうかをチェック
  if (import.meta.env.PROD) {
    // VercelやNetlifyなどの本番環境では、
    // 同じドメインの/apiパスを使用（プロキシ経由）
    return '';
  }
  
  // 開発環境のデフォルト
  return 'http://localhost:8001';
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
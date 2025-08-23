import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = params['*'];
  const apiUrl = `${API_URL}/api/${path}${url.search}`;

  try {
    const response = await fetch(apiUrl, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const path = params['*'];
  const apiUrl = `${API_URL}/api/${path}${url.search}`;

  try {
    const body = await request.text();
    const response = await fetch(apiUrl, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: body || undefined,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
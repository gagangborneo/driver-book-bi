// API helper for SI-LAMIN
export const api = async (endpoint: string, options: RequestInit = {}, token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: response.statusText || 'Unknown error' };
  }
  
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Request failed');
  }
  
  return data;
};

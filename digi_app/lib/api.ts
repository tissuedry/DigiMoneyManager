// Helper to prepend basePath for client-side API requests
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Next.js client-side requests under basePath need /digimoney prefix
  if (typeof window !== 'undefined') {
    return `/digimoney${cleanPath}`;
  }
  return cleanPath;
}

function inferBaseUrl(requestHeaders?: Headers): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const host =
    requestHeaders?.get("x-forwarded-host") ||
    requestHeaders?.get("host");

  if (host) {
    const proto =
      requestHeaders?.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function getApiUrl(path: string, requestHeaders?: Headers): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${inferBaseUrl(requestHeaders)}${path}`;
}
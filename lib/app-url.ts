function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicitUrl) {
    return stripTrailingSlash(explicitUrl);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return `https://${stripTrailingSlash(productionUrl)}`;
  }

  const previewUrl = process.env.VERCEL_URL?.trim();
  if (previewUrl) {
    return `https://${stripTrailingSlash(previewUrl)}`;
  }

  return "http://localhost:3000";
}

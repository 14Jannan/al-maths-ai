// A JWT has 3 base64 parts separated by dots: header.payload.signature
// We only need to read the payload (the claims) — no verification needed here
// since the browser can't verify a signature anyway; the backend already did
// that. This is purely for deciding what UI to show.
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    // JWT base64url isn't quite standard base64 — swap the special characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function getRoleFromToken(token: string): string | string[] | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  // ASP.NET Core Identity writes role claims under this long URI by default,
  // not simply "role" — this is a well-known .NET quirk.
  return (payload[ROLE_CLAIM] as string | string[] | undefined) ?? null;
}
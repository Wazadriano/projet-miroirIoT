const API_URL = import.meta.env.VITE_API_URL || "";

let token: string | null = localStorage.getItem("token");
let boutiqueId: string | null = localStorage.getItem("boutique_id");
let isRedirectingToLogin = false;

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export function getToken() {
  return token;
}

export function setBoutiqueId(id: string | null) {
  boutiqueId = id;
  if (id) localStorage.setItem("boutique_id", id);
  else localStorage.removeItem("boutique_id");
}

export function getBoutiqueId() {
  return boutiqueId;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & {
    params?: Record<string, string>;
    boutiqueId?: string;
  } = {},
): Promise<T> {
  const { params, boutiqueId: overrideBoutiqueId, ...init } = options;
  let url = `${API_URL}/api/${path.replace(/^\//, "")}`;

  if (params) {
    const sp = new URLSearchParams(params);
    url += "?" + sp.toString();
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (overrideBoutiqueId) headers["X-Boutique-Id"] = overrideBoutiqueId;
  else if (boutiqueId) headers["X-Boutique-Id"] = boutiqueId;

  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    setToken(null);
    if (!isRedirectingToLogin) {
      isRedirectingToLogin = true;
      window.location.href = "/login";
    }
    throw new Error("Non authentifié");
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Erreur serveur" }));
    throw new Error(err.message || `Erreur ${res.status}`);
  }

  return res.json();
}

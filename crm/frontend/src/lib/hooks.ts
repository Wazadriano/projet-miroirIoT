import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getBoutiqueId } from "./api";
import type {
  Paginated,
  Cliente,
  Seance,
  Miroir,
  Media,
  Produit,
  User,
  Boutique,
  DashboardStats,
} from "./types";

/** Returns current boutique scope for query keys */
function bk() {
  return getBoutiqueId() || "none";
}

export function useClientes(page = 1, search = "") {
  return useQuery({
    queryKey: ["clientes", bk(), page, search],
    queryFn: () =>
      api<Paginated<Cliente>>("clientes", {
        params: { page: String(page), ...(search ? { search } : {}) },
      }),
  });
}

export function useAllClientes(
  page = 1,
  search = "",
  filters: {
    sexe?: string;
    boutique_id?: string;
    sort_by?: string;
    sort_dir?: string;
  } = {},
) {
  return useQuery({
    queryKey: ["clientes-all", bk(), page, search, filters],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page) };
      if (search) params.search = search;
      if (filters.sexe) params.sexe = filters.sexe;
      if (filters.boutique_id) params.boutique_id = filters.boutique_id;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_dir) params.sort_dir = filters.sort_dir;
      return api<
        Paginated<Cliente & { boutique?: { id: string; nom: string } }>
      >("clientes/all", { params });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats", bk()],
    queryFn: () => api<DashboardStats>("dashboard/stats"),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["cliente", id],
    queryFn: () => api<Cliente>(`clientes/detail/${id}`),
  });
}

export function useClienteSeances(id: string, page = 1) {
  return useQuery({
    queryKey: ["cliente-seances", id, page],
    queryFn: () =>
      api<Paginated<Seance>>(`clientes/detail/${id}/seances`, {
        params: { page: String(page) },
      }),
  });
}

export function useSeances(page = 1) {
  return useQuery({
    queryKey: ["seances", bk(), page],
    queryFn: () =>
      api<Paginated<Seance>>("seances", { params: { page: String(page) } }),
  });
}

export function useSeance(id: string) {
  return useQuery({
    queryKey: ["seance", id],
    queryFn: () => api<Seance>(`seances/${id}`),
  });
}

export function useMiroirs() {
  return useQuery({
    queryKey: ["miroirs", bk()],
    queryFn: () => api<Miroir[]>("miroirs"),
    refetchInterval: 60_000, // fallback — WebSocket couvre les mises à jour temps réel
  });
}

export function useMedias() {
  return useQuery({
    queryKey: ["medias", bk()],
    queryFn: () => api<Media[]>("medias"),
  });
}

export function useProduits(page = 1, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["produits", bk(), page, filters],
    queryFn: () =>
      api<Paginated<Produit>>("produits", {
        params: { page: String(page), ...filters },
      }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("users"),
  });
}

export function useBoutiques(page = 1) {
  return useQuery({
    queryKey: ["boutiques", page],
    queryFn: () =>
      api<Paginated<Boutique>>("boutiques", { params: { page: String(page) } }),
    enabled: false,
  });
}

export function useBoutiquesList() {
  return useQuery({
    queryKey: ["boutiques-list"],
    queryFn: () => api<{ id: string; nom: string }[]>("boutiques/list"),
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (key: string) => qc.invalidateQueries({ queryKey: [key] });
}

export function useMutationApi<TData = unknown, TBody = unknown>(
  path: string,
  method: string = "POST",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TBody) =>
      api<TData>(path, {
        method,
        body: body instanceof FormData ? body : JSON.stringify(body),
      }),
  });
}

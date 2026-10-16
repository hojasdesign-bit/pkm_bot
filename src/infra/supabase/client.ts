/**
 * Minimal Supabase REST (PostgREST) client using fetch.
 * No supabase-js dependency, Workers-friendly.
 * Uses the service-role key server-side only (never exposed to clients).
 */
export class SupabaseRest {
  private url: string;
  private key: string;

  constructor(url: string, serviceRoleKey: string) {
    this.url = url.replace(/\/$/, "");
    this.key = serviceRoleKey;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  private async request<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: this.headers(init.headers as Record<string, string> | undefined),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
    }
    const text = await res.text();
    if (!text) return [] as unknown as T;
    return JSON.parse(text) as T;
  }

  async select<T>(table: string, query = "select=*"): Promise<T[]> {
    return this.request<T[]>(`${table}?${query}`, { method: "GET" });
  }

  async selectOne<T>(
    table: string,
    query = "select=*",
  ): Promise<T | null> {
    const rows = await this.select<T>(table, `${query}&limit=1`);
    return rows[0] ?? null;
  }

  async insert<T>(table: string, row: Record<string, unknown>): Promise<T> {
    const rows = await this.request<T[]>(table, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    return rows[0] as T;
  }

  async update<T>(
    table: string,
    filterQuery: string,
    patch: Record<string, unknown>,
  ): Promise<T[]> {
    return this.request<T[]>(`${table}?${filterQuery}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
  }

  async delete(table: string, filterQuery: string): Promise<void> {
    await this.request(`${table}?${filterQuery}`, { method: "DELETE" });
  }
}

export function eq(column: string, value: string | number | boolean): string {
  return `${column}=eq.${encodeURIComponent(String(value))}`;
}

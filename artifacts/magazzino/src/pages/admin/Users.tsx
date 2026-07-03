import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff, Loader2 } from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/users", { credentials: "include" });
  if (!res.ok) throw new Error("Errore nel caricamento utenti");
  return res.json();
}

async function patchRole(id: number, role: "admin" | "client") {
  const res = await fetch(`/api/users/${id}/role`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Errore aggiornamento ruolo");
  return res.json();
}

export default function Users() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/users"],
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: "admin" | "client" }) =>
      patchRole(id, role),
    onMutate: ({ id }) => setPendingId(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Ruolo aggiornato" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
    onSettled: () => setPendingId(null),
  });

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-serif">Gestione Utenti</h1>
        <p className="text-muted-foreground mt-2">
          {users.length} utenti registrati · {adminCount} admin
        </p>
      </div>

      <div className="bg-card border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16 text-muted-foreground gap-3">
            <Loader2 size={20} className="animate-spin" />
            Caricamento…
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50">
              <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="p-4 font-bold">Utente</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Registrato</th>
                <th className="p-4 font-bold">Ruolo</th>
                <th className="p-4 font-bold text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{u.name || "—"}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-sm ${
                        u.role === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role === "admin" && <Shield size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.role === "admin" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        disabled={pendingId === u.id}
                        onClick={() => mutation.mutate({ id: u.id, role: "client" })}
                      >
                        {pendingId === u.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ShieldOff size={12} />
                        )}
                        Rimuovi Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs gap-1.5"
                        disabled={pendingId === u.id}
                        onClick={() => mutation.mutate({ id: u.id, role: "admin" })}
                      >
                        {pendingId === u.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Shield size={12} />
                        )}
                        Rendi Admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && users.length === 0 && (
          <p className="text-center p-8 text-muted-foreground">Nessun utente trovato.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Nota: il ruolo admin viene assegnato al momento del login. Modifiche immediate.
      </p>
    </div>
  );
}

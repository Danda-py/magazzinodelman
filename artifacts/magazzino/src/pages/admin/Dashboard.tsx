import { useState } from "react";
import { useGetFinancialSummary, useListFinancialItems, getGetFinancialSummaryQueryKey, getListFinancialItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useDeleteFinancialItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/financial/items/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Errore durante la rimozione");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListFinancialItemsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
    },
  });
}

export default function Dashboard() {
  const { data: summary, isLoading: sLoading } = useGetFinancialSummary();
  const { data: items, isLoading: iLoading } = useListFinancialItems();
  const deleteItem = useDeleteFinancialItem();

  // id of the item pending confirmation, null when dialog is closed
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  if (sLoading || iLoading || !summary) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-muted w-1/4" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-muted" />
          <div className="h-32 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
        <div className="h-96 bg-muted" />
      </div>
    );
  }

  const pendingItem = items?.find(i => i.id === pendingDelete);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-serif">Financial Overview</h1>
        <p className="text-muted-foreground mt-2">Dati aggiornati in tempo reale.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 shadow-sm">
          <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Ricavi Totali</p>
          <p className="text-4xl font-mono mt-2">€{summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border p-6 shadow-sm">
          <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Costi / Commissioni</p>
          <p className="text-4xl font-mono mt-2">€{summary.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-primary text-primary-foreground p-6 shadow-sm">
          <p className="text-sm font-bold tracking-widest uppercase opacity-80">Utile Netto</p>
          <p className="text-4xl font-mono mt-2">€{summary.totalProfit.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-card border border-border p-6 shadow-sm">
          <h3 className="font-serif text-xl mb-6">Andamento Mensile</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `€${v}`} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Ricavi" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="hsl(var(--muted-foreground))" name="Profitto" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales table */}
        <div className="bg-card border border-border p-6 shadow-sm">
          <h3 className="font-serif text-xl mb-6">Registro Vendite</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Articolo</th>
                  <th className="pb-3 font-bold">Prezzo</th>
                  <th className="pb-3 font-bold">Comm.</th>
                  <th className="pb-3 font-bold text-right">Netto</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items?.map(item => (
                  <tr key={item.id} className="group">
                    <td className="py-3 font-medium">{item.productTitle}</td>
                    <td className="py-3 font-mono">€{item.salePrice.toFixed(2)}</td>
                    <td className="py-3 text-muted-foreground">
                      {item.commissionType === 'percentage'
                        ? `${item.commissionValue}%`
                        : `€${item.commissionValue}`}
                    </td>
                    <td className="py-3 font-mono font-bold text-right text-primary">
                      €{item.netProfit.toFixed(2)}
                    </td>
                    <td className="py-3 pl-3">
                      <button
                        onClick={() => setPendingDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                        title="Rimuovi record"
                        aria-label={`Rimuovi ${item.productTitle}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!items || items.length === 0) && (
              <p className="text-center text-muted-foreground py-8 font-light">
                Nessuna transazione registrata.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovere questo record?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingItem ? (
                <>
                  Stai per eliminare definitivamente il record di{" "}
                  <span className="font-medium text-foreground">{pendingItem.productTitle}</span>{" "}
                  (€{pendingItem.salePrice.toFixed(2)} ricavo, €{pendingItem.netProfit.toFixed(2)} netto).
                  <br />
                  Questa azione aggiornerà i totali dell'ERP e non può essere annullata.
                </>
              ) : (
                "Questa azione non può essere annullata."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDelete !== null) {
                  await deleteItem.mutateAsync(pendingDelete);
                  setPendingDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItem.isPending ? "Rimozione…" : "Elimina record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

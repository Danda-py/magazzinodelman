import { useState, useEffect } from "react";
import { useGetCmsContent, useUpdateCmsContent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Cms() {
  const { data: cms, isLoading } = useGetCmsContent();
  const updateCms = useUpdateCmsContent();
  const { toast } = useToast();

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (cms) setFormData(cms);
  }, [cms]);

  if (isLoading || !cms) return <div>Loading...</div>;

  const handleSave = async () => {
    try {
      await updateCms.mutateAsync({ data: formData });
      toast({ title: "CMS Aggiornato", description: "Le modifiche sono ora online." });
    } catch (e) {
      toast({ title: "Errore", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif">Gestione CMS</h1>
        <p className="text-muted-foreground mt-2">Modifica i testi pubblici del sito.</p>
      </div>

      <div className="bg-card border border-border p-8 shadow-sm space-y-8">
        
        <div className="space-y-4">
          <h2 className="font-serif text-xl border-b border-border pb-2">Sezione Hero</h2>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Titolo</label>
            <Input 
              value={formData.heroHeadline || ''} 
              onChange={e => setFormData({...formData, heroHeadline: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sottotitolo</label>
            <Input 
              value={formData.heroSubheadline || ''} 
              onChange={e => setFormData({...formData, heroSubheadline: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-xl border-b border-border pb-2">Sezione Chi Siamo</h2>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Titolo</label>
            <Input 
              value={formData.chiSiamoTitle || ''} 
              onChange={e => setFormData({...formData, chiSiamoTitle: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Testo (HTML/BR supportati)</label>
            <textarea 
              className="w-full min-h-[150px] border border-input bg-transparent p-4 text-sm focus:outline-none focus:border-primary"
              value={formData.chiSiamoBody || ''} 
              onChange={e => setFormData({...formData, chiSiamoBody: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome Founder</label>
            <Input 
              value={formData.founderName || ''} 
              onChange={e => setFormData({...formData, founderName: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <Button onClick={handleSave} className="h-12 px-8" disabled={updateCms.isPending}>
            {updateCms.isPending ? "Salvataggio..." : "Salva Modifiche"}
          </Button>
        </div>
      </div>
    </div>
  );
}

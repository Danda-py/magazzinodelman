import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetProposal, getGetProposalQueryKey, useListMessages, getListMessagesQueryKey, useSendMessage, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Chat() {
  const params = useParams();
  const id = parseInt(params.proposalId || "0", 10);
  
  const { data: proposal, isLoading: pLoading } = useGetProposal(id, { query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) } });
  const { data: messages = [], isLoading: mLoading } = useListMessages(id, { query: { enabled: !!id, refetchInterval: 3000, queryKey: getListMessagesQueryKey(id) } });
  const sendMessage = useSendMessage();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (pLoading || mLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!proposal) return <div>Proposta non trovata.</div>;

  const isAdmin = user?.role === 'admin';
  const myRole = isAdmin ? 'admin' : 'client';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    await sendMessage.mutateAsync({
      id,
      data: {
        content,
        senderRole: myRole,
        senderName: user?.name || (isAdmin ? "Admin" : "Cliente")
      }
    });
    setContent("");
    queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(id) });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex flex-col h-[calc(100vh-80px)]">
        <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
          <Link href={isAdmin ? "/admin/inventory" : "/store"} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl">Chat: {proposal.itemName}</h1>
            <p className="text-sm text-muted-foreground">Status: <span className="font-medium uppercase tracking-wider">{proposal.status}</span></p>
          </div>
        </div>

        {proposal.status === 'pending' && (
          <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-4 border border-yellow-500/20 mb-6 text-sm">
            Proposta in attesa — usa questa chat per trattare la percentuale con il team prima dell'accettazione formale.
          </div>
        )}

        <div className="flex-1 bg-card border border-border p-6 overflow-y-auto mb-6 space-y-6 flex flex-col">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground m-auto font-light">Nessun messaggio. Inizia la conversazione.</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === myRole;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                  <span className={`text-[10px] uppercase tracking-widest text-muted-foreground mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.senderName || msg.senderRole}
                  </span>
                  <div className={`p-4 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-4">
          <Input 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 h-14"
            disabled={proposal.status === 'rejected' || sendMessage.isPending}
          />
          <Button 
            type="submit" 
            className="h-14 px-8"
            disabled={proposal.status === 'rejected' || sendMessage.isPending || !content.trim()}
          >
            <Send size={20} />
          </Button>
        </form>
      </main>
    </div>
  );
}

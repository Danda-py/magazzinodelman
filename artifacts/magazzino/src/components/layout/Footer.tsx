export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-serif text-2xl tracking-tight">IL MAGAZZINO DEL MAN</div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-mono">
          <p>Copyright Il magazzino del MAN 2026. Tutti i diritti riservati.</p>
          <p>Sito di Andaloro Davide</p>
        </div>
      </div>
    </footer>
  );
}

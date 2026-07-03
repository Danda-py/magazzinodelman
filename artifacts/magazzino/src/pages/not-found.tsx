import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-serif text-foreground">
          404 Not Found
        </h1>
        <p className="mt-4 text-muted-foreground">
          La pagina che stai cercando non esiste.
        </p>
        <div className="mt-8">
          <Link href="/" className="inline-flex h-12 items-center justify-center bg-primary text-primary-foreground px-8 font-medium">
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GhostIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-border bg-card/80 shadow-xl">
        <GhostIcon className="h-16 w-16 text-muted-foreground mb-2" />
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground mb-4">
          La página que buscás no existe o fue movida.
        </p>
        <Link href="/protected">
          <Button variant="default" size="lg">
            Volver al panel principal
          </Button>
        </Link>
      </div>
    </div>
  );
} 
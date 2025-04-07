import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Send, Loader2 } from "lucide-react";

export default async function ForgotPassword(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  // Esperar a que la promesa de searchParams se resuelva
  const searchParams = await props.searchParams;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      {searchParams?.message && (
        <FormMessage message={{ message: searchParams.message }} />
      )}

      <form action={forgotPasswordAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>Correo electrónico</span>
          </Label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              required
              className="pl-3 pr-3 py-2 h-10 bg-background/50 border-border/50 focus:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </div>
        </div>

        <SubmitButton variant="default" size="default" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 transition-all duration-300 group flex items-center justify-center gap-1">
          <span>Enviar enlace</span>
          <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          <Loader2 className="h-4 w-4 animate-spin mr-1 hidden group-[.submitting]:block" />
        </SubmitButton>
      </form>

      <div className="text-center text-sm">
        <Link
          href="/sign-in"
          className="text-blue-500 hover:text-blue-600 hover:underline transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Volver a iniciar sesión</span>
        </Link>
      </div>
    </div>
  );
}

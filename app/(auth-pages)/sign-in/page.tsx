import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Mail, Lock, Loader2 } from "lucide-react";

export default async function Login(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  // Esperar a que la promesa de searchParams se resuelva
  const searchParams = await props.searchParams;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      {searchParams?.message && (
        <FormMessage message={{ message: searchParams.message }} />
      )}

      <form action={signInAction} className="space-y-5">
        <div className="space-y-4">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span>Contraseña</span>
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="pl-3 pr-3 py-2 h-10 bg-background/50 border-border/50 focus:border-blue-500 focus-visible:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" name="remember" />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Recordar mi sesión
            </Label>
          </div>
        </div>

        <SubmitButton variant="default" size="default" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 transition-all duration-300 group flex items-center justify-center gap-1">
          <span>Iniciar sesión</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          <Loader2 className="h-4 w-4 animate-spin mr-1 hidden group-[.submitting]:block" />
        </SubmitButton>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50"></span>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">o continúa con</span>
        </div>
      </div>

      <div>
        <Link
          href="/api/auth/google"
          className="w-full inline-flex items-center justify-center bg-white hover:bg-gray-50 text-black font-medium h-10 px-4 py-2 rounded-md border border-gray-300 transition-colors duration-200 group"
        >
          <svg
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm">Continuar con Google</span>
        </Link>
      </div>

      <div className="text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <Link
          href="/sign-up"
          className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
        >
          Regístrate
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LoginWithGoogle from "@/app/components/auth/login-with-google";
import { signInAction } from "@/app/actions";

export default async function SignIn({
  searchParams,
}: {
  searchParams: { message?: string } | Promise<{ message?: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Obtener el mensaje de los parámetros de búsqueda
  const params = await searchParams;
  const message = params?.message;

  if (user) {
    return redirect("/protected/dashboard");
  }

  return (
    <>
      {/* Fondo con patrón */}
      <div className="fixed inset-0 bg-background -z-10 opacity-50">
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
          <defs>
            <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
              <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-foreground/10" />
            </pattern>
            <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
              <circle cx='40' cy='40' r='1' fill='currentColor' className="text-foreground/5" />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern)' />
          <rect width='100%' height='100%' fill='url(#pattern2)' />
        </svg>
      </div>
      
      {/* Efectos de fondo con animación */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md px-4 py-8 mx-auto">
          {/* Logo UTN envuelto en Link */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="block cursor-pointer" aria-label="Ir a la página de inicio">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-teal-600/10 rounded-xl blur-lg"></div>
                <div className="bg-white/90 backdrop-filter backdrop-blur-sm p-3 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-teal-50 opacity-90"></div>
                  <div className="absolute inset-0 bg-white/60 mix-blend-overlay"></div>
                  <Image 
                    src={`/utn-logo.png`} 
                    alt="Logo UTN" 
                    width={180}
                    height={60}
                    className="h-12 w-auto object-contain relative z-10 contrast-125 brightness-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-teal-500/10"></div>
                </div>
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-transparent to-teal-500/20 blur-md -z-10"></div>
              </div>
            </Link>
          </div>

          {/* Formulario con estilo moderno */}
          <div className="relative animate-fade-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-teal-600/20 rounded-xl blur-md opacity-70"></div>
            <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border/40 shadow-lg">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">Iniciar Sesión</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>

              <form className="space-y-5" action={signInAction}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium">
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-1 block w-full px-3 py-2.5 border border-border/60 rounded-md shadow-sm bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-blue-500/40 focus:border-blue-500/40 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="mt-1 block w-full px-3 py-2.5 border border-border/60 rounded-md shadow-sm bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-blue-500/40 focus:border-blue-500/40 text-white"
                    />
                  </div>
                </div>

                {message && (
                  <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md">
                    <p className="text-sm">{message}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Iniciar sesión
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </div>
              </form>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card/90 text-muted-foreground">O continuar con</span>
                </div>
              </div>

              <div className="mt-6">
                <LoginWithGoogle />
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/sign-up" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                    Regístrate
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-muted-foreground text-xs">
            <p>Universidad Tecnológica Nacional - Sistema de Gestión de Convenios</p>
            <p className="mt-1">© {new Date().getFullYear()} - Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </>
  );
} 
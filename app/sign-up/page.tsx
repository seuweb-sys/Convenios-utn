import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SignUpForm } from "./SignUpForm";

export default async function SignUp({
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
    return redirect("/protected/");
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
        <div className="absolute -top-[30%] -left-[10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md px-4 py-8 mx-auto">
          {/* Logo UTN envuelto en Link */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="block cursor-pointer" aria-label="Ir a la página de inicio">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-teal-600/10 rounded-xl blur-lg"></div>
                <div className="bg-white/95 backdrop-filter backdrop-blur-sm p-4 rounded-xl shadow-lg relative overflow-hidden w-[100px] h-[100px] flex items-center justify-center border border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-teal-50 opacity-90"></div>
                  <div className="absolute inset-0 bg-white/60 mix-blend-overlay"></div>
                  <img
                    src="/utn-logo.png"
                    alt="Logo UTN"
                    className="w-[80px] h-[64px] object-contain relative z-10 contrast-125 brightness-105"
                    style={{
                      width: '80px',
                      height: '64px',
                      objectFit: 'contain'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-teal-500/10"></div>
                </div>
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-transparent to-teal-500/20 blur-md -z-10"></div>
              </div>
            </Link>
          </div>

          <SignUpForm message={message} />

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
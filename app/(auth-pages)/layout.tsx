import Image from "next/image";
import Link from "next/link";
import "./auth.css";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Fondo con patrón */}
      <div className="fixed inset-0 bg-background -z-10 opacity-80">
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
          <defs>
            <pattern id='pattern' width='40' height='40' patternUnits='userSpaceOnUse'>
              <circle cx='20' cy='20' r='0.5' fill='currentColor' className="text-foreground/30" />
            </pattern>
            <pattern id='pattern2' width='80' height='80' patternUnits='userSpaceOnUse'>
              <circle cx='40' cy='40' r='1' fill='currentColor' className="text-foreground/20" />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#pattern)' />
          <rect width='100%' height='100%' fill='url(#pattern2)' />
        </svg>
      </div>
      
      {/* Efectos de fondo con animación */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>
    
      <div className="flex flex-col items-center justify-center min-h-screen w-full py-16 px-4 relative">
        <div className="w-full max-w-md animate-fade-up">
          {/* Logo UTN */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <div className="relative flex justify-center items-center mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-teal-600/10 rounded-xl blur-lg"></div>
                <div className="bg-white/90 backdrop-filter backdrop-blur-sm p-3 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-teal-50 opacity-90"></div>
                  <div className="absolute inset-0 bg-white/60 mix-blend-overlay"></div>
                  <Image 
                    src={`/utn-logo.png?v=${new Date().getTime()}`} 
                    alt="Logo UTN" 
                    width={160}
                    height={50}
                    className="h-10 w-auto object-contain relative z-10 contrast-125 brightness-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-teal-500/10"></div>
                </div>
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-transparent to-teal-500/20 blur-md -z-10"></div>
              </div>
            </Link>
            <div className="text-center mt-2">
              <h2 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                Sistema de Gestión de Convenios
              </h2>
            </div>
          </div>

          {/* Tarjeta del formulario */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-xl blur opacity-70"></div>
            <div className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-8 relative">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

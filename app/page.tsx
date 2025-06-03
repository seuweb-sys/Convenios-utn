import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";

export default function Home() {
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
      
      <div className="flex flex-col items-center w-full max-w-6xl px-4 py-16 mx-auto gap-16 relative">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-8 mt-10 animate-fade-up">
          {/* Logo UTN con imagen */}
          <div className="relative">
            <div className="relative flex justify-center items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-teal-600/10 rounded-xl blur-lg"></div>
              <div className="bg-white/90 backdrop-filter backdrop-blur-sm p-3 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-teal-50 opacity-90"></div>
                <div className="absolute inset-0 bg-white/60 mix-blend-overlay"></div>
                <Image 
                  src={`/utn-logo.png?v=${new Date().getTime()}`} 
                  alt="Logo UTN" 
                  width={200}
                  height={70}
                  className="h-16 w-auto object-contain relative z-10 contrast-125 brightness-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-teal-500/10"></div>
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-transparent to-teal-500/20 blur-md -z-10"></div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-3xl leading-tight animate-fade-up animation-delay-300">
            Sistema de Gestión de <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">Convenios Institucionales</span>
          </h1>
          
          <p className="text-lg max-w-2xl text-muted-foreground animate-fade-up animation-delay-500">
            Plataforma digital para la creación, gestión y seguimiento de convenios 
            institucionales de la Universidad Tecnológica Nacional.
          </p>

          {/* Botón de Acceso mejorado */}
          <div className="mt-8 animate-fade-up animation-delay-700">
            <Link href="/sign-in">
              <Button 
                className="relative h-14 px-8 py-6 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] rounded-md shadow-xl shadow-blue-900/20 transition-all duration-200 border-0 flex items-center justify-center gap-2"
              >
                Acceder
                <svg 
                  className="w-5 h-5 ml-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Button>
            </Link>
          </div>
        </section>

        {/* Sección de Ejemplos de Convenios mejorada */}
        <section className="w-full mt-16 animate-fade-up animation-delay-1000">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center relative">
            <span className="relative inline-block after:content-[''] after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent">
              Ejemplos de Convenios
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Convenio 1: Prácticas Profesionales */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-teal-600/30 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 flex flex-col border border-border/50 shadow-lg group-hover:shadow-blue-700/10 transition-all duration-300 h-[400px]">
                <div className="flex items-start mb-6">
                  <div className="p-3 rounded-lg bg-blue-500/10 mr-4">
                    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-500 transition-colors">Convenio de Prácticas Profesionales</h3>
                    <p className="text-muted-foreground text-sm">Para facilitar prácticas laborales de estudiantes en empresas</p>
                  </div>
                </div>
                
                <div className="flex-1 border border-border/40 rounded-lg overflow-hidden relative bg-gradient-to-br from-gray-900/80 to-gray-800/80">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10"></div>
                  <div className="h-full w-full flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out p-6">
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center">
                        <svg className="w-16 h-16 text-blue-400/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <ul className="text-left text-sm space-y-2 text-gray-300">
                          <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Objetivos educativos
                          </li>
                          <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Responsabilidades de las partes
                          </li>
                          <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Duración y términos
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <Link href="/plantillas/practicas">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium py-3 px-4 flex items-center justify-center group-hover:bg-blue-700 transition-all duration-300">
                        Ver plantilla de prácticas profesionales
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Convenio 2: Marco */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-600/30 to-blue-600/30 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 flex flex-col border border-border/50 shadow-lg group-hover:shadow-teal-700/10 transition-all duration-300 h-[400px]">
                <div className="flex items-start mb-6">
                  <div className="p-3 rounded-lg bg-teal-500/10 mr-4">
                    <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-500 transition-colors">Convenio Marco Institucional</h3>
                    <p className="text-muted-foreground text-sm">Establece bases de colaboración entre organizaciones</p>
                  </div>
                </div>
                
                <div className="flex-1 border border-border/40 rounded-lg overflow-hidden relative bg-gradient-to-br from-gray-900/80 to-gray-800/80">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10"></div>
                  <div className="h-full w-full flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out p-6">
                    <div className="w-full h-full relative">
                      <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center">
                        <svg className="w-16 h-16 text-teal-400/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <ul className="text-left text-sm space-y-2 text-gray-300">
                          <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Declaración de intenciones
                          </li>
                          <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Cooperación académica
                          </li>
                          <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Compromisos institucionales
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <Link href="/plantillas/marco">
                      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-medium py-3 px-4 flex items-center justify-center group-hover:bg-teal-700 transition-all duration-300">
                        Ver plantilla de convenio marco
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer con animación */}
        <footer className="w-full border-t border-border/50 pt-8 mt-16 text-center text-muted-foreground text-sm">
          <div className="animate-fade-up animation-delay-1500">
            <p>Universidad Tecnológica Nacional - Sistema de Gestión de Convenios</p>
            <p className="mt-2">© {new Date().getFullYear()} - Todos los derechos reservados</p>
          </div>
        </footer>
      </div>
    </>
  );
}

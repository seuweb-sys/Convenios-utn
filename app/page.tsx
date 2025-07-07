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
              <div className="bg-white rounded-xl shadow-lg relative overflow-hidden w-[120px] h-[120px] flex items-center justify-center border border-gray-200">
                <Image 
                  src="/utn-logo.png" 
                  alt="Logo UTN" 
                  width={100}
                  height={80}
                  className="w-[100px] h-[80px] object-contain"
                  priority
                  style={{
                    width: '100px',
                    height: '80px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/15 via-transparent to-teal-500/15 blur-md -z-10"></div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-3xl leading-tight animate-fade-up animation-delay-300">
            <span className="text-foreground">Gestiona Convenios</span><br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">con Confianza y Eficiencia</span>
          </h1>
          
          <p className="text-lg max-w-2xl text-muted-foreground animate-fade-up animation-delay-500">
            La plataforma oficial de la <strong>Universidad Tecnológica Nacional</strong> para crear, aprobar y gestionar convenios institucionales de manera 100% digital y segura.
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

        {/* Sección de Características mejorada */}
        <section className="w-full mt-16 animate-fade-up animation-delay-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center relative">
            <span className="relative inline-block after:content-[''] after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-transparent after:via-green-500 after:to-transparent">
              ¿Por qué elegir nuestro sistema?
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600/30 to-blue-600/30 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 shadow-lg group-hover:shadow-green-700/10 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-green-500/10 mr-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-green-500 transition-colors">100% Digital</h3>
                    <p className="text-muted-foreground text-sm">Sin papeleo, sin complicaciones</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Formularios inteligentes
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Generación automática de documentos
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Firma digital integrada
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 shadow-lg group-hover:shadow-blue-700/10 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-blue-500/10 mr-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-500 transition-colors">Flujo Automático</h3>
                    <p className="text-muted-foreground text-sm">Proceso optimizado y eficiente</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Notificaciones automáticas
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Seguimiento en tiempo real
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Flujo optimizado (aprobación manual)
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border/50 shadow-lg group-hover:shadow-purple-700/10 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-purple-500/10 mr-4">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-500 transition-colors">Máxima Seguridad</h3>
                    <p className="text-muted-foreground text-sm">Protección nivel bancario</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Cifrado de extremo a extremo
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Control de acceso granular
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Auditoría completa
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas visuales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-500 mb-2">5+</div>
              <div className="text-sm text-muted-foreground">Tipos de Convenio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-500 mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Disponibilidad</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Seguro</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">UTN</div>
              <div className="text-sm text-muted-foreground">Oficial</div>
            </div>
          </div>
        </section>

        {/* CTA Final mejorado */}
        <section className="w-full mt-20 animate-fade-up animation-delay-1200">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-teal-600/20 rounded-2xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-12 text-center">
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-foreground">¿Listo para modernizar</span><br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">tus convenios institucionales?</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Únete a la transformación digital universitaria. Accede ahora con tu cuenta de Google y descubre lo fácil que es gestionar convenios de manera profesional y segura.
                </p>

                {/* Beneficios rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Con tu cuenta Google</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Acceso inmediato</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Totalmente seguro</span>
                  </div>
                </div>

                {/* CTA único */}
                <div className="flex justify-center">
                  <Link href="/sign-in">
                    <Button 
                      className="h-14 px-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white min-w-[250px] rounded-lg shadow-xl shadow-blue-900/25 transition-all duration-200 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Acceder con Google
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </Button>
                  </Link>
                </div>

                {/* Indicadores de confianza */}
                <div className="pt-6 border-t border-border/30">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                      <span>Seguridad universitaria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      <span>Plataforma oficial UTN</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"></path>
                      </svg>
                      <span>Soporte técnico</span>
                    </div>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/app/components/ui/button";

export default function AccessButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const handleAccess = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Usuario loggeado -> ir a dashboard
        router.push('/protected');
      } else {
        // Usuario no loggeado -> ir a login
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Error al verificar usuario:', error);
      // En caso de error, ir a login
      router.push('/sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAccess}
      disabled={isLoading}
      className="relative h-14 px-8 py-6 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] rounded-md shadow-xl shadow-blue-900/20 transition-all duration-200 border-0 flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando...
        </>
      ) : (
        <>
          Acceder
          <svg 
            className="w-5 h-5 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </>
      )}
    </Button>
  );
} 
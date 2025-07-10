import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { GoogleDriveConfigClient } from "./GoogleDriveConfigClient";
import {
  BackgroundPattern,
  DashboardHeader,
  SectionContainer
} from "@/app/components/dashboard";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  // Verificar si el usuario es admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return redirect("/protected");
  }

  // Verificar si ya tiene tokens OAuth configurados
  const { data: existingTokens } = await supabase
    .from("google_oauth_tokens")
    .select("id, created_at, expires_at")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Configuración del Sistema"
          subtitle="Gestiona la integración con Google Drive y otras configuraciones"
        />
        
        <div className="mt-6">
          <SectionContainer title="Integración con Google Drive">
            <GoogleDriveConfigClient 
              hasExistingTokens={!!existingTokens}
              tokenInfo={existingTokens ? {
                createdAt: existingTokens.created_at,
                expiresAt: existingTokens.expires_at
              } : null}
            />
          </SectionContainer>
        </div>
      </div>
    </div>
  );
} 
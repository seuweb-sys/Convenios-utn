import { createClient } from "@/utils/supabase/server";
import { signOutAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { PendingApprovalForm } from "./PendingApprovalForm";

export default async function PendingApprovalPage() {
    const supabase = await createClient();

    // Verificar si el usuario está logueado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/sign-in");
    }

    // Verificar si ya está aprobado
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved, role, full_name")
        .eq("id", user.id)
        .single();

    // Si ya está aprobado o es admin, redirigir a protected
    if (profile?.is_approved === true || profile?.role === "admin") {
        return redirect("/protected");
    }

    // Verificar si el usuario necesita completar perfil (Google auth sin datos)
    const needsProfileCompletion = !profile?.role;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="max-w-md w-full">
                <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-xl p-8 text-center">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                        <svg
                            className="w-10 h-10 text-amber-600 dark:text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Cuenta Pendiente de Aprobación
                    </h1>

                    {/* User info */}
                    {profile?.full_name && (
                        <p className="text-muted-foreground mb-4">
                            Hola, <span className="font-medium text-foreground">{profile.full_name}</span>
                        </p>
                    )}

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                        Tu cuenta ha sido creada exitosamente, pero necesita ser aprobada por un
                        administrador antes de que puedas acceder al sistema.
                    </p>

                    {/* Profile completion form for Google users */}
                    {needsProfileCompletion && (
                        <PendingApprovalForm
                            currentRole={profile?.role}
                        />
                    )}

                    {/* Info box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>¿Qué hacer?</strong><br />
                            {needsProfileCompletion
                                ? "Completá tu información arriba y un administrador revisará tu solicitud."
                                : "Un administrador revisará tu solicitud y recibirás acceso cuando sea aprobada."}
                        </p>
                    </div>

                    {/* Sign out button */}
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </form>

                    {/* Email info */}
                    <p className="text-xs text-muted-foreground mt-4">
                        Conectado como: {user.email}
                    </p>
                </div>
            </div>
        </div>
    );
}

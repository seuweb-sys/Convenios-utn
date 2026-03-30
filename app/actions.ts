"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Traduce los mensajes de error de Supabase (que vienen en inglés) al español.
const ERROR_TRANSLATIONS: Record<string, string> = {
  "Invalid login credentials": "Credenciales incorrectas. Verificá tu email y contraseña.",
  "Email not confirmed": "Debés confirmar tu correo electrónico antes de iniciar sesión.",
  "User already registered": "Ya existe una cuenta con ese email.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Email format is invalid": "El formato del email es inválido.",
  "For security purposes, you can only request this after 60 seconds":
    "Por seguridad, esperá 60 segundos antes de intentar nuevamente.",
  "For security purposes, you can only request this after 30 seconds":
    "Por seguridad, esperá 30 segundos antes de intentar nuevamente.",
  "email rate limit exceeded":
    "Demasiados intentos. Esperá unos minutos antes de volver a solicitar el email.",
};

function translateSupabaseError(message: string): string {
  // Buscar coincidencia exacta
  if (ERROR_TRANSLATIONS[message]) return ERROR_TRANSLATIONS[message];
  // Buscar coincidencia parcial (para variantes con segundos dinámicos)
  const rateLimit = message.match(/you can only request this after (\d+) seconds?/i);
  if (rateLimit) {
    return `Por seguridad, esperá ${rateLimit[1]} segundos antes de intentar nuevamente.`;
  }
  // Devolver el original si no hay traducción
  return message;
}


export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString();

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "El email y la contraseña son requeridos",
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
      }
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    const msg = translateSupabaseError(error.message);
    return encodedRedirect("error", "/sign-up", msg);
  } else {
    // Si el registro fue exitoso, actualizamos el perfil con el rol y carrera
    if (data.user) {
      // Todos los usuarios nuevos son 'user' por defecto.
      // Roles elevados (decano, admin) se asignan manualmente en la BD.
      const updates: any = {
        full_name: fullName,
        role: "user",
        is_approved: false,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', data.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // No fallamos el registro completo, pero logueamos el error.
      }
    }

    return encodedRedirect(
      "success",
      "/sign-up",
      "¡Registro exitoso! Por favor revisa tu correo para verificar tu cuenta. Tu cuenta deberá ser aprobada por un administrador.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", translateSupabaseError(error.message));
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error("forgotPassword error:", error.code, error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      translateSupabaseError(error.message),
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Revisá tu correo. Te enviamos un link para restablecer tu contraseña.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const approveUserAction = async (userId: string) => {
  const supabase = await createClient();

  // Verificar permisos de admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);

  if (error) {
    console.error("Error approving user:", error);
    return { error: "Error al aprobar usuario" };
  }

  return { success: true };
};

export const createCareerAction = async (name: string, code: string) => {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "No autorizado" };

  const { error } = await supabase
    .from("careers")
    .insert({ name, code });

  if (error) {
    console.error("Error creating career:", error);
    return { error: "Error al crear carrera" };
  }

  return { success: true };
};

export const updateCareerAction = async (id: string, name: string, code: string) => {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "No autorizado" };

  const { error } = await supabase
    .from("careers")
    .update({ name, code })
    .eq("id", id);

  if (error) {
    console.error("Error updating career:", error);
    return { error: "Error al actualizar carrera" };
  }

  return { success: true };
};

export const deleteCareerAction = async (id: string) => {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "No autorizado" };

  const { error } = await supabase
    .from("careers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting career:", error);
    return { error: "Error al eliminar carrera" };
  }

  return { success: true };
};

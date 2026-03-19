"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString();
  const role = formData.get("role")?.toString();

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
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
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    // Si el registro fue exitoso, actualizamos el perfil con el rol y carrera
    if (data.user) {
      // Intentamos actualizar el perfil. 
      // Nota: Dependiendo de si hay un trigger que crea el perfil, esto podría ser un update o un insert.
      // Asumimos que el trigger existe y crea el perfil básico.

      // Esperamos un momento breve para asegurar que el trigger haya corrido (si es asíncrono)
      // O usamos upsert para asegurar.
      // role en profiles queda solo para alcance global (admin/decano/user).
      // Los permisos por area/carrera se manejan en profile_memberships.
      const normalizedRole = role === "decano" ? "decano" : "user";

      const updates: any = {
        full_name: fullName,
        role: normalizedRole,
        is_approved: false, // Por defecto no aprobado
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
    return encodedRedirect("error", "/sign-in", error.message);
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
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
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

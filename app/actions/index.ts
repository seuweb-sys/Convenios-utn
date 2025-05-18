"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Acción para cerrar sesión
 */
export async function signOutAction() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Acción para iniciar sesión con email y contraseña
 */
export async function signInAction(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return { 
      error: "Email y contraseña son requeridos",
      success: false
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { 
      error: error.message, 
      success: false
    };
  }

  revalidatePath("/", "layout");
  redirect("/protected/dashboard");
}

/**
 * Acción para registrar un nuevo usuario
 */
export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Falta información requerida", success: false };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden", success: false };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message, success: false };
    }

    return { success: "Verifica tu email para completar el registro", error: null };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : "Error al registrar usuario", 
      success: false 
    };
  }
} 
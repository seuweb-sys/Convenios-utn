"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "@/app/actions";
import Link from "next/link";
import LoginWithGoogle from "@/app/components/auth/login-with-google";

interface SignUpFormProps {
    message?: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-500 hover:from-teal-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? "Registrando..." : "Registrarse"}
            {!pending && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
            )}
        </button>
    );
}

export function SignUpForm({ message }: SignUpFormProps) {
    const [selectedRole, setSelectedRole] = useState<string>("user");

    return (
        <div className="relative animate-fade-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-600/20 to-blue-600/20 rounded-xl blur-md opacity-70"></div>
            <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border/40 shadow-lg">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">Crear Cuenta</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Regístrate para acceder al sistema de convenios
                    </p>
                </div>

                <form className="space-y-5" action={signUpAction}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium">
                                Nombre Completo
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2.5 border border-border/60 rounded-md shadow-sm bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-blue-500/40 focus:border-blue-500/40 text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2.5 border border-border/60 rounded-md shadow-sm bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-blue-500/40 focus:border-blue-500/40 text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1 block w-full px-3 py-2.5 border border-border/60 rounded-md shadow-sm bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-blue-500/40 focus:border-blue-500/40 text-white"
                            />
                        </div>

                        {/* Role Selection (global) */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium">
                                Rol
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="mt-1 block w-full px-3 py-2.5 border border-border/60 rounded-md shadow-sm bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-blue-500/40 focus:border-blue-500/40 text-white [&>option]:text-black"
                            >
                                <option value="decano">Decano</option>
                                <option value="user">Usuario</option>
                            </select>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Los roles de area (profesor/director/secretario/miembro) se asignan por membresias.
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md text-center ${message.includes("Revisa tu correo") || message.includes("Thanks")
                            ? "bg-green-500/15 text-green-500"
                            : "bg-destructive/15 text-destructive"
                            }`}>
                            <p className="text-sm">{message}</p>
                        </div>
                    )}

                    <div>
                        <SubmitButton />
                    </div>
                </form>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card/90 text-muted-foreground">O continuar con</span>
                    </div>
                </div>

                <div className="mt-6">
                    <LoginWithGoogle />
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/sign-in" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

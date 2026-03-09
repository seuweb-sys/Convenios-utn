"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Career {
    id: string;
    name: string;
    code: string;
}

interface PendingApprovalFormProps {
    userId: string;
    currentRole?: string;
    currentCareerId?: string;
    careers: Career[];
}

export function PendingApprovalForm({
    userId,
    currentRole,
    currentCareerId,
    careers
}: PendingApprovalFormProps) {
    const router = useRouter();
    const [role, setRole] = useState(currentRole || "user");
    const [careerId, setCareerId] = useState(currentCareerId || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, career_id: careerId || null }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar perfil");
            }

            setMessage({ type: "success", text: "Información guardada. Un administrador revisará tu solicitud." });
            router.refresh();
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 text-left">
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Completá tu información</h3>

                {/* Role selector */}
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-1">
                        Rol
                    </label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                        <option value="user">Usuario</option>
                        <option value="profesor">Profesor</option>
                        <option value="rector">Rector</option>
                    </select>
                </div>

                {/* Career selector */}
                {role !== 'rector' && (
                    <div>
                        <label htmlFor="career" className="block text-sm font-medium text-muted-foreground mb-1">
                            Carrera
                        </label>
                        <select
                            id="career"
                            value={careerId}
                            onChange={(e) => setCareerId(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        >
                            <option value="">Seleccionar carrera...</option>
                            {careers.map((career) => (
                                <option key={career.id} value={career.id}>
                                    {career.name} {career.code ? `(${career.code})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? "Guardando..." : "Guardar información"}
                </button>

                {/* Message */}
                {message && (
                    <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </form>
    );
}

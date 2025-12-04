"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { CheckIcon } from "lucide-react";
import { approveUserAction } from "@/app/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/toast";

export type UserProfile = {
    id: string;
    full_name: string;
    email: string; // Note: email might be in auth.users, not profiles directly unless we sync it or join.
    // We will fetch it via join or assume it's in profile if added. 
    // Actually, profiles usually doesn't have email. We need to fetch it from auth.users or if the query joins it.
    // The query in page.tsx will need to join or we rely on what's available.
    // Let's assume for now we might not have email easily unless we use a view or function, 
    // OR we just show name and role. 
    // Wait, the SRS said "Admin da de alta". 
    // Let's check the profiles table again. It has full_name, role.
    role: string;
    is_approved: boolean;
    career_id?: string;
    careers?: {
        name: string;
        code: string;
    };
};

export const userColumns: ColumnDef<UserProfile>[] = [
    {
        accessorKey: "full_name",
        header: "Nombre",
    },
    {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    role === 'profesor' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
            );
        },
    },
    {
        accessorKey: "careers.name",
        header: "Carrera",
        cell: ({ row }) => {
            const career = row.original.careers;
            return career ? (
                <span>{career.name} {career.code ? `(${career.code})` : ''}</span>
            ) : (
                <span className="text-muted-foreground">-</span>
            );
        },
    },
    {
        accessorKey: "is_approved",
        header: "Estado",
        cell: ({ row }) => {
            const isApproved = row.getValue("is_approved") as boolean;
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {isApproved ? "Aprobado" : "Pendiente"}
                </span>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original;
            const router = useRouter();
            const [isPending, startTransition] = useTransition();
            const { success, error } = useToast();

            if (user.is_approved) return null;

            const handleApprove = () => {
                startTransition(async () => {
                    const result = await approveUserAction(user.id);
                    if (result.error) {
                        error("Error", result.error);
                    } else {
                        success("Usuario aprobado", "El usuario ahora puede acceder al sistema.");
                        router.refresh();
                    }
                });
            };

            return (
                <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isPending ? "Procesando..." : (
                        <>
                            <CheckIcon className="h-4 w-4 mr-1" /> Aprobar
                        </>
                    )}
                </Button>
            );
        },
    },
];

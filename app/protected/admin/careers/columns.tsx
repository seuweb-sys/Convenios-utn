"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { EditIcon, TrashIcon } from "lucide-react";
import { CareerDialog } from "./career-dialog";
import { useState } from "react";
import { deleteCareerAction } from "@/app/actions";
import { useToast } from "@/app/components/ui/toast";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type Career = {
    id: string;
    name: string;
    code: string;
    created_at: string;
};

export const careerColumns: ColumnDef<Career, unknown>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
    },
    {
        accessorKey: "code",
        header: "Código",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const career = row.original;
            const router = useRouter();
            const { success, error } = useToast();
            const [isDeleting, setIsDeleting] = useState(false);

            const handleDelete = async () => {
                setIsDeleting(true);
                const result = await deleteCareerAction(career.id);
                setIsDeleting(false);

                if (result.error) {
                    error("Error", result.error);
                } else {
                    success("Carrera eliminada", "La carrera ha sido eliminada correctamente.");
                    router.refresh();
                }
            };

            return (
                <div className="flex items-center gap-2">
                    <CareerDialog career={career} />

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100">
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la carrera "{career.name}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                    {isDeleting ? "Eliminando..." : "Eliminar"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            );
        },
    },
];

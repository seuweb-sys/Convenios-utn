"use client";

import { Button } from "@/app/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { EditIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCareerAction, updateCareerAction } from "@/app/actions";
import { useToast } from "@/app/components/ui/toast";
import { useRouter } from "next/navigation";
import { Career } from "./columns";

const careerSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    code: z.string().min(1, "El código es requerido"),
});

type CareerFormValues = z.infer<typeof careerSchema>;

interface CareerDialogProps {
    career?: Career;
}

export function CareerDialog({ career }: CareerDialogProps) {
    const [open, setOpen] = useState(false);
    const { success, error } = useToast();
    const router = useRouter();
    const isEditing = !!career;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CareerFormValues>({
        resolver: zodResolver(careerSchema),
        defaultValues: {
            name: career?.name || "",
            code: career?.code || "",
        },
    });

    const onSubmit = async (data: CareerFormValues) => {
        let result;
        if (isEditing && career) {
            result = await updateCareerAction(career.id, data.name, data.code);
        } else {
            result = await createCareerAction(data.name, data.code);
        }

        if (result.error) {
            error("Error", result.error);
        } else {
            success(
                isEditing ? "Carrera actualizada" : "Carrera creada",
                isEditing
                    ? "La carrera ha sido actualizada correctamente."
                    : "La carrera ha sido creada correctamente."
            );
            setOpen(false);
            if (!isEditing) reset();
            router.refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EditIcon className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button className="bg-primary hover:bg-primary/90">
                        <PlusIcon className="h-4 w-4 mr-2" /> Nueva Carrera
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Carrera" : "Nueva Carrera"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos de la carrera aquí."
                            : "Ingresa los datos para crear una nueva carrera."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    {...register("name")}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">
                                Código
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="code"
                                    {...register("code")}
                                    className={errors.code ? "border-red-500" : ""}
                                />
                                {errors.code && (
                                    <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea";
  required?: boolean;
}

interface DynamicFieldProps {
  field: FieldConfig;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Formatear el valor según el tipo
    if (field.type === "number") {
      // Remover caracteres no numéricos
      newValue = newValue.replace(/[^\d]/g, "");
    }

    onChange(newValue);
  };

  const renderField = () => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.name}
            value={value || ""}
            onChange={handleChange}
            placeholder={`Ingrese ${field.label.toLowerCase()}`}
            className={error ? "border-red-500" : ""}
          />
        );
      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={value || ""}
            onChange={handleChange}
            placeholder={`Ingrese ${field.label.toLowerCase()}`}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}; 
import { createClient } from "@/utils/supabase/server";

export interface Career {
    id: string;
    name: string;
    code: string | null;
}

export async function getCareers() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("careers")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching careers:", error);
        return [];
    }

    return data as Career[];
}

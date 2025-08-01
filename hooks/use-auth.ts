"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const getUser = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting session:", error);
            }
            setUser(data.session?.user ?? null);
            setLoading(false);
        };

        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            },
        );

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
    };

    return { user, loading, signOut };
};

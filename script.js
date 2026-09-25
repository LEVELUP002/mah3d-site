async function testSupabaseConnection() {
    console.log("MAH3D: Testing Supabase...");

    const { data, error } =
        await supabaseClient
            .from("projects")
            .select("id,title")
            .limit(5);

    if (error) {
        console.error(
            "SUPABASE TEST FAILED:",
            error
        );
        return;
    }

    console.log(
        "SUPABASE TEST OK:",
        data
    );
}

testSupabaseConnection();

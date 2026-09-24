"use strict";

console.log("=== MAH3D TEST ===");

const SUPABASE_URL = "https://drfxgjvvldccxbccgiud.supabase.co";
const SUPABASE_KEY = "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";

console.log("URL:", SUPABASE_URL);
console.log("KEY START:", SUPABASE_KEY.substring(0, 20));

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testSupabase() {
    console.log("Testing Supabase...");

    const { data, error } = await supabaseClient
        .from("projects")
        .select("id")
        .limit(1);

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
        document.body.insertAdjacentHTML(
            "afterbegin",
            `<div style="
                position:fixed;
                top:0;
                left:0;
                right:0;
                z-index:99999;
                padding:20px;
                background:#300;
                color:white;
                font-size:18px;
            ">
                ❌ SUPABASE ERROR:<br>
                ${error.message}
            </div>`
        );
    } else {
        document.body.insertAdjacentHTML(
            "afterbegin",
            `<div style="
                position:fixed;
                top:0;
                left:0;
                right:0;
                z-index:99999;
                padding:20px;
                background:#063;
                color:white;
                font-size:18px;
            ">
                ✅ SUPABASE CONNECTION OK
            </div>`
        );
    }
}

testSupabase();

const uploadForm = document.getElementById("uploadForm");

if (uploadForm) {
    uploadForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const progress = document.getElementById("uploadProgress");

        const title = document.getElementById("projectTitle").value.trim();
        const description = document.getElementById("projectDescription").value.trim();
        const category = document.getElementById("projectCategory").value;
        const file = document.getElementById("projectFile").files[0];

        if (!title) {
            progress.textContent = "❌ Ampidiro ny titre.";
            return;
        }

        if (!file) {
            progress.textContent = "❌ Misafidiana fichier.";
            return;
        }

        progress.textContent = "📤 Uploading...";

        try {
            const { data: sessionData } =
                await supabaseClient.auth.getSession();

            if (!sessionData.session) {
                progress.textContent = "❌ Login required.";
                return;
            }

            const safeName =
                file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

            const filePath =
                Date.now() + "_" + safeName;

            /* 1. UPLOAD */

            const { error: uploadError } =
                await supabaseClient.storage
                    .from("projects")
                    .upload(filePath, file, {
                        cacheControl: "31536000",
                        upsert: false
                    });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            /* 2. GET PUBLIC URL */

            const { data: urlData } =
                supabaseClient.storage
                    .from("projects")
                    .getPublicUrl(filePath);

            /* 3. SAVE DATABASE */

            const { error: dbError } =
                await supabaseClient
                    .from("projects")
                    .insert({
                        title: title,
                        description: description,
                        category: category,
                        file_url: urlData.publicUrl,
                        file_name: file.name
                    });

            if (dbError) {
                throw new Error(dbError.message);
            }

            /* 4. SHOW SUCCESS IMMEDIATELY */

            progress.textContent =
                "✅ Published!";

            uploadForm.reset();

            /* 5. REFRESH PROJECT LIST */

            await loadProjects();

        } catch (error) {

            console.error("PUBLISH ERROR:", error);

            progress.textContent =
                "❌ " + error.message;
        }
    });
}

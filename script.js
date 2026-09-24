/* =========================
   PUBLISH PROJECT
========================= */

const uploadForm = document.getElementById("uploadForm");

if (uploadForm) {

    uploadForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("PUBLISH BUTTON CLICKED");

        const progress =
            document.getElementById("uploadProgress");

        const title =
            document.getElementById("projectTitle").value.trim();

        const description =
            document.getElementById("projectDescription").value.trim();

        const category =
            document.getElementById("projectCategory").value;

        const fileInput =
            document.getElementById("projectFile");

        const file =
            fileInput.files[0];

        if (!title) {
            progress.textContent = "❌ Ampidiro ny Project Title.";
            return;
        }

        if (!file) {
            progress.textContent = "❌ Misafidiana fichier.";
            return;
        }

        progress.textContent =
            "⏳ Checking admin session...";

        try {

            /* CHECK LOGIN */

            const sessionResult =
                await supabaseClient.auth.getSession();

            const session =
                sessionResult.data.session;

            console.log(
                "UPLOAD SESSION:",
                session
            );

            if (!session) {

                progress.textContent =
                    "❌ Tsy mbola login.";

                return;
            }


            /* FILE NAME */

            const safeName =
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const filePath =
                Date.now() + "_" + safeName;


            /* UPLOAD FILE */

            progress.textContent =
                "📤 Uploading " + file.name + "...";

            console.log(
                "Uploading:",
                filePath
            );

            const uploadResult =
                await supabaseClient
                    .storage
                    .from("projects")
                    .upload(
                        filePath,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );

            console.log(
                "STORAGE RESULT:",
                uploadResult
            );

            if (uploadResult.error) {

                throw new Error(
                    "Storage: " +
                    uploadResult.error.message
                );
            }


            /* PUBLIC URL */

            progress.textContent =
                "🔗 Creating public link...";

            const publicResult =
                supabaseClient
                    .storage
                    .from("projects")
                    .getPublicUrl(filePath);

            const publicUrl =
                publicResult.data.publicUrl;

            console.log(
                "PUBLIC URL:",
                publicUrl
            );


            /* DATABASE */

            progress.textContent =
                "💾 Saving project...";

            const databaseResult =
                await supabaseClient
                    .from("projects")
                    .insert({
                        title: title,
                        description: description,
                        category: category,
                        file_url: publicUrl,
                        file_name: file.name
                    })
                    .select()
                    .single();

            console.log(
                "DATABASE RESULT:",
                databaseResult
            );

            if (databaseResult.error) {

                /* remove uploaded file if DB fails */

                await supabaseClient
                    .storage
                    .from("projects")
                    .remove([filePath]);

                throw new Error(
                    "Database: " +
                    databaseResult.error.message
                );
            }


            /* SUCCESS */

            progress.textContent =
                "✅ PROJECT PUBLISHED SUCCESSFULLY!";

            console.log(
                "PROJECT PUBLISHED:",
                databaseResult.data
            );

            uploadForm.reset();

            await loadProjects();


        } catch (error) {

            console.error(
                "PUBLISH ERROR:",
                error
            );

            progress.textContent =
                "❌ " + error.message;
        }

    });

} else {

    console.error(
        "uploadForm NOT FOUND"
    );
}

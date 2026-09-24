"use strict";

console.log("=== MAH3D SCRIPT V2 START ===");

const SUPABASE_URL =
    "https://drfxgjvvldccxbccgiud.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";

console.log("SUPABASE URL:", SUPABASE_URL);
console.log(
    "KEY:",
    SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + "..."
);

if (!window.supabase) {
    console.error("Supabase JS library not loaded!");
    alert("Supabase JS library not loaded!");
} else {

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    window.supabaseClient = supabaseClient;

    console.log("Supabase client created");


    async function testConnection() {

        console.log("Testing Supabase connection...");

        const result =
            await supabaseClient
                .from("projects")
                .select("id")
                .limit(1);

        console.log("SUPABASE RESULT:", result);

        if (result.error) {

            console.error(
                "SUPABASE ERROR:",
                result.error
            );

            showMessage(
                "❌ Supabase: " +
                result.error.message
            );

            return false;
        }

        console.log(
            "✅ SUPABASE CONNECTION OK"
        );

        return true;
    }


    function showMessage(message) {

        const box =
            document.getElementById(
                "loginMessage"
            );

        if (box) {
            box.textContent = message;
        }

        console.log(message);
    }


    async function login() {

        const email =
            document.getElementById(
                "email"
            ).value.trim();

        const password =
            document.getElementById(
                "password"
            ).value;

        if (!email || !password) {

            showMessage(
                "❌ Ampidiro email sy password."
            );

            return;
        }

        showMessage(
            "⏳ Login..."
        );

        console.log(
            "LOGIN EMAIL:",
            email
        );

        const result =
            await supabaseClient.auth
                .signInWithPassword({
                    email: email,
                    password: password
                });

        console.log(
            "LOGIN RESULT:",
            result
        );

        if (result.error) {

            showMessage(
                "❌ " +
                result.error.message
            );

            return;
        }

        if (!result.data.session) {

            showMessage(
                "❌ Tsy nahazo session."
            );

            return;
        }

        showMessage(
            "✅ LOGIN SUCCESS"
        );

        const loginBox =
            document.getElementById(
                "loginBox"
            );

        const dashboard =
            document.getElementById(
                "dashboard"
            );

        if (loginBox) {
            loginBox.classList.add(
                "hidden"
            );
        }

        if (dashboard) {
            dashboard.classList.remove(
                "hidden"
            );
        }

        await loadProjects();
    }


    async function logout() {

        await supabaseClient.auth.signOut();

        const loginBox =
            document.getElementById(
                "loginBox"
            );

        const dashboard =
            document.getElementById(
                "dashboard"
            );

        if (loginBox) {
            loginBox.classList.remove(
                "hidden"
            );
        }

        if (dashboard) {
            dashboard.classList.add(
                "hidden"
            );
        }

        showMessage("");
    }


    async function loadProjects() {

        console.log(
            "Loading projects..."
        );

        const result =
            await supabaseClient
                .from("projects")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        console.log(
            "PROJECT RESULT:",
            result
        );

        if (result.error) {

            console.error(
                "PROJECT ERROR:",
                result.error
            );

            showMessage(
                "❌ PROJECT ERROR: " +
                result.error.message
            );

            return;
        }

        const projects =
            result.data || [];

        console.log(
            "PROJECT COUNT:",
            projects.length
        );

        const count =
            document.getElementById(
                "projectCount"
            );

        if (count) {
            count.textContent =
                projects.length;
        }

        renderProjects(projects);
        renderAdminProjects(projects);
    }


    function renderProjects(projects) {

        const grid =
            document.getElementById(
                "projectsGrid"
            );

        if (!grid) return;

        if (!projects.length) {

            grid.innerHTML =
                "<p>No projects published yet.</p>";

            return;
        }

        grid.innerHTML =
            projects.map(
                function(project) {

                    return `
                        <article class="project-card">

                            <span class="category">
                                ${escapeHtml(
                                    project.category || "Other"
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    project.title
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    project.description || ""
                                )}
                            </p>

                            <a
                                class="btn primary"
                                href="${escapeHtml(
                                    project.file_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>

                        </article>
                    `;
                }
            ).join("");
    }


    function renderAdminProjects(projects) {

        const box =
            document.getElementById(
                "adminProjects"
            );

        if (!box) return;

        if (!projects.length) {

            box.innerHTML =
                "<p>No projects.</p>";

            return;
        }

        box.innerHTML =
            projects.map(
                function(project) {

                    return `
                        <div class="admin-row">

                            <div>
                                <strong>
                                    ${escapeHtml(
                                        project.title
                                    )}
                                </strong>

                                <div>
                                    ${escapeHtml(
                                        project.category || "Other"
                                    )}
                                </div>
                            </div>

                            <button
                                class="btn danger"
                                onclick="deleteProject('${project.id}')"
                            >
                                Delete
                            </button>

                        </div>
                    `;
                }
            ).join("");
    }


    window.deleteProject =
        async function(id) {

            if (
                !confirm(
                    "Delete this project?"
                )
            ) {
                return;
            }

            const result =
                await supabaseClient
                    .from("projects")
                    .delete()
                    .eq("id", id);

            if (result.error) {

                alert(
                    result.error.message
                );

                return;
            }

            await loadProjects();
        };


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    window.addEventListener(
        "DOMContentLoaded",
        async function() {

            console.log(
                "MAH3D DOM READY"
            );

            const loginForm =
                document.getElementById(
                    "loginForm"
                );

            if (loginForm) {

                loginForm.addEventListener(
                    "submit",
                    async function(event) {

                        event.preventDefault();

                        await login();
                    }
                );
            }

            const logoutBtn =
                document.getElementById(
                    "logoutBtn"
                );

            if (logoutBtn) {

                logoutBtn.addEventListener(
                    "click",
                    logout
                );
            }

            const sessionResult =
                await supabaseClient.auth
                    .getSession();

            console.log(
                "SESSION:",
                sessionResult
            );

            if (
                sessionResult.data &&
                sessionResult.data.session
            ) {

                document
                    .getElementById("loginBox")
                    ?.classList.add("hidden");

                document
                    .getElementById("dashboard")
                    ?.classList.remove("hidden");

                await loadProjects();
            }

            /*
             * TEST API
             */
            await testConnection();
        }
    );
}

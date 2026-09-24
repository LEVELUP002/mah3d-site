"use strict";

const SUPABASE_URL = "https://drfxgjvvldccxbccgiud.supabase.co";
const SUPABASE_KEY = "sb_publishable_iaxxz6gFJhMdR5tTZGZMOg_CiSibohE";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("MAH3D SCRIPT STARTED");

function $(id) {
    return document.getElementById(id);
}

/* =========================
   LOGIN
========================= */

const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const loginBox = $("loginBox");
const dashboard = $("dashboard");
const logoutBtn = $("logoutBtn");

if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        console.log("LOGIN BUTTON CLICKED");

        const emailElement = $("email");
        const passwordElement = $("password");

        if (!emailElement || !passwordElement) {
            console.error("EMAIL OR PASSWORD INPUT NOT FOUND");
            return;
        }

        const email = emailElement.value.trim();
        const password = passwordElement.value;

        if (!email || !password) {
            if (loginMessage) {
                loginMessage.textContent =
                    "❌ Ampidiro email sy password.";
            }
            return;
        }

        if (loginMessage) {
            loginMessage.textContent =
                "⏳ Mampifandray amin'ny Supabase...";
        }

        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            console.log("LOGIN RESULT:", data);
            console.log("LOGIN ERROR:", error);

            if (error) {

                if (loginMessage) {
                    loginMessage.textContent =
                        "❌ " + error.message;
                }

                return;
            }

            if (!data || !data.session) {

                if (loginMessage) {
                    loginMessage.textContent =
                        "❌ Login tsy namorona session.";
                }

                return;
            }

            console.log("LOGIN SUCCESS");

            if (loginMessage) {
                loginMessage.textContent =
                    "✅ Tafiditra! Loading dashboard...";
            }

            /* OPEN DASHBOARD IMMEDIATELY */

            if (loginBox) {
                loginBox.classList.add("hidden");
            }

            if (dashboard) {
                dashboard.classList.remove("hidden");
            }

            /* LOAD PROJECTS */

            await loadProjects();

            if (loginMessage) {
                loginMessage.textContent =
                    "✅ Admin connected.";
            }

        } catch (err) {

            console.error("LOGIN EXCEPTION:", err);

            if (loginMessage) {
                loginMessage.textContent =
                    "❌ " + err.message;
            }
        }
    });

} else {

    console.error("loginForm NOT FOUND");

}


/* =========================
   LOGOUT
========================= */

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        console.log("LOGOUT");

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            console.error("LOGOUT ERROR:", error);
            return;
        }

        if (dashboard) {
            dashboard.classList.add("hidden");
        }

        if (loginBox) {
            loginBox.classList.remove("hidden");
        }

        if (loginMessage) {
            loginMessage.textContent = "";
        }

    });

}


/* =========================
   AUTH CHECK
========================= */

async function checkSession() {

    console.log("CHECKING SESSION...");

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "SESSION ERROR:",
                error
            );

            return;
        }

        console.log(
            "CURRENT SESSION:",
            data.session
        );

        if (data.session) {

            if (loginBox) {
                loginBox.classList.add("hidden");
            }

            if (dashboard) {
                dashboard.classList.remove("hidden");
            }

            await loadProjects();

        } else {

            if (loginBox) {
                loginBox.classList.remove("hidden");
            }

            if (dashboard) {
                dashboard.classList.add("hidden");
            }

        }

    } catch (err) {

        console.error(
            "SESSION EXCEPTION:",
            err
        );

    }
}


/* =========================
   PROJECTS
========================= */

let allProjects = [];

async function loadProjects() {

    console.log("LOADING PROJECTS...");

    const result =
        await supabaseClient
            .from("projects")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (result.error) {

        console.error(
            "PROJECT ERROR:",
            result.error
        );

        return;
    }

    allProjects = result.data || [];

    console.log(
        "PROJECTS:",
        allProjects
    );

    renderProjects();
    renderAdminProjects();
}


function renderProjects() {

    const grid = $("projectsGrid");

    if (!grid) return;

    if (!allProjects.length) {

        grid.innerHTML =
            `<div class="loading">
                No projects published yet.
            </div>`;

        return;
    }

    grid.innerHTML =
        allProjects.map(function(project) {

            return `
                <article class="project-card">

                    <span class="category">
                        ${escapeHtml(project.category || "Other")}
                    </span>

                    <h3>
                        ${escapeHtml(project.title)}
                    </h3>

                    <p>
                        ${escapeHtml(
                            project.description || ""
                        )}
                    </p>

                    <div class="card-buttons">

                        <a
                            class="btn primary"
                            href="${escapeHtml(project.file_url)}"
                            target="_blank"
                        >
                            Download
                        </a>

                    </div>

                </article>
            `;

        }).join("");

}


/* =========================
   ADMIN PROJECTS
========================= */

function renderAdminProjects() {

    const container = $("adminProjects");
    const counter = $("projectCount");

    if (counter) {
        counter.textContent =
            allProjects.length;
    }

    if (!container) return;

    if (!allProjects.length) {

        container.innerHTML =
            `<p class="loading">
                No projects.
            </p>`;

        return;
    }

    container.innerHTML =
        allProjects.map(function(project) {

            return `
                <div class="admin-row">

                    <div>

                        <strong>
                            ${escapeHtml(project.title)}
                        </strong>

                        <div class="category">
                            ${escapeHtml(project.category || "Other")}
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

        }).join("");

}


/* =========================
   DELETE
========================= */

window.deleteProject = async function(id) {

    const project =
        allProjects.find(function(p) {
            return p.id === id;
        });

    if (!project) return;

    if (!confirm(
        'Delete "' +
        project.title +
        '"?'
    )) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("projects")
            .delete()
            .eq("id", id);

    if (error) {

        alert(
            "Delete error: " +
            error.message
        );

        return;
    }

    await loadProjects();

};


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================
   AUTH EVENTS
========================= */

supabaseClient.auth.onAuthStateChange(
    function(event, session) {

        console.log(
            "AUTH EVENT:",
            event,
            session
        );

        if (session) {

            if (loginBox) {
                loginBox.classList.add("hidden");
            }

            if (dashboard) {
                dashboard.classList.remove("hidden");
            }

        } else {

            if (loginBox) {
                loginBox.classList.remove("hidden");
            }

            if (dashboard) {
                dashboard.classList.add("hidden");
            }

        }

    }
);


/* =========================
   START
========================= */

window.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "MAH3D DOM READY"
        );

        checkSession();

    }
);

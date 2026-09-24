"use strict";

const SUPABASE_URL = "https://drfxgjvvldccxbccgiud.supabase.co";
const SUPABASE_KEY = "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let allProjects = [];

// ============================
// ELEMENTS
// ============================

const $ = (id) => document.getElementById(id);

const projectsGrid = $("projectsGrid");
const downloadsList = $("downloadsList");

const searchInput = $("searchInput");
const categoryFilter = $("categoryFilter");

const loginBox = $("loginBox");
const dashboard = $("dashboard");
const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const logoutBtn = $("logoutBtn");

const uploadForm = $("uploadForm");
const uploadProgress = $("uploadProgress");

const adminProjects = $("adminProjects");
const projectCount = $("projectCount");

const modal = $("modal");
const closeModal = $("closeModal");


// ============================
// MOBILE MENU
// ============================

const menuBtn = $("menuBtn");
const nav = $("nav");

if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
        nav.classList.toggle("open");
    });
}


// ============================
// ESCAPE HTML
// ============================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================
// LOAD PROJECTS
// ============================

async function loadProjects() {

    if (projectsGrid) {
        projectsGrid.innerHTML =
            '<div class="loading">Loading projects...</div>';
    }

    const result = await supabaseClient
        .from("projects")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (result.error) {

        console.error("PROJECT LOAD ERROR:", result.error);

        if (projectsGrid) {
            projectsGrid.innerHTML =
                '<div class="loading">Error: ' +
                escapeHtml(result.error.message) +
                "</div>";
        }

        return;
    }

    allProjects = result.data || [];

    renderProjects(allProjects);
    renderDownloads(allProjects);
    renderAdminProjects(allProjects);
}


// ============================
// PUBLIC PROJECTS
// ============================

function renderProjects(projects) {

    if (!projectsGrid) {
        return;
    }

    if (!projects.length) {

        projectsGrid.innerHTML =
            '<div class="loading">' +
            "No projects published yet." +
            "</div>";

        return;
    }

    projectsGrid.innerHTML = projects.map(function (project) {

        return `
            <article class="project-card">

                <span class="category">
                    ${escapeHtml(project.category)}
                </span>

                <h3>
                    ${escapeHtml(project.title)}
                </h3>

                <p>
                    ${escapeHtml(
                        project.description || "No description."
                    )}
                </p>

                <div class="card-buttons">

                    <button
                        class="btn primary"
                        data-project-id="${escapeHtml(project.id)}"
                        onclick="openProject('${project.id}')"
                    >
                        View
                    </button>

                    <a
                        class="btn secondary"
                        href="${escapeHtml(project.file_url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Download
                    </a>

                </div>

            </article>
        `;

    }).join("");
}


// ============================
// DOWNLOADS
// ============================

function renderDownloads(projects) {

    if (!downloadsList) {
        return;
    }

    if (!projects.length) {

        downloadsList.innerHTML =
            '<div class="loading">' +
            "No downloads available." +
            "</div>";

        return;
    }

    downloadsList.innerHTML = projects.map(function (project) {

        return `
            <div class="download-item">

                <div>
                    <strong>
                        ${escapeHtml(project.title)}
                    </strong>

                    <div class="category">
                        ${escapeHtml(project.category)}
                    </div>
                </div>

                <a
                    class="btn primary"
                    href="${escapeHtml(project.file_url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download
                </a>

            </div>
        `;

    }).join("");
}


// ============================
// SEARCH
// ============================

function filterProjects() {

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const category = categoryFilter
        ? categoryFilter.value
        : "all";

    const filtered = allProjects.filter(function (project) {

        const text = (
            (project.title || "") +
            " " +
            (project.description || "") +
            " " +
            (project.category || "")
        ).toLowerCase();

        const searchOK = text.includes(search);

        const categoryOK =
            category === "all" ||
            project.category === category;

        return searchOK && categoryOK;
    });

    renderProjects(filtered);
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        filterProjects
    );
}

if (categoryFilter) {
    categoryFilter.addEventListener(
        "change",
        filterProjects
    );
}


// ============================
// PROJECT MODAL
// ============================

window.openProject = function (id) {

    const project = allProjects.find(function (item) {
        return item.id === id;
    });

    if (!project || !modal) {
        return;
    }

    $("modalTitle").textContent =
        project.title || "";

    $("modalCategory").textContent =
        project.category || "";

    $("modalDescription").textContent =
        project.description || "No description.";

    $("modalDownload").href =
        project.file_url || "#";

    modal.classList.remove("hidden");
};

if (closeModal) {

    closeModal.addEventListener(
        "click",
        function () {
            modal.classList.add("hidden");
        }
    );
}

if (modal) {

    modal.addEventListener(
        "click",
        function (event) {

            if (event.target === modal) {
                modal.classList.add("hidden");
            }

        }
    );
}


// ============================
// LOGIN
// ============================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (loginMessage) {
                loginMessage.textContent =
                    "Connecting to Supabase...";
            }

            const email =
                $("email").value.trim();

            const password =
                $("password").value;

            console.log(
                "Attempting Supabase login..."
            );

            const result =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (result.error) {

                console.error(
                    "LOGIN ERROR:",
                    result.error
                );

                if (loginMessage) {
                    loginMessage.textContent =
                        "❌ " + result.error.message;
                }

                return;
            }

            console.log(
                "LOGIN SUCCESS:",
                result.data
            );

            if (loginMessage) {
                loginMessage.textContent =
                    "✅ Login successful!";
            }

            await updateAdminUI();

        }
    );
}


// ============================
// LOGOUT
// ============================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            await supabaseClient.auth.signOut();

            await updateAdminUI();

        }
    );
}


// ============================
// ADMIN UI
// ============================

async function updateAdminUI() {

    const result =
        await supabaseClient.auth.getSession();

    const session =
        result.data.session;

    console.log(
        "CURRENT SESSION:",
        session
    );

    if (session) {

        if (loginBox) {
            loginBox.classList.add("hidden");
        }

        if (dashboard) {
            dashboard.classList.remove("hidden");
        }

        console.log(
            "ADMIN DASHBOARD UNLOCKED"
        );

    } else {

        if (loginBox) {
            loginBox.classList.remove("hidden");
        }

        if (dashboard) {
            dashboard.classList.add("hidden");
        }

    }

    renderAdminProjects(allProjects);
}


// ============================
// UPLOAD
// ============================

if (uploadForm) {

    uploadForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (uploadProgress) {
                uploadProgress.textContent =
                    "Checking login...";
            }

            const sessionResult =
                await supabaseClient.auth.getSession();

            const session =
                sessionResult.data.session;

            if (!session) {

                if (uploadProgress) {
                    uploadProgress.textContent =
                        "❌ Please login first.";
                }

                return;
            }

            const title =
                $("projectTitle").value.trim();

            const description =
                $("projectDescription").value.trim();

            const category =
                $("projectCategory").value;

            const file =
                $("projectFile").files[0];

            if (!file) {

                uploadProgress.textContent =
                    "❌ Select a file.";

                return;
            }

            try {

                uploadProgress.textContent =
                    "📤 Uploading file...";

                const safeName =
                    file.name.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );

                const filePath =
                    Date.now() + "_" + safeName;

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

                if (uploadResult.error) {
                    throw uploadResult.error;
                }

                uploadProgress.textContent =
                    "Saving project information...";

                const publicResult =
                    supabaseClient
                        .storage
                        .from("projects")
                        .getPublicUrl(filePath);

                const publicUrl =
                    publicResult.data.publicUrl;

                const databaseResult =
                    await supabaseClient
                        .from("projects")
                        .insert({
                            title: title,
                            description: description,
                            category: category,
                            file_url: publicUrl,
                            file_name: file.name
                        });

                if (databaseResult.error) {
                    throw databaseResult.error;
                }

                uploadProgress.textContent =
                    "✅ Project published!";

                uploadForm.reset();

                await loadProjects();

            } catch (error) {

                console.error(
                    "UPLOAD ERROR:",
                    error
                );

                uploadProgress.textContent =
                    "❌ " + error.message;
            }

        }
    );
}


// ============================
// ADMIN PROJECTS
// ============================

function renderAdminProjects(projects) {

    if (!adminProjects) {
        return;
    }

    if (projectCount) {
        projectCount.textContent =
            projects.length;
    }

    if (!projects.length) {

        adminProjects.innerHTML =
            '<p class="loading">No projects.</p>';

        return;
    }

    adminProjects.innerHTML =
        projects.map(function (project) {

            return `
                <div class="admin-row">

                    <div>
                        <strong>
                            ${escapeHtml(project.title)}
                        </strong>

                        <div class="category">
                            ${escapeHtml(project.category)}
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


// ============================
// DELETE
// ============================

window.deleteProject = async function (id) {

    const project =
        allProjects.find(function (item) {
            return item.id === id;
        });

    if (!project) {
        return;
    }

    if (!confirm(
        'Delete "' + project.title + '"?'
    )) {
        return;
    }

    const result =
        await supabaseClient
            .from("projects")
            .delete()
            .eq("id", id);

    if (result.error) {

        alert(
            "Delete error: " +
            result.error.message
        );

        return;
    }

    await loadProjects();
};


// ============================
// AUTH LISTENER
// ============================

supabaseClient.auth.onAuthStateChange(
    function (event, session) {

        console.log(
            "AUTH EVENT:",
            event,
            session
        );

        setTimeout(
            function () {
                updateAdminUI();
            },
            0
        );
    }
);


// ============================
// START
// ============================

async function startApp() {

    console.log(
        "MAH3D Supabase starting..."
    );

    await loadProjects();

    await updateAdminUI();

    console.log(
        "MAH3D Supabase ready."
    );
}

startApp();

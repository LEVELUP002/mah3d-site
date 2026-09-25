// ============================================================
// MAH3D SITE - LOGIN + UPLOAD AUTO FIX
// ============================================================

const SUPABASE_URL =
    "https://drfxgjvvldccxbccgiud.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

let currentUser = null;
let allProjects = [];
let currentModalProject = null;

// ------------------------------------------------------------
// DOM
// ------------------------------------------------------------

const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const uploadForm = document.getElementById("uploadForm");
const projectTitle = document.getElementById("projectTitle");
const projectCategory = document.getElementById("projectCategory");
const projectAccess = document.getElementById("projectAccess");
const projectPrice = document.getElementById("projectPrice");
const projectDescription =
    document.getElementById("projectDescription");
const projectFile = document.getElementById("projectFile");

const uploadBtn = document.getElementById("uploadBtn");
const uploadProgress =
    document.getElementById("uploadProgress");
const uploadStatus =
    document.getElementById("uploadStatus");

const adminProjects =
    document.getElementById("adminProjects");

const projectsContainer =
    document.getElementById("projects");


// ============================================================
// UI HELPERS
// ============================================================

function setDisplay(element, visible, displayType = "block") {

    if (!element) return;

    element.style.display =
        visible ? displayType : "none";
}


function showLogin() {

    setDisplay(loginPanel, true, "block");
    setDisplay(dashboard, false);

    console.log("MAH3D: Login panel visible");
}


function showDashboard(user) {

    currentUser = user;

    setDisplay(loginPanel, false);
    setDisplay(dashboard, true, "block");

    // IMPORTANT:
    // Override CSS display:none
    dashboard.style.display = "block";

    console.log(
        "MAH3D: Dashboard visible for",
        user?.email
    );
}


function status(message, type = "info") {

    if (!uploadStatus) return;

    uploadStatus.textContent = message;

    uploadStatus.className =
        "upload-status " + type;
}


// ============================================================
// LOGIN
// ============================================================

async function login(email, password) {

    if (!email || !password) {

        alert("Ampidiro email sy password.");

        return;
    }

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

        if (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            alert(
                "Login tsy mety:\n" +
                error.message
            );

            return;
        }

        if (!data?.user) {

            alert("Login tsy nahazo utilisateur.");

            return;
        }

        showDashboard(data.user);

        await loadProjects();

        await loadAdminProjects();

    } catch (err) {

        console.error(err);

        alert(
            "Erreur login:\n" +
            err.message
        );
    }
}


// ------------------------------------------------------------
// LOGIN FORM
// ------------------------------------------------------------

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                emailInput?.value || "";

            const password =
                passwordInput?.value || "";

            await login(
                email,
                password
            );
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        console.error(error);

        return;
    }

    currentUser = null;

    showLogin();

    alert("Déconnecté.");
}


// Make available to HTML buttons
window.logout = logout;


// ============================================================
// AUTH AUTO CHECK
// ============================================================

async function checkSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "SESSION ERROR:",
                error
            );

            showLogin();

            return;
        }

        const session =
            data?.session;

        if (session?.user) {

            showDashboard(
                session.user
            );

            await loadProjects();

            await loadAdminProjects();

        } else {

            showLogin();

            await loadProjects();
        }

    } catch (err) {

        console.error(
            "AUTO LOGIN ERROR:",
            err
        );

        showLogin();
    }
}


// ------------------------------------------------------------
// AUTH STATE LISTENER
// ------------------------------------------------------------

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "AUTH:",
            event
        );

        if (session?.user) {

            showDashboard(
                session.user
            );

            await loadProjects();

            await loadAdminProjects();

        } else {

            currentUser = null;

            showLogin();
        }
    }
);


// ============================================================
// LOAD PROJECTS
// ============================================================

async function loadProjects() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .select(`
                    id,
                    title,
                    description,
                    category,
                    file_url,
                    file_name,
                    owner_id,
                    created_at,
                    access_type,
                    price,
                    storage_path
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {

            console.error(
                "LOAD PROJECTS:",
                error
            );

            return;
        }

        allProjects =
            data || [];

        renderProjects(
            allProjects
        );

    } catch (err) {

        console.error(err);
    }
}


// ============================================================
// RENDER PUBLIC PROJECTS
// ============================================================

function renderProjects(projects) {

    if (!projectsContainer) return;

    // Raha projectsContainer dia section
    // fa tsy grid, mamorona div vaovao.
    let grid =
        document.getElementById(
            "mah3dProjectGrid"
        );

    if (!grid) {

        grid =
            document.createElement("div");

        grid.id =
            "mah3dProjectGrid";

        grid.className =
            "project-grid";

        projectsContainer.appendChild(
            grid
        );
    }

    grid.innerHTML = "";

    if (!projects.length) {

        grid.innerHTML =
            `<div class="empty-projects">
                Aucun projet disponible.
            </div>`;

        return;
    }

    projects.forEach(project => {

        const card =
            document.createElement("div");

        card.className =
            "project-card";

        const paid =
            project.access_type === "paid";

        card.innerHTML = `

            <div class="project-card-inner">

                <div class="project-category">
                    ${escapeHTML(
                        project.category || "Other"
                    )}
                </div>

                <h3>
                    ${escapeHTML(
                        project.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        project.description || ""
                    )}
                </p>

                <div class="project-meta">

                    ${
                        paid
                        ?
                        `<strong>
                            ${Number(
                                project.price || 0
                            ).toLocaleString()}
                            Ar
                        </strong>`
                        :
                        `<strong>
                            FREE
                        </strong>`
                    }

                </div>

                <button
                    class="btn btn-primary"
                    onclick="openProject('${project.id}')"
                >
                    ${
                        paid
                        ? "BUY NOW"
                        : "DOWNLOAD"
                    }
                </button>

            </div>
        `;

        grid.appendChild(card);
    });
}


// ============================================================
// ADMIN PROJECTS
// ============================================================

async function loadAdminProjects() {

    if (!currentUser) return;

    if (!adminProjects) return;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .select(`
                    id,
                    title,
                    description,
                    category,
                    file_url,
                    file_name,
                    owner_id,
                    created_at,
                    access_type,
                    price,
                    storage_path
                `)
                .eq(
                    "owner_id",
                    currentUser.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {

            console.error(
                "ADMIN PROJECTS:",
                error
            );

            adminProjects.innerHTML =
                `<p>Erreur: ${
                    escapeHTML(
                        error.message
                    )
                }</p>`;

            return;
        }

        adminProjects.innerHTML = "";

        if (!data?.length) {

            adminProjects.innerHTML =
                `<p>
                    Aucun projet uploadé.
                </p>`;

            return;
        }

        data.forEach(project => {

            const row =
                document.createElement("div");

            row.className =
                "admin-project-row";

            row.innerHTML = `

                <div>
                    <strong>
                        ${escapeHTML(
                            project.title
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            project.file_name
                        )}
                    </small>
                </div>

                <div>
                    ${
                        project.access_type === "paid"
                        ?
                        `${Number(
                            project.price || 0
                        ).toLocaleString()} Ar`
                        :
                        "FREE"
                    }
                </div>

                <button
                    class="btn btn-danger"
                    onclick="deleteProject('${project.id}')"
                >
                    DELETE
                </button>
            `;

            adminProjects.appendChild(row);
        });

    } catch (err) {

        console.error(err);
    }
}


// ============================================================
// UPLOAD
// ============================================================

if (uploadForm) {

    uploadForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            await uploadProject();
        }
    );
}


async function uploadProject() {

    if (!currentUser) {

        alert(
            "Mila manao Login aloha."
        );

        showLogin();

        return;
    }

    const title =
        projectTitle?.value.trim();

    const category =
        projectCategory?.value ||
        "Other";

    const access =
        projectAccess?.value ||
        "free";

    const description =
        projectDescription?.value.trim() ||
        "";

    const file =
        projectFile?.files?.[0];

    let price = 0;

    if (projectPrice) {

        price =
            Number(
                projectPrice.value
            ) || 0;
    }

    if (!title) {

        alert(
            "Ampidiro ny titre."
        );

        return;
    }

    if (!file) {

        alert(
            "Misafidiana fichier."
        );

        return;
    }

    if (
        access === "paid" &&
        price <= 0
    ) {

        alert(
            "Ampidiro ny prix."
        );

        return;
    }

    try {

        if (uploadBtn) {

            uploadBtn.disabled =
                true;

            uploadBtn.textContent =
                "UPLOADING...";
        }

        status(
            "Préparation de l'upload...",
            "info"
        );

        if (uploadProgress) {

            uploadProgress.value =
                10;
        }

        // ----------------------------------------------------
        // SAFE FILE NAME
        // ----------------------------------------------------

        const safeName =
            file.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

        const storagePath =
            `${currentUser.id}/${Date.now()}_${safeName}`;

        // ----------------------------------------------------
        // STORAGE UPLOAD
        // ----------------------------------------------------

        status(
            "Upload fichier...",
            "info"
        );

        if (uploadProgress) {

            uploadProgress.value =
                30;
        }

        const {
            data: storageData,
            error: storageError
        } =
            await supabaseClient
                .storage
                .from("projects")
                .upload(
                    storagePath,
                    file,
                    {
                        cacheControl:
                            "3600",
                        upsert: false
                    }
                );

        if (storageError) {

            throw new Error(
                "Storage: " +
                storageError.message
            );
        }

        // ----------------------------------------------------
        // PUBLIC URL
        // ----------------------------------------------------

        const {
            data: publicData
        } =
            supabaseClient
                .storage
                .from("projects")
                .getPublicUrl(
                    storagePath
                );

        const publicUrl =
            publicData?.publicUrl ||
            "";

        if (uploadProgress) {

            uploadProgress.value =
                65;
        }

        status(
            "Enregistrement du projet...",
            "info"
        );

        // ----------------------------------------------------
        // DATABASE
        // ----------------------------------------------------

        const {
            data: inserted,
            error: dbError
        } =
            await supabaseClient
                .from("projects")
                .insert({
                    title: title,
                    description:
                        description,
                    category: category,
                    access_type: access,
                    price:
                        access === "paid"
                        ? price
                        : 0,
                    file_url:
                        publicUrl,
                    file_name:
                        file.name,
                    storage_path:
                        storagePath,
                    owner_id:
                        currentUser.id
                })
                .select()
                .single();

        if (dbError) {

            // rollback storage
            await supabaseClient
                .storage
                .from("projects")
                .remove([
                    storagePath
                ]);

            throw new Error(
                "Database: " +
                dbError.message
            );
        }

        if (uploadProgress) {

            uploadProgress.value =
                100;
        }

        status(
            "✓ Upload réussi !",
            "success"
        );

        uploadForm.reset();

        await loadProjects();

        await loadAdminProjects();

        setTimeout(() => {

            if (uploadProgress) {

                uploadProgress.value =
                    0;
            }

            status(
                "",
                ""
            );

        }, 3000);

    } catch (err) {

        console.error(
            "UPLOAD ERROR:",
            err
        );

        status(
            "✗ " +
            err.message,
            "error"
        );

        alert(
            "Upload tsy mety:\n\n" +
            err.message
        );

    } finally {

        if (uploadBtn) {

            uploadBtn.disabled =
                false;

            uploadBtn.textContent =
                "UPLOAD PROJECT";
        }
    }
}


// ============================================================
// DELETE
// ============================================================

async function deleteProject(id) {

    if (!currentUser) {

        alert(
            "Login required."
        );

        return;
    }

    const project =
        allProjects.find(
            p => p.id === id
        );

    if (!project) return;

    if (
        project.owner_id !==
        currentUser.id
    ) {

        alert(
            "Tsy anao ity projet ity."
        );

        return;
    }

    const ok =
        confirm(
            `Delete "${project.title}" ?`
        );

    if (!ok) return;

    try {

        if (project.storage_path) {

            await supabaseClient
                .storage
                .from("projects")
                .remove([
                    project.storage_path
                ]);
        }

        const {
            error
        } =
            await supabaseClient
                .from("projects")
                .delete()
                .eq(
                    "id",
                    id
                )
                .eq(
                    "owner_id",
                    currentUser.id
                );

        if (error) {

            throw error;
        }

        await loadProjects();

        await loadAdminProjects();

        alert(
            "Projet supprimé."
        );

    } catch (err) {

        console.error(err);

        alert(
            "Delete error:\n" +
            err.message
        );
    }
}

window.deleteProject =
    deleteProject;


// ============================================================
// PROJECT MODAL
// ============================================================

function openProject(id) {

    const project =
        allProjects.find(
            p => p.id === id
        );

    if (!project) return;

    currentModalProject =
        project;

    const modal =
        document.getElementById(
            "modal"
        );

    if (!modal) return;

    const title =
        document.getElementById(
            "modalTitle"
        );

    const description =
        document.getElementById(
            "modalDescription"
        );

    const download =
        document.getElementById(
            "modalDownload"
        );

    if (title) {

        title.textContent =
            project.title;
    }

    if (description) {

        description.textContent =
            project.description || "";
    }

    if (download) {

        if (
            project.access_type ===
            "free"
        ) {

            download.href =
                project.file_url;

            download.textContent =
                "DOWNLOAD";

            download.style.display =
                "inline-flex";

        } else {

            download.removeAttribute(
                "href"
            );

            download.textContent =
                "BUY WITH MVOLA";

            download.style.display =
                "inline-flex";

            download.onclick =
                () => buyProject(project);
        }
    }

    modal.classList.add(
        "active"
    );

    modal.style.display =
        "flex";
}

window.openProject =
    openProject;


function closeModal() {

    const modal =
        document.getElementById(
            "modal"
        );

    if (!modal) return;

    modal.classList.remove(
        "active"
    );

    modal.style.display =
        "none";
}

window.closeModal =
    closeModal;


// ============================================================
// MVOLA PLACEHOLDER
// ============================================================

async function buyProject(project) {

    alert(
        "MVola payment mbola ao amin'ny test mode.\n\n" +
        "Projet: " +
        project.title +
        "\n" +
        "Prix: " +
        Number(
            project.price || 0
        ).toLocaleString() +
        " Ar"
    );
}

window.buyProject =
    buyProject;


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// PRICE FIELD
// ============================================================

if (projectAccess) {

    projectAccess.addEventListener(
        "change",
        () => {

            const priceGroup =
                document.getElementById(
                    "priceGroup"
                );

            if (!priceGroup)
                return;

            if (
                projectAccess.value ===
                "paid"
            ) {

                priceGroup.style.display =
                    "block";

            } else {

                priceGroup.style.display =
                    "none";

                if (projectPrice) {

                    projectPrice.value =
                        "0";
                }
            }
        }
    );
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "================================"
        );

        console.log(
            "MAH3D SITE STARTED"
        );

        console.log(
            "================================"
        );

        await checkSession();
    }
);

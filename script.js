"use strict";

/*
=========================================================
 MAH3D SUPABASE WEBSITE
 FREE / PAID PROJECT SYSTEM
=========================================================
*/

console.log("======================================");
console.log("MAH3D SUPABASE ADMIN STARTING");
console.log("======================================");


/* =======================================================
   SUPABASE CONFIG
======================================================= */

const SUPABASE_URL =
    "https://drfxgjvvldccxbccgiud.supabase.co";

/*
 IMPORTANT:

Apetaho eto ilay Publishable key izay efa nampiasainao
tamin'ilay version mandeha.

Aza apetraka eto mihitsy ny sb_secret_...
*/

const SUPABASE_KEY =
    "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";


if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {
    console.error(
        "Supabase library not loaded."
    );

    alert(
        "Supabase library tsy tafiditra. Jereo ny CDN ao amin'ny index.html."
    );

    throw new Error(
        "Supabase library missing"
    );
}


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


console.log(
    "Supabase URL:",
    SUPABASE_URL
);


/* =======================================================
   SHORTCUT
======================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =======================================================
   GLOBAL STATE
======================================================= */

let currentUser = null;

let allProjects = [];

let currentModalProject = null;


/* =======================================================
   DOM
======================================================= */

const loginPanel =
    $("loginPanel");

const loginForm =
    $("loginForm");

const emailInput =
    $("email");

const passwordInput =
    $("password");

const loginBtn =
    $("loginBtn");

const loginMessage =
    $("loginMessage");

const dashboard =
    $("dashboard");

const adminEmail =
    $("adminEmail");

const logoutBtn =
    $("logoutBtn");

const statusDot =
    $("statusDot");

const connectionStatus =
    $("connectionStatus");

const projectCount =
    $("projectCount");

const paidCount =
    $("paidCount");

const databaseStatus =
    $("databaseStatus");

const uploadForm =
    $("uploadForm");

const projectTitle =
    $("projectTitle");

const projectDescription =
    $("projectDescription");

const projectCategory =
    $("projectCategory");

const projectAccess =
    $("projectAccess");

const projectPrice =
    $("projectPrice");

const priceGroup =
    $("priceGroup");

const projectFile =
    $("projectFile");

const uploadBtn =
    $("uploadBtn");

const uploadProgress =
    $("uploadProgress");

const uploadStatus =
    $("uploadStatus");

const adminProjects =
    $("adminProjects");

const searchInput =
    $("searchInput");

const categoryFilter =
    $("categoryFilter");

const accessFilter =
    $("accessFilter");

const projectsGrid =
    $("projectsGrid");

const modal =
    $("modal");

const closeModal =
    $("closeModal");

const modalCategory =
    $("modalCategory");

const modalTitle =
    $("modalTitle");

const modalDescription =
    $("modalDescription");

const modalPrice =
    $("modalPrice");

const modalDownload =
    $("modalDownload");

const year =
    $("year");


/* =======================================================
   YEAR
======================================================= */

if (year) {
    year.textContent =
        new Date().getFullYear();
}


/* =======================================================
   INITIAL CHECK
======================================================= */

console.log(
    "loginForm:",
    !!loginForm
);

console.log(
    "Supabase client:",
    !!supabaseClient
);


/* =======================================================
   HELPERS
======================================================= */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalizeAccess(project) {

    return project &&
        project.access_type === "paid"
        ? "paid"
        : "free";
}


function getPrice(project) {

    const value =
        Number(project?.price);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return value;
}


function formatPrice(price) {

    const value =
        Number(price);

    if (!Number.isFinite(value)) {
        return "0.00";
    }

    return value.toFixed(2);
}


/*
Change this if you want another currency.
Example:
"USD"
"EUR"
"MGA"
*/

const CURRENCY =
    "USD";


function formatMoney(price) {

    const value =
        Number(price);

    if (!Number.isFinite(value)) {
        return "0.00 " + CURRENCY;
    }

    return (
        formatPrice(value)
        + " "
        + CURRENCY
    );
}


function setStatus(
    element,
    message,
    type = ""
) {

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "status";

    if (type) {
        element.classList.add(type);
    }
}


/* =======================================================
   ACCESS TYPE UI
======================================================= */

function updatePriceVisibility() {

    if (!projectAccess ||
        !priceGroup ||
        !projectPrice) {
        return;
    }

    const isPaid =
        projectAccess.value === "paid";

    if (isPaid) {

        priceGroup.classList.remove(
            "hidden"
        );

        projectPrice.disabled =
            false;

        projectPrice.required =
            true;

        if (
            !projectPrice.value ||
            Number(projectPrice.value) <= 0
        ) {
            projectPrice.value =
                "5.00";
        }

    } else {

        priceGroup.classList.add(
            "hidden"
        );

        projectPrice.disabled =
            true;

        projectPrice.required =
            false;

        projectPrice.value =
            "0";
    }
}


if (projectAccess) {

    projectAccess.addEventListener(
        "change",
        updatePriceVisibility
    );

    updatePriceVisibility();
}


/* =======================================================
   AUTH
======================================================= */

async function getCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) {

            console.warn(
                "getUser error:",
                error.message
            );

            return null;
        }

        return data?.user || null;

    } catch (error) {

        console.error(
            "getCurrentUser error:",
            error
        );

        return null;
    }
}


/* =======================================================
   SHOW LOGIN
======================================================= */

function showLogin() {

    if (loginPanel) {
        loginPanel.classList.remove(
            "hidden"
        );
    }

    if (dashboard) {
        dashboard.classList.add(
            "hidden"
        );
    }

    if (adminEmail) {
        adminEmail.textContent =
            "-";
    }
}


/* =======================================================
   SHOW DASHBOARD
======================================================= */

function showDashboard(user) {

    if (loginPanel) {
        loginPanel.classList.add(
            "hidden"
        );
    }

    if (dashboard) {
        dashboard.classList.remove(
            "hidden"
        );
    }

    if (adminEmail) {
        adminEmail.textContent =
            user?.email || "";
    }
}


/* =======================================================
   LOGIN
======================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            setStatus(
                loginMessage,
                "Signing in..."
            );

            if (loginBtn) {
                loginBtn.disabled =
                    true;

                loginBtn.textContent =
                    "LOGIN...";
            }

            const email =
                emailInput?.value
                    .trim() || "";

            const password =
                passwordInput?.value || "";


            if (!email ||
                !password) {

                setStatus(
                    loginMessage,
                    "Email and password are required.",
                    "error"
                );

                if (loginBtn) {
                    loginBtn.disabled =
                        false;

                    loginBtn.textContent =
                        "LOGIN";
                }

                return;
            }


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email,
                            password
                        });


                if (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );

                    setStatus(
                        loginMessage,
                        error.message,
                        "error"
                    );

                    return;
                }


                currentUser =
                    data?.user || null;


                setStatus(
                    loginMessage,
                    "Login successful.",
                    "success"
                );


                showDashboard(
                    currentUser
                );


                await loadProjects();

                await loadAdminProjects();


            } catch (error) {

                console.error(
                    "LOGIN EXCEPTION:",
                    error
                );

                setStatus(
                    loginMessage,
                    error.message ||
                    "Login failed.",
                    "error"
                );

            } finally {

                if (loginBtn) {

                    loginBtn.disabled =
                        false;

                    loginBtn.textContent =
                        "LOGIN";
                }
            }
        }
    );
}


/* =======================================================
   LOGOUT
======================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function() {

            try {

                await supabaseClient.auth.signOut();

                currentUser =
                    null;

                showLogin();

                if (loginMessage) {
                    setStatus(
                        loginMessage,
                        "Logged out.",
                        "success"
                    );
                }

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );
            }
        }
    );
}


/* =======================================================
   AUTH STATE
======================================================= */

supabaseClient.auth.onAuthStateChange(
    async function(event, session) {

        console.log(
            "AUTH EVENT:",
            event
        );


        currentUser =
            session?.user || null;


        if (currentUser) {

            showDashboard(
                currentUser
            );

            await loadAdminProjects();

        } else {

            showLogin();
        }
    }
);


/* =======================================================
   LOAD PUBLIC PROJECTS
======================================================= */

async function loadProjects() {

    console.log(
        "Loading projects..."
    );


    if (databaseStatus) {

        databaseStatus.textContent =
            "Loading...";

        databaseStatus.style.color =
            "";
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .select(
                    "id,title,description,category,file_url,file_name,owner_id,created_at,access_type,price"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "PROJECT LOAD ERROR:",
                error
            );

            allProjects = [];

            renderProjects();

            if (databaseStatus) {

                databaseStatus.textContent =
                    "ERROR";

                databaseStatus.style.color =
                    "#ff7189";
            }

            return;
        }


        allProjects =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "Projects loaded:",
            allProjects
        );


        if (databaseStatus) {

            databaseStatus.textContent =
                "OK";

            databaseStatus.style.color =
                "var(--green)";
        }


        updateStats();

        renderProjects();


    } catch (error) {

        console.error(
            "LOAD PROJECTS EXCEPTION:",
            error
        );

        allProjects = [];

        renderProjects();

        if (databaseStatus) {

            databaseStatus.textContent =
                "ERROR";

            databaseStatus.style.color =
                "#ff7189";
        }
    }
}


/* =======================================================
   UPDATE STATS
======================================================= */

function updateStats() {

    const total =
        allProjects.length;


    const paid =
        allProjects.filter(
            project =>
                normalizeAccess(project)
                === "paid"
        ).length;


    if (projectCount) {
        projectCount.textContent =
            total;
    }


    if (paidCount) {
        paidCount.textContent =
            paid;
    }


    if (connectionStatus) {
        connectionStatus.textContent =
            "Online";
    }


    if (statusDot) {
        statusDot.style.background =
            "var(--green)";
    }
}


/* =======================================================
   FILTER
======================================================= */

function getFilteredProjects() {

    const search =
        (
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const category =
        categoryFilter?.value ||
        "all";


    const access =
        accessFilter?.value ||
        "all";


    return allProjects.filter(
        project => {

            const title =
                String(
                    project.title || ""
                ).toLowerCase();


            const description =
                String(
                    project.description || ""
                ).toLowerCase();


            const projectCategory =
                String(
                    project.category || "Other"
                );


            const projectAccess =
                normalizeAccess(
                    project
                );


            const matchesSearch =
                !search ||
                title.includes(search) ||
                description.includes(search);


            const matchesCategory =
                category === "all" ||
                projectCategory === category;


            const matchesAccess =
                access === "all" ||
                projectAccess === access;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesAccess
            );
        }
    );
}


/* =======================================================
   SEARCH EVENTS
======================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderProjects
    );
}


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        renderProjects
    );
}


if (accessFilter) {

    accessFilter.addEventListener(
        "change",
        renderProjects
    );
}


/* =======================================================
   RENDER PUBLIC PROJECTS
======================================================= */

function renderProjects() {

    if (!projectsGrid) {
        return;
    }


    const projects =
        getFilteredProjects();


    if (!projects.length) {

        projectsGrid.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    📦
                </div>

                <div>
                    No projects found.
                </div>

            </div>
        `;

        return;
    }


    projectsGrid.innerHTML =
        projects
            .map(
                project =>
                    createProjectCard(
                        project,
                        false
                    )
            )
            .join("");
}


/* =======================================================
   PROJECT CARD
======================================================= */

function createProjectCard(
    project,
    isAdmin = false
) {

    const access =
        normalizeAccess(
            project
        );


    const price =
        getPrice(project);


    const category =
        escapeHTML(
            project.category ||
            "Other"
        );


    const title =
        escapeHTML(
            project.title ||
            "Untitled Project"
        );


    const description =
        escapeHTML(
            project.description ||
            "No description."
        );


    const fileName =
        escapeHTML(
            project.file_name ||
            ""
        );


    let accessBadge = "";

    let priceHTML = "";


    if (access === "paid") {

        accessBadge = `
            <span class="badge badge-paid">
                💎 PAID
            </span>
        `;

        priceHTML = `
            <div class="price paid">
                ${escapeHTML(
                    formatMoney(price)
                )}
            </div>
        `;

    } else {

        accessBadge = `
            <span class="badge badge-free">
                🟢 FREE
            </span>
        `;

        priceHTML = `
            <div class="price free">
                FREE
            </div>
        `;
    }


    let footer = "";


    if (isAdmin) {

        footer = `
            <div class="card-footer">

                <button
                    class="btn btn-secondary"
                    type="button"
                    onclick="openProjectModal('${project.id}')"
                >
                    View
                </button>

                <button
                    class="btn btn-danger"
                    type="button"
                    onclick="deleteProject('${project.id}')"
                >
                    Delete
                </button>

            </div>
        `;

    } else {

        footer = `
            <div class="card-footer">

                <button
                    class="btn btn-primary"
                    type="button"
                    onclick="openProjectModal('${project.id}')"
                >
                    ${
                        access === "paid"
                            ? "💎 VIEW PAID MODEL"
                            : "⬇ VIEW / DOWNLOAD"
                    }
                </button>

            </div>
        `;
    }


    return `
        <article
            class="project-card"
        >

            <div class="card-top">

                <div class="badges">

                    <span class="badge badge-category">
                        ${category}
                    </span>

                    ${accessBadge}

                </div>

                <h3>
                    ${title}
                </h3>

            </div>


            <div class="card-body">

                <p class="project-description">
                    ${description}
                </p>

                ${priceHTML}

                ${
                    fileName
                    ? `
                        <div
                            style="
                                margin-top:10px;
                                color:#637086;
                                font-size:11px;
                            "
                        >
                            📁 ${fileName}
                        </div>
                    `
                    : ""
                }

            </div>

            ${footer}

        </article>
    `;
}


/* =======================================================
   OPEN PROJECT MODAL
======================================================= */

window.openProjectModal =
    function(projectId) {

        const project =
            allProjects.find(
                item =>
                    String(item.id)
                    === String(projectId)
            );


        if (!project) {

            console.error(
                "Project not found:",
                projectId
            );

            return;
        }


        currentModalProject =
            project;


        const access =
            normalizeAccess(
                project
            );


        const price =
            getPrice(project);


        if (modalCategory) {

            modalCategory.innerHTML = `

                <span class="badge badge-category">
                    ${escapeHTML(
                        project.category ||
                        "Other"
                    )}
                </span>

                ${
                    access === "paid"

                    ? `
                        <span class="badge badge-paid">
                            💎 PAID
                        </span>
                    `

                    : `
                        <span class="badge badge-free">
                            🟢 FREE
                        </span>
                    `
                }

            `;
        }


        if (modalTitle) {

            modalTitle.textContent =
                project.title ||
                "Untitled Project";
        }


        if (modalDescription) {

            modalDescription.textContent =
                project.description ||
                "No description.";
        }


        if (modalPrice) {

            if (access === "paid") {

                modalPrice.textContent =
                    formatMoney(price);

                modalPrice.style.color =
                    "var(--gold)";

            } else {

                modalPrice.textContent =
                    "FREE";

                modalPrice.style.color =
                    "var(--green)";
            }
        }


        if (modalDownload) {

            modalDownload.href =
                project.file_url || "#";


            if (access === "paid") {

                modalDownload.textContent =
                    "💎 DOWNLOAD / PURCHASE";

            } else {

                modalDownload.textContent =
                    "⬇ DOWNLOAD FREE";

            }
        }


        if (modal) {

            modal.classList.add(
                "show"
            );
        }
    };


/* =======================================================
   CLOSE MODAL
======================================================= */

function closeProjectModal() {

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }

    currentModalProject =
        null;
}


if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeProjectModal
    );
}


if (modal) {

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target === modal
            ) {
                closeProjectModal();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeProjectModal();
        }
    }
);


/* =======================================================
   LOAD ADMIN PROJECTS
======================================================= */

async function loadAdminProjects() {

    if (!adminProjects) {
        return;
    }


    const user =
        currentUser ||
        await getCurrentUser();


    if (!user) {

        adminProjects.innerHTML =
            "";

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .select(
                    "id,title,description,category,file_url,file_name,owner_id,created_at,access_type,price"
                )
                .eq(
                    "owner_id",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "ADMIN PROJECT ERROR:",
                error
            );

            adminProjects.innerHTML = `
                <div class="empty">
                    ${escapeHTML(
                        error.message
                    )}
                </div>
            `;

            return;
        }


        if (!data ||
            !data.length) {

            adminProjects.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">
                        📦
                    </div>

                    <div>
                        No projects uploaded yet.
                    </div>
                </div>
            `;

            return;
        }


        adminProjects.innerHTML =
            data
                .map(
                    project =>
                        createProjectCard(
                            project,
                            true
                        )
                )
                .join("");


    } catch (error) {

        console.error(
            "ADMIN PROJECT EXCEPTION:",
            error
        );
    }
}


/* =======================================================
   FILE NAME
======================================================= */

function makeSafeFileName(
    fileName
) {

    return fileName
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
}


/* =======================================================
   UPLOAD
======================================================= */

if (uploadForm) {

    uploadForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const user =
                currentUser ||
                await getCurrentUser();


            if (!user) {

                setStatus(
                    uploadStatus,
                    "Tsy maintsy manao login aloha.",
                    "error"
                );

                return;
            }


            const title =
                projectTitle?.value
                    .trim() || "";


            const description =
                projectDescription?.value
                    .trim() || "";


            const category =
                projectCategory?.value ||
                "Other";


            const access =
                projectAccess?.value ||
                "free";


            const file =
                projectFile?.files?.[0];


            let price =
                0;


            if (access === "paid") {

                price =
                    Number(
                        projectPrice?.value ||
                        0
                    );


                if (
                    !Number.isFinite(price) ||
                    price <= 0
                ) {

                    setStatus(
                        uploadStatus,
                        "Ampidiro ny vidiny ho an'ny PAID model.",
                        "error"
                    );

                    return;
                }
            }


            if (!title) {

                setStatus(
                    uploadStatus,
                    "Ampidiro ny project title.",
                    "error"
                );

                return;
            }


            if (!file) {

                setStatus(
                    uploadStatus,
                    "Misafidiana fichier.",
                    "error"
                );

                return;
            }


            /*
            File size:
            Supabase Storage limit depends
            on your project configuration.
            We don't impose an artificial small limit here.
            */


            if (uploadBtn) {

                uploadBtn.disabled =
                    true;

                uploadBtn.textContent =
                    "UPLOADING...";
            }


            if (uploadProgress) {
                uploadProgress.style.width =
                    "10%";
            }


            setStatus(
                uploadStatus,
                "Preparing upload..."
            );


            try {

                /*
                =============================================
                CREATE UNIQUE STORAGE PATH
                =============================================
                */

                const timestamp =
                    Date.now();


                const safeName =
                    makeSafeFileName(
                        file.name
                    );


                const storagePath =
                    `${user.id}/${timestamp}_${safeName}`;


                setStatus(
                    uploadStatus,
                    "Uploading file..."
                );


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "35%";
                }


                /*
                =============================================
                STORAGE UPLOAD
                =============================================
                */

                const {
                    error:
                        uploadError
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

                                upsert:
                                    false
                            }
                        );


                if (uploadError) {

                    console.error(
                        "STORAGE UPLOAD ERROR:",
                        uploadError
                    );

                    throw new Error(
                        uploadError.message
                    );
                }


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "70%";
                }


                setStatus(
                    uploadStatus,
                    "Creating project record..."
                );


                /*
                =============================================
                PUBLIC URL
                =============================================
                */

                const {
                    data:
                        publicUrlData
                } =
                    supabaseClient
                        .storage
                        .from("projects")
                        .getPublicUrl(
                            storagePath
                        );


                const fileUrl =
                    publicUrlData?.publicUrl;


                if (!fileUrl) {

                    throw new Error(
                        "Could not create public file URL."
                    );
                }


                /*
                =============================================
                DATABASE INSERT
                =============================================
                */

                const {
                    error:
                        databaseError
                } =
                    await supabaseClient
                        .from("projects")
                        .insert({
                            title:
                                title,

                            description:
                                description,

                            category:
                                category,

                            file_url:
                                fileUrl,

                            file_name:
                                file.name,

                            owner_id:
                                user.id,

                            access_type:
                                access,

                            price:
                                access === "paid"
                                    ? price
                                    : 0
                        });


                if (databaseError) {

                    console.error(
                        "DATABASE INSERT ERROR:",
                        databaseError
                    );


                    /*
                    If database insert fails,
                    try deleting uploaded file
                    so storage doesn't get orphaned.
                    */

                    try {

                        await supabaseClient
                            .storage
                            .from("projects")
                            .remove([
                                storagePath
                            ]);

                    } catch (
                        cleanupError
                    ) {

                        console.warn(
                            "Cleanup failed:",
                            cleanupError
                        );
                    }


                    throw new Error(
                        databaseError.message
                    );
                }


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "100%";
                }


                setStatus(
                    uploadStatus,
                    access === "paid"
                        ? "💎 PAID model uploaded successfully!"
                        : "🟢 FREE model uploaded successfully!",
                    "success"
                );


                /*
                Reset form
                */

                uploadForm.reset();


                if (projectPrice) {
                    projectPrice.value =
                        "0";
                }


                if (projectAccess) {
                    projectAccess.value =
                        "free";
                }


                updatePriceVisibility();


                /*
                Reload everything
                */

                await loadProjects();

                await loadAdminProjects();


                /*
                Reset progress after delay
                */

                setTimeout(
                    function() {

                        if (
                            uploadProgress
                        ) {
                            uploadProgress.style.width =
                                "0%";
                        }

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "UPLOAD ERROR:",
                    error
                );


                setStatus(
                    uploadStatus,
                    "Upload failed: " +
                    (
                        error.message ||
                        "Unknown error"
                    ),
                    "error"
                );


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "0%";
                }

            } finally {

                if (uploadBtn) {

                    uploadBtn.disabled =
                        false;

                    uploadBtn.textContent =
                        "🚀 UPLOAD PROJECT";
                }
            }
        }
    );
}


/* =======================================================
   DELETE PROJECT
======================================================= */

window.deleteProject =
    async function(projectId) {

        const user =
            currentUser ||
            await getCurrentUser();


        if (!user) {

            alert(
                "Login required."
            );

            return;
        }


        const project =
            allProjects.find(
                item =>
                    String(item.id)
                    === String(projectId)
            );


        if (!project) {

            alert(
                "Project not found."
            );

            return;
        }


        if (
            String(project.owner_id)
            !== String(user.id)
        ) {

            alert(
                "You can only delete your own project."
            );

            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${project.title}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            /*
            =============================================
            DELETE DATABASE RECORD FIRST
            =============================================
            */

            const {
                error:
                    deleteError
            } =
                await supabaseClient
                    .from("projects")
                    .delete()
                    .eq(
                        "id",
                        projectId
                    )
                    .eq(
                        "owner_id",
                        user.id
                    );


            if (deleteError) {

                console.error(
                    "DELETE DB ERROR:",
                    deleteError
                );

                throw new Error(
                    deleteError.message
                );
            }


            /*
            =============================================
            TRY TO DELETE STORAGE FILE
            =============================================

            Extract path from public URL.
            */

            if (project.file_url) {

                try {

                    const marker =
                        "/storage/v1/object/public/projects/";

                    const index =
                        project.file_url.indexOf(
                            marker
                        );


                    if (index !== -1) {

                        const path =
                            decodeURIComponent(
                                project.file_url
                                    .substring(
                                        index +
                                        marker.length
                                    )
                            );


                        if (path) {

                            const {
                                error:
                                    storageError
                            } =
                                await supabaseClient
                                    .storage
                                    .from("projects")
                                    .remove([
                                        path
                                    ]);


                            if (storageError) {

                                console.warn(
                                    "Storage delete warning:",
                                    storageError
                                );
                            }
                        }
                    }

                } catch (
                    storageCleanupError
                ) {

                    console.warn(
                        "Storage cleanup failed:",
                        storageCleanupError
                    );
                }
            }


            alert(
                "Project deleted successfully."
            );


            await loadProjects();

            await loadAdminProjects();


        } catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );


            alert(
                "Delete failed: " +
                (
                    error.message ||
                    "Unknown error"
                )
            );
        }
    };


/* =======================================================
   CONNECTION STATUS
======================================================= */

async function testConnection() {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("projects")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                );


        if (error) {

            console.error(
                "Connection test error:",
                error
            );

            if (connectionStatus) {
                connectionStatus.textContent =
                    "Error";
            }

            if (statusDot) {
                statusDot.style.background =
                    "var(--red)";
            }

            return false;
        }


        if (connectionStatus) {
            connectionStatus.textContent =
                "Online";
        }

        if (statusDot) {
            statusDot.style.background =
                "var(--green)";
        }


        return true;


    } catch (error) {

        console.error(
            "Connection exception:",
            error
        );

        return false;
    }
}


/* =======================================================
   INITIALIZE
======================================================= */

async function init() {

    console.log(
        "MAH3D initialization..."
    );


    /*
    Initial public library
    */

    await loadProjects();


    /*
    Connection
    */

    await testConnection();


    /*
    Current auth
    */

    const user =
        await getCurrentUser();


    currentUser =
        user;


    if (user) {

        console.log(
            "Current user:",
            user.email
        );

        showDashboard(
            user
        );

        await loadAdminProjects();

    } else {

        console.log(
            "Current user: null"
        );

        showLogin();
    }


    console.log(
        "MAH3D initialization complete."
    );
}


/* =======================================================
   START
======================================================= */

init();

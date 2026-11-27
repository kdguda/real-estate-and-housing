document.addEventListener("DOMContentLoaded", () => {
    // =========================================================
    // 1. SEARCH & FILTER LOGIC (Runs on index.html)
    // =========================================================
    const searchForm = document.getElementById("search-form");
    const locationInput = document.getElementById("location-input");
    const priceSelect = document.getElementById("price-select");
    const typeSelect = document.getElementById("type-select");
    const genderSelect = document.getElementById("gender-select");
    const cards = document.querySelectorAll(".card");
    const listingsContainer = document.querySelector(".listings");

    if (searchForm && listingsContainer && cards.length > 0) {
        const noResultsMsg = document.createElement("p");
        noResultsMsg.textContent = "No dorms or boarding houses match your filters.";
        noResultsMsg.style.display = "none";
        noResultsMsg.style.gridColumn = "1 / -1";
        noResultsMsg.style.textAlign = "center";
        noResultsMsg.style.padding = "40px";
        noResultsMsg.style.color = "#666";
        listingsContainer.appendChild(noResultsMsg);

        function filterCards() {
            const locationQuery = locationInput.value.toLowerCase().trim();
            const priceFilter = priceSelect.value;
            const typeFilter = typeSelect.value;
            const genderFilter = genderSelect.value;

            let visibleCount = 0;

            cards.forEach((card) => {
                const title = card.querySelector("h2").textContent.toLowerCase();
                const address = card.querySelector(".address").textContent.toLowerCase();
                const extraLocations = (card.dataset.location || "").toLowerCase();

                const cardPrice = parseInt(card.dataset.price, 10);
                const cardType = card.dataset.type;
                const cardGender = card.dataset.gender;

                const matchesLocation = !locationQuery ||
                                        title.includes(locationQuery) ||
                                        address.includes(locationQuery) ||
                                        extraLocations.includes(locationQuery);

                let matchesPrice = true;
                if (priceFilter === "low") {
                    matchesPrice = cardPrice < 3000;
                } else if (priceFilter === "medium") {
                    matchesPrice = cardPrice >= 3000 && cardPrice <= 5000;
                } else if (priceFilter === "high") {
                    matchesPrice = cardPrice > 5000;
                }

                const matchesType = !typeFilter || cardType === typeFilter;
                const matchesGender = !genderFilter || cardGender === genderFilter;

                if (matchesLocation && matchesPrice && matchesType && matchesGender) {
                    card.style.display = "flex";

                    card.classList.remove("fade-in");
                    void card.offsetWidth;
                    card.classList.add("fade-in");

                    visibleCount++;
                } else {
                    card.style.display = "none";
                    card.classList.remove("fade-in");
                }
            });

            noResultsMsg.style.display = visibleCount === 0 ? "block" : "none";
        }

        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            filterCards();
        });
    }

    // =========================================================
    // 2. ENLARGED CARD DETAILS MODAL (Works on index & favorites)
    // =========================================================
    const modal = document.getElementById("details-modal");
    const modalContainer = document.getElementById("modal-card-container");
    const closeModalBtn = document.getElementById("close-modal");

    if (modal && modalContainer && closeModalBtn) {
        document.addEventListener("click", (event) => {
            const btn = event.target.closest(".card .btn");
            if (!btn) return;
            event.preventDefault();

            const originalCard = btn.closest(".card");
            const clonedCard = originalCard.cloneNode(true);

            const clonedBtn = clonedCard.querySelector(".btn");
            if (clonedBtn) clonedBtn.remove();

            const clonedFav = clonedCard.querySelector(".fav-btn");
            if (clonedFav) clonedFav.remove();

            const rawDetails = btn.dataset.details || "";
            if (rawDetails) {
                const detailsBox = document.createElement("div");
                detailsBox.className = "extra-details-box";

                rawDetails.split("|").forEach((item) => {
                    const line = document.createElement("p");
                    line.textContent = item.trim();
                    detailsBox.appendChild(line);
                });

                clonedCard.appendChild(detailsBox);
            }

            modalContainer.innerHTML = "";
            modalContainer.appendChild(clonedCard);
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        });

        function closeModal() {
            modal.classList.remove("active");
            document.body.style.overflow = "";
        }

        closeModalBtn.addEventListener("click", closeModal);

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal.classList.contains("active")) {
                closeModal();
            }
        });
    }

    // =========================================================
    // 3. INTERACTIVE GENERAL MAP (Runs on index.html)
    // =========================================================
    const mapElement = document.getElementById("map");
    if (mapElement && typeof L !== "undefined") {
        const map = L.map("map", {
            center: [13.88, 121.00],
            zoom: 10,
            scrollWheelZoom: true
        });

        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles &copy; Esri",
            maxZoom: 19
        }).addTo(map);
    }

    // =========================================================
    // 4. FAVORITES SYSTEM (Syncs index.html <-> favorites.html)
    // =========================================================
    function getFavorites() {
        return JSON.parse(localStorage.getItem("dormFavorites") || "[]");
    }

    function saveFavorites(favList) {
        localStorage.setItem("dormFavorites", JSON.stringify(favList));
        updateFavCounter();
    }

    function updateFavCounter() {
        const countSpan = document.getElementById("fav-count");
        if (countSpan) {
            countSpan.textContent = `(${getFavorites().length})`;
        }
    }

    const currentFavs = getFavorites();
    updateFavCounter();

    cards.forEach((card) => {
        const cardId = card.dataset.id;
        const favBtn = card.querySelector(".fav-btn");
        if (!cardId || !favBtn) return;

        if (currentFavs.some((item) => item.id === cardId)) {
            favBtn.classList.add("favorited");
            favBtn.innerHTML = "&#9829;";
        }

        favBtn.addEventListener("click", () => {
            let favs = getFavorites();
            const existingIndex = favs.findIndex((item) => item.id === cardId);

            if (existingIndex > -1) {
                favs.splice(existingIndex, 1);
                favBtn.classList.remove("favorited");
                favBtn.innerHTML = "&#9825;";
            } else {
                favs.push({
                    id: cardId,
                    title: card.querySelector("h2").textContent,
                    img: card.querySelector("img").src,
                    address: card.querySelector(".address").textContent,
                    price: card.querySelector(".price").textContent,
                    amenities: card.querySelector(".amenities").textContent,
                    details: card.querySelector(".btn").dataset.details || ""
                });
                favBtn.classList.add("favorited");
                favBtn.innerHTML = "&#9829;";
            }

            saveFavorites(favs);
        });
    });

    const favoritesContainer = document.getElementById("favorites-listings");
    if (favoritesContainer) {
        function renderFavoritesPage() {
            const favs = getFavorites();
            favoritesContainer.innerHTML = "";

            if (favs.length === 0) {
                favoritesContainer.innerHTML = `
                    <p style="grid-column: 1 / -1; text-align: center; padding: 50px; color: #666;">
                        You haven't saved any dorms yet. <a href="index.html" style="color: #4aa3ad; font-weight: bold;">Browse listings</a> and click the &#9825; next to a name to save it!
                    </p>`;
                return;
            }

            favs.forEach((dorm) => {
                const article = document.createElement("article");
                article.className = "card fade-in";
                article.dataset.id = dorm.id;
                article.innerHTML = `
                    <img src="${dorm.img}" alt="${dorm.title}">
                    <div class="card-header">
                        <h2>${dorm.title}</h2>
                        <button type="button" class="fav-btn favorited" title="Remove from favorites">&#9829;</button>
                    </div>
                    <p class="address">${dorm.address}</p>
                    <p class="price">${dorm.price}</p>
                    <p class="amenities">${dorm.amenities}</p>
                    <a href="#" class="btn" data-details="${dorm.details}">View Details</a>
                `;

                article.querySelector(".fav-btn").addEventListener("click", () => {
                    const updated = getFavorites().filter((item) => item.id !== dorm.id);
                    saveFavorites(updated);
                    renderFavoritesPage();
                });

                favoritesContainer.appendChild(article);
            });
        }

        renderFavoritesPage();
    }

    // =========================================================
    // 5. LOGIN / SIGN UP STATE (Validated Against Registered Users)
    // =========================================================
    const navGreeting = document.getElementById("nav-user-greeting");
    const navAuthLink = document.getElementById("nav-auth-link");
    const savedUser = JSON.parse(localStorage.getItem("dormUser") || "null");

    // 5a. Update Navbar Greeting & Login/Logout Link
    if (savedUser && navAuthLink) {
        if (navGreeting) {
            navGreeting.textContent = `Hi, ${savedUser.name.split(" ")[0]}`;
            navGreeting.style.display = "inline-block";
        }

        navAuthLink.textContent = "Logout";
        navAuthLink.href = "#";
        navAuthLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("dormUser");
            window.location.href = "login.html";
        });
    }

    // 5b. Login & Sign Up Tab Switching + Validation (on login.html)
    const authTabs = document.querySelectorAll(".auth-tab");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authMessage = document.getElementById("auth-message");

    if (authTabs.length > 0 && loginForm && registerForm) {
        authTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                authTabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");

                if (tab.dataset.tab === "login") {
                    loginForm.style.display = "flex";
                    registerForm.style.display = "none";
                } else {
                    loginForm.style.display = "none";
                    registerForm.style.display = "flex";
                }
                if (authMessage) authMessage.textContent = "";
            });
        });

        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const fullName = document.getElementById("reg-name").value.trim();
            const email = document.getElementById("reg-email").value.trim().toLowerCase();
            const password = document.getElementById("reg-password").value;

            const users = JSON.parse(localStorage.getItem("dormRegisteredUsers") || "[]");

            if (users.some((u) => u.email === email)) {
                if (authMessage) {
                    authMessage.style.color = "#d9534f";
                    authMessage.textContent = "An account with this email already exists. Please log in.";
                }
                return;
            }

            const newUser = { name: fullName, email, password };
            users.push(newUser);
            localStorage.setItem("dormRegisteredUsers", JSON.stringify(users));
            localStorage.setItem("dormUser", JSON.stringify({ name: fullName, email }));

            if (authMessage) {
                authMessage.style.color = "#2e7d32";
                authMessage.textContent = "Account created! Redirecting...";
            }
            setTimeout(() => { window.location.href = "index.html"; }, 800);
        });

        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("login-email").value.trim().toLowerCase();
            const passwordInput = document.getElementById("login-password").value;

            const users = JSON.parse(localStorage.getItem("dormRegisteredUsers") || "[]");
            const matchedUser = users.find(
                (u) => u.email === emailInput && u.password === passwordInput
            );

            if (!matchedUser) {
                if (authMessage) {
                    authMessage.style.color = "#d9534f";
                    authMessage.textContent = "Invalid email or password. Please sign up first if you don't have an account.";
                }
                return;
            }

            localStorage.setItem("dormUser", JSON.stringify({
                name: matchedUser.name,
                email: matchedUser.email
            }));

            if (authMessage) {
                authMessage.style.color = "#2e7d32";
                authMessage.textContent = `Welcome back, ${matchedUser.name.split(" ")[0]}! Redirecting...`;
            }
            setTimeout(() => { window.location.href = "index.html"; }, 800);
        });
    }

    const resetBtn = document.getElementById("reset-storage-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.reload();
        });
    }
});
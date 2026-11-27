document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("search-form");
    const locationInput = document.getElementById("location-input");
    const priceSelect = document.getElementById("price-select");
    const typeSelect = document.getElementById("type-select");
    const genderSelect = document.getElementById("gender-select");
    
    const cards = document.querySelectorAll(".card");
    const listingsContainer = document.querySelector(".listings");

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

    const modal = document.getElementById("details-modal");
    const modalContainer = document.getElementById("modal-card-container");
    const closeModalBtn = document.getElementById("close-modal");
    const detailButtons = document.querySelectorAll(".card .btn");

    detailButtons.forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.preventDefault();

            const originalCard = btn.closest(".card");
            const clonedCard = originalCard.cloneNode(true);

            const clonedBtn = clonedCard.querySelector(".btn");
            if (clonedBtn) {
                clonedBtn.remove();
            }

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

    const mapElement = document.getElementById("map");
    if (mapElement && typeof L !== "undefined") {
        const map = L.map("map", {
            center: [13.88, 121.00],
            zoom: 10,
            scrollWheelZoom: true
        });

        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }).addTo(map);
    }

});
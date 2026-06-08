console.log("Travel Buddy Premium Engine Loaded");

// Handle Dark Mode Toggle
const themeToggleBtn = document.getElementById("themeToggleBtn");
if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        const isDark = document.body.classList.contains("dark-theme");
        if (isDark) {
            themeToggleBtn.innerHTML = `<span class="toggle-icon">☀️</span> Light Mode`;
        } else {
            themeToggleBtn.innerHTML = `<span class="toggle-icon">🌙</span> Dark Mode`;
        }
    });
}

// Sidebar Interactive Navigation (Aesthetic active menu switching & SPA View Swapping)
const menuItems = document.querySelectorAll(".menu-item");
const viewPanels = document.querySelectorAll(".view-panel");

function switchView(viewName) {
    let viewId = viewName;
    if (!viewName.startsWith("view")) {
        viewId = "view" + viewName;
    }
    
    // Hide all view panels
    viewPanels.forEach(panel => {
        panel.classList.remove("active-view");
    });
    
    // Show active panel
    const activePanel = document.getElementById(viewId);
    if (activePanel) {
        activePanel.classList.add("active-view");
    }
    
    // Update active state in sidebar
    menuItems.forEach(item => {
        item.classList.remove("active");
    });
    
    // Map viewId back to menuId
    let menuId = "menuHome";
    if (viewId === "viewHome") menuId = "menuHome";
    else if (viewId === "viewTrips") menuId = "menuTrips";
    else if (viewId === "viewFavorites") menuId = "menuFavorites";
    else if (viewId === "viewBudget") menuId = "menuBudget";
    else if (viewId === "viewInspiration") menuId = "menuInspiration";
    else if (viewId === "viewSettings") menuId = "menuSettings";
    
    const menuItem = document.getElementById(menuId);
    if (menuItem) {
        menuItem.classList.add("active");
    }
    
    // If favorites, trips, budget, or inspiration view is loaded, render contents dynamically
    if (viewId === "viewFavorites") {
        renderFavorites();
    } else if (viewId === "viewTrips") {
        renderSavedTrips();
    } else if (viewId === "viewBudget") {
        renderBudgetPlanner();
    } else if (viewId === "viewInspiration") {
        renderInspiration();
    } else if (viewId === "viewSettings") {
        loadSettings();
    }
}

// Attach event listeners to sidebar items
menuItems.forEach(item => {
    item.addEventListener("click", () => {
        const itemId = item.id;
        let viewName = "Home";
        if (itemId === "menuHome") viewName = "Home";
        else if (itemId === "menuTrips") viewName = "Trips";
        else if (itemId === "menuFavorites") viewName = "Favorites";
        else if (itemId === "menuBudget") viewName = "Budget";
        else if (itemId === "menuInspiration") viewName = "Inspiration";
        else if (itemId === "menuSettings") viewName = "Settings";
        
        switchView(viewName);
    });
});

async function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const text = input.value.trim();

    if (text === "") {
        return;
    }

    // Append User Message
    const userWrapper = document.createElement("div");
    userWrapper.className = "message-wrapper user-wrapper";
    
    const userDiv = document.createElement("div");
    userDiv.className = "user-message";
    userDiv.innerText = text;
    
    userWrapper.appendChild(userDiv);
    chatBox.appendChild(userWrapper);

    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // Create & Append Loading Bot Message
    const botWrapper = document.createElement("div");
    botWrapper.className = "message-wrapper bot-wrapper";

    const botAvatar = document.createElement("img");
    botAvatar.src = "assets/bot_avatar.png";
    botAvatar.alt = "Bot Avatar";
    botAvatar.className = "message-avatar";

    const botDiv = document.createElement("div");
    botDiv.className = "bot-message";
    botDiv.innerHTML = "✈️ Planning your trip and detailing budgets...";

    botWrapper.appendChild(botAvatar);
    botWrapper.appendChild(botDiv);
    chatBox.appendChild(botWrapper);
    
    // Scroll down to show loading status
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // Enrich user message with travel settings preferences
        const settings = getSettings();
        let enrichedMessage = text;
        
        if (settings.budget && settings.budget !== 'moderate') {
            enrichedMessage += ` (Budget: ${settings.budget} tier)`;
        }
        if (settings.pace && settings.pace !== 'moderate') {
            enrichedMessage += ` (Travel Pace: ${settings.pace})`;
        }
        if (settings.currency && settings.currency !== '₹') {
            enrichedMessage += ` (use currency symbol ${settings.currency} in budget totals and items)`;
        }

        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: enrichedMessage })
        });

        const data = await response.json();
        
        if (!response.ok) {
            let errorMsg = "Something went wrong on the server.";
            try {
                const parsedReply = JSON.parse(data.reply);
                if (parsedReply.error) {
                    if (typeof parsedReply.error === 'object' && parsedReply.error.message) {
                        errorMsg = parsedReply.error.message;
                    } else if (typeof parsedReply.error === 'string') {
                        errorMsg = parsedReply.error;
                    }
                }
            } catch(e) {}
            
            const lowerError = errorMsg.toLowerCase();
            if (response.status === 500 && (lowerError.includes("demand") || lowerError.includes("unavailable") || lowerError.includes("busy"))) {
                botDiv.innerHTML = "⚠️ <strong>Travel Buddy is busy:</strong> The Gemini AI model is currently experiencing high demand. Please wait a moment and try again!";
            } else if (lowerError.includes("internal error") || lowerError.includes("internal") || response.status === 500) {
                botDiv.innerHTML = "⚠️ <strong>Gemini API Temporary Error:</strong> Google's AI server experienced a temporary internal glitch. Please click <strong>Send</strong> again to retry!";
            } else {
                botDiv.innerHTML = `❌ <strong>Error:</strong> ${errorMsg}`;
            }
            return;
        }
        
        // Render Structured Plan
        try {
            let cleanText = data.reply.trim();
            
            // Clean markdown backticks if returned by LLM
            if (cleanText.startsWith("```json")) {
                cleanText = cleanText.substring(7);
            } else if (cleanText.startsWith("```")) {
                cleanText = cleanText.substring(3);
            }
            if (cleanText.endsWith("```")) {
                cleanText = cleanText.slice(0, -3);
            }
            cleanText = cleanText.trim();
            
            const plan = JSON.parse(cleanText);
            
            if (plan.error || plan.Error) {
                const errMsg = plan.error || plan.Error;
                if (errMsg.includes("demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("busy")) {
                    botDiv.innerHTML = "⚠️ <strong>Travel Buddy is busy:</strong> The Gemini AI model is currently experiencing high demand. Please try again in a few seconds!";
                } else {
                    botDiv.innerHTML = `❌ <strong>Error:</strong> ${errMsg}`;
                }
            } else {
                // Generate a unique ID for this plan in the chat session
                const planId = 'plan-' + Date.now();
                window.chatPlans = window.chatPlans || {};
                window.chatPlans[planId] = plan;
                
                botDiv.innerHTML = renderPlan(plan, planId);
            }
        } catch (parseError) {
            console.error("JSON Parsing failed. Falling back to plain text format.", parseError);
            // Fallback plain-text layout
            botDiv.innerHTML = data.reply
                .replace(/\n/g, "<br>")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        }

    } catch (error) {
        console.error("Fetch request failed:", error);
        botDiv.innerHTML = "❌ Failed to connect to Travel Buddy server. Please check your network or restart the server.";
    }

    // Scroll to latest content
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to generate styled structured card layouts
function renderPlan(plan, planId = '') {
    let html = '';
    
    // Support case-insensitive keys
    const intro = plan.intro || plan.Intro || '';
    const destination = plan.destination || plan.Destination;
    const itinerary = plan.itinerary || plan.Itinerary;
    const photographySpots = plan.photographySpots || plan.PhotographySpots;
    const foodRecommendations = plan.foodRecommendations || plan.FoodRecommendations;
    const travelTips = plan.travelTips || plan.TravelTips;

    // We need the destination name to make unique IDs for favorites
    const destTitle = destination ? (destination.name || destination.Name || 'Unspecified') : 'Unspecified';

    // Intro greeting
    if (intro) {
        html += `<div class="bot-response-header">${intro}</div>`;
    }
    
    html += `<div class="itinerary-grid">`;
    
    // Destination Card with Budget Table
    if (destination) {
        const dest = destination;
        const budget = dest.budget || dest.Budget || {};
        const items = budget.items || budget.Items || [];
        const destNote = budget.note || budget.Note || 'Budget breakdown';
        
        const destId = 'destination-' + destTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
        const activeClass = isFavorited(destId) ? 'is-active' : '';
        
        // Generate unique tripId for saving full plan
        const daysCount = budget.days || (itinerary ? itinerary.length : 2);
        const tripId = 'trip-' + destTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim() + '-' + daysCount + '-days';
        const isSaved = isTripSaved(tripId);
        const activeSavedClass = isSaved ? 'is-saved' : '';
        
        let saveButtonHtml = '';
        if (planId) {
            saveButtonHtml = `
                <button class="save-trip-btn ${activeSavedClass}" data-trip-id="${tripId}" onclick="saveFullTrip(this, '${planId}', '${tripId}')" title="Save full trip itinerary">
                    <span class="save-icon">💾</span>
                </button>
            `;
        }
        
        html += `
            <div class="bot-card card-destination">
                <div class="card-fav-action">
                    ${saveButtonHtml}
                    <button class="fav-toggle-btn ${activeClass}" data-fav-id="${destId}" onclick="toggleFavoriteItem(this, 'destination', '${escapeJsString(destTitle)}', '${escapeJsString(destNote)}')" title="Save to favorites">
                        <span class="heart-icon">❤️</span>
                    </button>
                </div>
                <h4>📍 Destination</h4>
                <div class="subtitle">${destTitle}</div>
                <table class="budget-table">
        `;
        
        if (Array.isArray(items)) {
            items.forEach(item => {
                if (item && typeof item === 'object') {
                    const category = item.category || item.Category || '';
                    const amount = item.amount || item.Amount || '';
                    const icon = item.icon || item.Icon || '💰';
                    html += `
                        <tr>
                            <td>${icon} ${category}</td>
                            <td class="amount">${amount}</td>
                        </tr>
                    `;
                }
            });
        }
        
        html += `
                </table>
        `;
        const note = budget.note || budget.Note;
        if (note) {
            html += `<div class="budget-note">${note}</div>`;
        }
        html += `</div>`;
    }
    
    // Itinerary Day Cards
    if (itinerary && Array.isArray(itinerary)) {
        itinerary.forEach(day => {
            const dayNum = day.day || day.Day || '';
            const theme = day.theme || day.Theme || '';
            const items = day.items || day.Items || [];
            
            // Assign color class based on day number
            let colorClass = 'card-day-generic';
            if (dayNum === 1 || dayNum === 2 || dayNum === 3) {
                colorClass = `card-day-${dayNum}`;
            }
            
            html += `
                <div class="bot-card ${colorClass}">
                    <h4>📅 Day ${dayNum}</h4>
                    <div class="subtitle">${theme}</div>
                    <ul class="card-list">
            `;
            
            if (Array.isArray(items)) {
                items.forEach(item => {
                    html += `<li>${item}</li>`;
                });
            }
            
            html += `
                    </ul>
                </div>
            `;
        });
    }
    
    html += `</div>`; // Close itinerary-grid
    
    html += `<div class="bottom-pills-container">`;
    
    // Photography Spots Pill
    if (photographySpots && Array.isArray(photographySpots) && photographySpots.length > 0) {
        const spotsText = photographySpots.join(", ");
        const spotsId = 'spot-' + (destTitle + '-photography-spots').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
        const activeClass = isFavorited(spotsId) ? 'is-active' : '';
        
        html += `
            <div class="bottom-pill-card pill-photography">
                <div class="card-fav-action">
                    <button class="fav-toggle-btn ${activeClass}" data-fav-id="${spotsId}" onclick="toggleFavoriteItem(this, 'spot', 'Spots: ${escapeJsString(destTitle)}', '${escapeJsString(spotsText)}')" title="Save to favorites">
                        <span class="heart-icon">❤️</span>
                    </button>
                </div>
                <div class="pill-icon-container">📷</div>
                <div class="pill-content">
                    <h5>Photography Spots</h5>
                    <p>${spotsText}</p>
                </div>
            </div>
        `;
    }
    
    // Food Recommendations Pill
    if (foodRecommendations && Array.isArray(foodRecommendations) && foodRecommendations.length > 0) {
        const foodText = foodRecommendations.join(", ");
        const foodId = 'food-' + (destTitle + '-food-recommendations').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
        const activeClass = isFavorited(foodId) ? 'is-active' : '';
        
        html += `
            <div class="bottom-pill-card pill-food">
                <div class="card-fav-action">
                    <button class="fav-toggle-btn ${activeClass}" data-fav-id="${foodId}" onclick="toggleFavoriteItem(this, 'food', 'Food: ${escapeJsString(destTitle)}', '${escapeJsString(foodText)}')" title="Save to favorites">
                        <span class="heart-icon">❤️</span>
                    </button>
                </div>
                <div class="pill-icon-container">🍲</div>
                <div class="pill-content">
                    <h5>Food Recommendations</h5>
                    <p>${foodText}</p>
                </div>
            </div>
        `;
    }
    
    // Travel Tips Pill
    if (travelTips && Array.isArray(travelTips) && travelTips.length > 0) {
        const tipsText = travelTips.join(", ");
        const tipsId = 'tip-' + (destTitle + '-travel-tips').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
        const activeClass = isFavorited(tipsId) ? 'is-active' : '';
        
        html += `
            <div class="bottom-pill-card pill-tips">
                <div class="card-fav-action">
                    <button class="fav-toggle-btn ${activeClass}" data-fav-id="${tipsId}" onclick="toggleFavoriteItem(this, 'tip', 'Tips: ${escapeJsString(destTitle)}', '${escapeJsString(tipsText)}')" title="Save to favorites">
                        <span class="heart-icon">❤️</span>
                    </button>
                </div>
                <div class="pill-icon-container">💡</div>
                <div class="pill-content">
                    <h5>Travel Tips</h5>
                    <p>${tipsText}</p>
                </div>
            </div>
        `;
    }
    
    html += `</div>`; // Close bottom-pills-container
    
    return html;
}

// Press Enter to Send
document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// ==========================================
// FAVORITES SYSTEM AND UTILITIES
// ==========================================

const FAV_STORAGE_KEY = "travel_buddy_favorites";

// Helper to safely escape JavaScript strings for inline handlers
function escapeJsString(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Get all favorites from localStorage
function getFavorites() {
    try {
        const favs = localStorage.getItem(FAV_STORAGE_KEY);
        return favs ? JSON.parse(favs) : [];
    } catch (e) {
        console.error("Failed to read favorites from localStorage:", e);
        return [];
    }
}

// Check if an item is already favorited
function isFavorited(id) {
    const favs = getFavorites();
    return favs.some(item => item.id === id);
}

// Save a favorite item to localStorage
function saveFavorite(item) {
    try {
        const favs = getFavorites();
        if (!favs.some(f => f.id === item.id)) {
            favs.push(item);
            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
        }
    } catch (e) {
        console.error("Failed to save favorite:", e);
    }
}

// Remove a favorite item from localStorage
function removeFavorite(id) {
    try {
        let favs = getFavorites();
        favs = favs.filter(item => item.id !== id);
        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
    } catch (e) {
        console.error("Failed to remove favorite:", e);
    }
}

// Toggle favorite in UI and localStorage
function toggleFavoriteItem(btnEl, type, title, details) {
    if (window.event) {
        window.event.stopPropagation();
    }
    
    // Generate unique ID based on type and destination/title
    const id = type + '-' + title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();
    
    if (isFavorited(id)) {
        removeFavorite(id);
        btnEl.classList.remove("is-active");
    } else {
        saveFavorite({
            id: id,
            type: type,
            title: title,
            details: details,
            timestamp: Date.now()
        });
        btnEl.classList.add("is-active");
    }
    
    // If the favorites page is active, refresh it immediately
    const viewFavorites = document.getElementById("viewFavorites");
    if (viewFavorites && viewFavorites.classList.contains("active-view")) {
        renderFavorites();
    }
}

// Unfavorite from the Favorites page and sync with chat toggle buttons
function removeFavoriteAndReload(id) {
    removeFavorite(id);
    renderFavorites();
    
    // Find and untoggle the active heart buttons in the chat area
    const activeButtons = document.querySelectorAll(`.fav-toggle-btn[data-fav-id="${id}"]`);
    activeButtons.forEach(btn => btn.classList.remove("is-active"));
}

// Dynamically render saved favorites onto the Favorites view panel
function renderFavorites() {
    const favs = getFavorites();
    
    const destGrid = document.getElementById("favDestinationsGrid");
    const foodGrid = document.getElementById("favFoodGrid");
    const spotsGrid = document.getElementById("favSpotsGrid");
    const tipsGrid = document.getElementById("favTipsGrid");
    
    if (!destGrid || !foodGrid || !spotsGrid || !tipsGrid) return;
    
    // Clear existing content
    destGrid.innerHTML = '';
    foodGrid.innerHTML = '';
    spotsGrid.innerHTML = '';
    tipsGrid.innerHTML = '';
    
    let destCount = 0;
    let foodCount = 0;
    let spotsCount = 0;
    let tipsCount = 0;
    
    // Sort chronologically (newest first)
    favs.sort((a, b) => b.timestamp - a.timestamp);
    
    favs.forEach(item => {
        const cardHtml = `
            <div class="fav-card">
                <div class="fav-card-content">
                    <div class="fav-card-title">${item.title}</div>
                    <div class="fav-card-details">${item.details}</div>
                </div>
                <div class="fav-card-footer">
                    <div class="fav-card-date">Saved ${new Date(item.timestamp).toLocaleDateString()}</div>
                    <button class="unfav-btn" onclick="removeFavoriteAndReload('${item.id}')">
                        <span>💔</span> Unsave
                    </button>
                </div>
            </div>
        `;
        
        if (item.type === 'destination') {
            destGrid.innerHTML += cardHtml;
            destCount++;
        } else if (item.type === 'food') {
            foodGrid.innerHTML += cardHtml;
            foodCount++;
        } else if (item.type === 'spot') {
            spotsGrid.innerHTML += cardHtml;
            spotsCount++;
        } else if (item.type === 'tip') {
            tipsGrid.innerHTML += cardHtml;
            tipsCount++;
        }
    });
    
    // Inject empty states if categories are empty
    if (destCount === 0) {
        destGrid.innerHTML = '<div class="no-favs-msg">No saved destinations yet. Click the heart icon (❤️) on travel plans to save them!</div>';
    }
    if (foodCount === 0) {
        foodGrid.innerHTML = '<div class="no-favs-msg">No saved food items yet.</div>';
    }
    if (spotsCount === 0) {
        spotsGrid.innerHTML = '<div class="no-favs-msg">No saved photography spots yet.</div>';
    }
    if (tipsCount === 0) {
        tipsGrid.innerHTML = '<div class="no-favs-msg">No saved travel tips yet.</div>';
    }
}

// ==========================================
// TRIPS SAVING SYSTEM AND MODAL
// ==========================================

const SAVED_TRIPS_STORAGE_KEY = "travel_buddy_saved_trips";

// Get saved trips from localStorage
function getSavedTrips() {
    try {
        const trips = localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
        return trips ? JSON.parse(trips) : [];
    } catch (e) {
        console.error("Failed to read saved trips:", e);
        return [];
    }
}

// Check if a specific trip is saved
function isTripSaved(tripId) {
    const trips = getSavedTrips();
    return trips.some(t => t.tripId === tripId);
}

// Save trip details to localStorage
function saveFullTrip(btnEl, planId, tripId) {
    if (window.event) {
        window.event.stopPropagation();
    }
    
    // Check if the plan exists in our runtime cache
    const plan = window.chatPlans ? window.chatPlans[planId] : null;
    if (!plan) {
        console.error("Plan not found in cache for ID:", planId);
        return;
    }
    
    try {
        const trips = getSavedTrips();
        if (isTripSaved(tripId)) {
            // Unsave it
            removeTrip(tripId);
            btnEl.classList.remove("is-saved");
        } else {
            // Save it
            const dest = plan.destination || plan.Destination || {};
            const budget = dest.budget || dest.Budget || {};
            const daysCount = budget.days || (plan.itinerary ? plan.itinerary.length : 2);
            const destTitle = dest.name || dest.Name || 'Unspecified';
            const totalBudget = budget.total || budget.Total || 'Unspecified';
            const introText = plan.intro || plan.Intro || 'Custom Travel Plan';
            
            trips.push({
                tripId: tripId,
                planId: planId,
                destination: destTitle,
                days: daysCount,
                budget: totalBudget,
                intro: introText,
                plan: plan, // Save the entire raw JSON plan!
                timestamp: Date.now()
            });
            localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(trips));
            btnEl.classList.add("is-saved");
        }
        
        // Refresh Saved Trips view if it's currently loaded
        const viewTrips = document.getElementById("viewTrips");
        if (viewTrips && viewTrips.classList.contains("active-view")) {
            renderSavedTrips();
        }
    } catch (e) {
        console.error("Failed to save full trip:", e);
    }
}

// Remove trip from localStorage
function removeTrip(tripId) {
    try {
        let trips = getSavedTrips();
        trips = trips.filter(t => t.tripId !== tripId);
        localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (e) {
        console.error("Failed to remove saved trip:", e);
    }
}

// Delete trip card and reload view
function deleteTripAndReload(tripId) {
    if (window.event) {
        window.event.stopPropagation();
    }
    
    removeTrip(tripId);
    renderSavedTrips();
    
    // Sync back with any active save buttons in the chat area
    const activeSaveBtns = document.querySelectorAll(`.save-trip-btn[data-trip-id="${tripId}"]`);
    activeSaveBtns.forEach(btn => btn.classList.remove("is-saved"));
    
    // Refresh Budget Planner if it's active
    const viewBudget = document.getElementById("viewBudget");
    if (viewBudget && viewBudget.classList.contains("active-view")) {
        renderBudgetPlanner();
    }
}

// Render list of saved trips under the My Trips view panel
function renderSavedTrips() {
    const tripsGrid = document.getElementById("tripsGrid");
    if (!tripsGrid) return;
    
    const trips = getSavedTrips();
    tripsGrid.innerHTML = '';
    
    if (trips.length === 0) {
        tripsGrid.innerHTML = '<div class="no-trips-msg">No saved trips yet. Click "Save Trip" (💾) on travel plans to save them!</div>';
        return;
    }
    
    // Sort by newest first
    trips.sort((a, b) => b.timestamp - a.timestamp);
    
    trips.forEach(trip => {
        const cardHtml = `
            <div class="trip-card" onclick="openTripDetails('${trip.tripId}')">
                <div class="trip-card-header">
                    <div class="trip-card-destination">📍 ${trip.destination}</div>
                    <div class="trip-card-days">${trip.days} Days</div>
                </div>
                <div class="trip-card-body">
                    <div class="trip-card-intro">${trip.intro}</div>
                    <div class="trip-card-stats">
                        <div class="trip-card-stat">
                            <span>💰 Budget:</span>
                            <span class="trip-card-stat-val">${trip.budget}</span>
                        </div>
                    </div>
                </div>
                <div class="trip-card-footer">
                    <div class="trip-card-date">Planned on ${new Date(trip.timestamp).toLocaleDateString()}</div>
                    <button class="trip-delete-btn" onclick="deleteTripAndReload('${trip.tripId}')">
                        <span>🗑️</span> Delete
                    </button>
                </div>
            </div>
        `;
        tripsGrid.innerHTML += cardHtml;
    });
}

// Open details popup modal and render the complete trip plan
function openTripDetails(tripId) {
    const trips = getSavedTrips();
    const trip = trips.find(t => t.tripId === tripId);
    if (!trip) return;
    
    const modalContent = document.getElementById("modalTripContent");
    const modal = document.getElementById("tripDetailsModal");
    
    if (modalContent && modal) {
        // Render the full plan using our existing renderPlan function
        // Note: we can pass a dummy planId since we don't need to save/bookmark it from inside the modal, or pass the saved planId!
        modalContent.innerHTML = renderPlan(trip.plan, trip.planId);
        modal.classList.add("active-view"); // Re-use view styling class or show class
        modal.style.display = "flex";
    }
}

// Close trip details details modal
function closeTripDetails() {
    const modal = document.getElementById("tripDetailsModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// ==========================================
// TRIP BUDGET PLANNER SYSTEM
// ==========================================

// Parse numeric values from currency string formats (e.g. "₹15,000" -> 15000)
function parseCurrencyToNumber(amountStr) {
    if (!amountStr) return 0;
    if (typeof amountStr === 'number') return amountStr;
    const cleanStr = amountStr.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

// Extract currency prefix/symbol from string
function getCurrencySymbol(amountStr) {
    if (!amountStr) return '₹';
    if (typeof amountStr !== 'string') return '₹';
    const match = amountStr.match(/^[^0-9]+/);
    return match ? match[0] : '';
}

// Map category name to standard category classes/labels
function getCategoryClassAndLabel(itemCategory) {
    const cat = itemCategory.toLowerCase();
    if (cat.includes("accommodation") || cat.includes("hotel") || cat.includes("stay") || cat.includes("lodging") || cat.includes("hostel") || cat.includes("resort")) {
        return { className: "bar-accommodation", label: "Accommodation" };
    }
    if (cat.includes("food") || cat.includes("meal") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("drink")) {
        return { className: "bar-food", label: "Food & Dining" };
    }
    if (cat.includes("transport") || cat.includes("travel") || cat.includes("cab") || cat.includes("bus") || cat.includes("flight") || cat.includes("train") || cat.includes("taxi") || cat.includes("fare") || cat.includes("conveyance")) {
        return { className: "bar-transport", label: "Transportation" };
    }
    if (cat.includes("activit") || cat.includes("sightseeing") || cat.includes("entry") || cat.includes("ticket") || cat.includes("tour") || cat.includes("guide") || cat.includes("monument")) {
        return { className: "bar-activities", label: "Activities" };
    }
    return { className: "bar-misc", label: "Miscellaneous" };
}

// Render the Budget Planner dashboard
function renderBudgetPlanner() {
    const trips = getSavedTrips();
    const selectEl = document.getElementById("budgetTripSelect");
    const emptyStateEl = document.getElementById("budgetEmptyState");
    const dashboardEl = document.getElementById("budgetDashboard");
    
    if (!selectEl || !emptyStateEl || !dashboardEl) return;
    
    if (trips.length === 0) {
        dashboardEl.style.display = "none";
        emptyStateEl.style.display = "block";
        return;
    }
    
    dashboardEl.style.display = "block";
    emptyStateEl.style.display = "none";
    
    // Save current selection to restore if possible
    const previousSelection = selectEl.value;
    
    // Populate dropdown options
    selectEl.innerHTML = '';
    trips.forEach(trip => {
        const option = document.createElement("option");
        option.value = trip.tripId;
        option.textContent = `📍 ${trip.destination} (${trip.days} Days)`;
        selectEl.appendChild(option);
    });
    
    // Restore selection or default to first trip
    if (previousSelection && trips.some(t => t.tripId === previousSelection)) {
        selectEl.value = previousSelection;
    } else {
        selectEl.value = trips[0].tripId;
    }
    
    // Render selected trip details
    onBudgetTripChange();
}

// Handle trip selection changes in budget dropdown
function onBudgetTripChange() {
    const selectEl = document.getElementById("budgetTripSelect");
    if (!selectEl) return;
    
    const selectedTripId = selectEl.value;
    const trips = getSavedTrips();
    const trip = trips.find(t => t.tripId === selectedTripId);
    
    if (!trip) return;
    
    const plan = trip.plan || {};
    const destination = plan.destination || plan.Destination || {};
    const budget = destination.budget || destination.Budget || {};
    const items = budget.items || budget.Items || [];
    const daysCount = budget.days || trip.days || 1;
    
    const totalBudgetNum = parseCurrencyToNumber(budget.total || trip.budget);
    const symbol = getCurrencySymbol(budget.total || trip.budget || '');
    
    // Update metric displays
    document.getElementById("budgetTotalValue").textContent = budget.total || trip.budget || '-';
    document.getElementById("budgetDurationValue").textContent = `${daysCount} ${daysCount === 1 ? 'Day' : 'Days'}`;
    
    const dailyAvg = Math.round(totalBudgetNum / daysCount);
    document.getElementById("budgetDailyAvgValue").textContent = symbol + dailyAvg.toLocaleString();
    
    // Group and aggregate expenses
    const categoryTotals = {
        "bar-accommodation": { label: "Accommodation", amount: 0, icon: "🏨" },
        "bar-food": { label: "Food & Dining", amount: 0, icon: "🍲" },
        "bar-transport": { label: "Transportation", amount: 0, icon: "🚗" },
        "bar-activities": { label: "Activities", amount: 0, icon: "🎟️" },
        "bar-misc": { label: "Miscellaneous", amount: 0, icon: "🛍️" }
    };
    
    let calculatedTotal = 0;
    items.forEach(item => {
        const rawAmount = parseCurrencyToNumber(item.amount);
        calculatedTotal += rawAmount;
        const categoryInfo = getCategoryClassAndLabel(item.category || '');
        categoryTotals[categoryInfo.className].amount += rawAmount;
        if (item.icon && item.icon !== '💰') {
            categoryTotals[categoryInfo.className].icon = item.icon;
        }
    });
    
    const divisor = calculatedTotal > 0 ? calculatedTotal : (totalBudgetNum > 0 ? totalBudgetNum : 1);
    
    // Render progress bars
    let barsHtml = '';
    Object.entries(categoryTotals).forEach(([key, cat]) => {
        if (cat.amount > 0 || calculatedTotal > 0) {
            const pct = Math.round((cat.amount / divisor) * 100);
            barsHtml += `
                <div class="budget-bar-group ${key}" data-percentage="${pct}">
                    <div class="budget-bar-labels">
                        <span>${cat.icon} ${cat.label}</span>
                        <span class="category-meta">
                            ${symbol}${cat.amount.toLocaleString()} 
                            (<span class="budget-bar-percentage">${pct}%</span>)
                        </span>
                    </div>
                    <div class="budget-bar-outer">
                        <div class="budget-bar-inner" style="width: 0%;"></div>
                    </div>
                </div>
            `;
        }
    });
    
    document.getElementById("budgetChartBars").innerHTML = barsHtml;
    
    // Trigger progress bar slide transitions
    setTimeout(() => {
        const bars = document.querySelectorAll(".budget-bar-group");
        bars.forEach(bar => {
            const pct = bar.getAttribute("data-percentage");
            const inner = bar.querySelector(".budget-bar-inner");
            if (inner) {
                inner.style.width = pct + "%";
            }
        });
    }, 50);
    
    // Determine highest category for smart tips
    let highestCategoryKey = '';
    let maxAmount = -1;
    Object.entries(categoryTotals).forEach(([key, cat]) => {
        if (cat.amount > maxAmount) {
            maxAmount = cat.amount;
            highestCategoryKey = key;
        }
    });
    
    // Render dynamic saving recommendations
    let adviceHtml = '';
    if (highestCategoryKey === 'bar-accommodation' && maxAmount > 0) {
        adviceHtml += `
            <div class="advice-item advice-accommodation">
                <div class="advice-icon">🏨</div>
                <div class="advice-text">
                    <strong>Optimize Lodging Costs</strong>
                    Accommodation is your largest expense. Consider booking homestays, hostels, or guesthouses slightly outside major tourist zones. Booking in advance can also yield up to 20% savings.
                </div>
            </div>
        `;
    } else if (highestCategoryKey === 'bar-food' && maxAmount > 0) {
        adviceHtml += `
            <div class="advice-item advice-food">
                <div class="advice-icon">🍲</div>
                <div class="advice-text">
                    <strong>Dine Like a Local</strong>
                    Food and dining is your highest expenditure. Seek out local dhabas, street food hubs, or family-run cafes where locals eat. Check if your accommodation offers free breakfast!
                </div>
            </div>
        `;
    } else if (highestCategoryKey === 'bar-transport' && maxAmount > 0) {
        adviceHtml += `
            <div class="advice-item advice-transport">
                <div class="advice-icon">🚗</div>
                <div class="advice-text">
                    <strong>Smart Local Transit</strong>
                    Transportation takes the biggest slice of your budget. Utilize public buses, metro networks, or shared cabs. If feasible, renting a scooter or bicycle is highly cost-effective.
                </div>
            </div>
        `;
    } else if (highestCategoryKey === 'bar-activities' && maxAmount > 0) {
        adviceHtml += `
            <div class="advice-item advice-general">
                <div class="advice-icon">🎟️</div>
                <div class="advice-text">
                    <strong>Free & Low-Cost Activities</strong>
                    Sightseeing and tours are your primary expense. Research free entry days for museums, join free walking tours, and prioritize scenic nature spots like beaches, parks, or viewpoints.
                </div>
            </div>
        `;
    } else {
        adviceHtml += `
            <div class="advice-item advice-general">
                <div class="advice-icon">🛍️</div>
                <div class="advice-text">
                    <strong>Miscellaneous Spend Caps</strong>
                    Shopping or other miscellaneous fees are leading your expenses. Set a daily spending limit for souvenirs, compare prices at multiple local shops, and haggle politely.
                </div>
            </div>
        `;
    }
    
    // Generic secondary advice
    adviceHtml += `
        <div class="advice-item advice-general">
            <div class="advice-icon">💡</div>
            <div class="advice-text">
                <strong>Track Everyday Spends</strong>
                Small daily purchases like bottled water, snacks, and impulse buys can quickly add up. Carry a reusable water bottle and log your expenses in a notepad or app.
            </div>
        </div>
    `;
    
    document.getElementById("budgetAdviceContent").innerHTML = adviceHtml;
}

// ==========================================
// TRAVEL INSPIRATION SYSTEM
// ==========================================

const INSPIRATION_DATA = [
    {
        id: "insp-munnar",
        name: "Munnar",
        state: "Kerala",
        tag: "mountains",
        categoryLabel: "⛰️ Mountains & Nature",
        rating: "4.8",
        travelers: "12k+",
        budget: "mid",
        budgetLabel: "💰 Mid Budget",
        image: "assets/munnar_inspiration.png",
        description: "Explore endless rolling tea gardens, scenic lake viewpoints, and beautiful wildlife sanctuaries nestled in the clouds.",
        planPrompt: "focusing on tea plantations, mountain trekking, and monsoons"
    },
    {
        id: "insp-goa",
        name: "Goa",
        state: "Coastal India",
        tag: "beaches",
        categoryLabel: "🏝️ Beaches & Coast",
        rating: "4.7",
        travelers: "25k+",
        budget: "low",
        budgetLabel: "💰 Eco Budget",
        image: "assets/goa_inspiration.png",
        description: "Enjoy sunset cruises, sandy beach shacks, historic Portuguese churches, and delicious seafood curries along the Arabian Sea.",
        planPrompt: "focusing on beach sunset spots, heritage churches, and coastal seafood joints"
    },
    {
        id: "insp-jaipur",
        name: "Jaipur",
        state: "Rajasthan",
        tag: "heritage",
        categoryLabel: "🕌 Heritage & Culture",
        rating: "4.9",
        travelers: "18k+",
        budget: "mid",
        budgetLabel: "💰 Mid Budget",
        image: "assets/jaipur_inspiration.png",
        description: "Step into royal fortresses, pink palaces, bustling local markets, and experience colorful Rajasthani heritage.",
        planPrompt: "focusing on fort exploration, palace architecture, and local handicrafts markets"
    },
    {
        id: "insp-manali",
        name: "Manali",
        state: "Himachal Pradesh",
        tag: "adventure",
        categoryLabel: "🏂 Snowy Adventure",
        rating: "4.8",
        travelers: "15k+",
        budget: "high",
        budgetLabel: "💎 Premium",
        image: "assets/manali_inspiration.png",
        description: "Indulge in snow sports at Solang Valley, hike through pine forests, and cross the spectacular Atal Tunnel to Lahaul.",
        planPrompt: "focusing on winter sports, high mountain views, and hiking"
    }
];

// Render the Travel Inspiration view
function renderInspiration() {
    filterInspiration('all');
}

// Filter and render inspiration cards
function filterInspiration(category) {
    const gridEl = document.getElementById("inspirationGrid");
    const tagsEl = document.getElementById("inspirationTags");
    if (!gridEl || !tagsEl) return;
    
    // Update active tag button class
    const buttons = tagsEl.querySelectorAll(".inspiration-tag");
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute("onclick");
        if (onclickAttr && onclickAttr.includes(`'${category}'`)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // Filter data
    const filtered = category === 'all' 
        ? INSPIRATION_DATA 
        : INSPIRATION_DATA.filter(item => item.tag === category);
        
    // Generate HTML with dynamic animation delay staggered per card
    let cardsHtml = '';
    filtered.forEach((item, index) => {
        cardsHtml += `
            <div class="inspiration-card" style="animation-delay: ${index * 0.1}s">
                <div class="card-image-wrapper">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="card-rating-badge">
                        ⭐ ${item.rating} <span class="travelers">(${item.travelers})</span>
                    </div>
                    <div class="card-budget-badge budget-${item.budget}">
                        ${item.budgetLabel}
                    </div>
                </div>
                <div class="inspiration-card-content">
                    <div class="card-title-row">
                        <span class="card-category-tag">${item.categoryLabel}</span>
                        <h4>${item.name}, ${item.state}</h4>
                    </div>
                    <p>${item.description}</p>
                    <button class="btn-card-plan" onclick="triggerAiPlan('${item.name}', '${item.planPrompt}')">
                        <span>✈️</span> Plan this Trip
                    </button>
                </div>
            </div>
        `;
    });
    
    gridEl.innerHTML = cardsHtml;
}

// Trigger chatbot execution
function triggerAiPlan(destinationName, details) {
    // 1. Switch back to Home view where the AI Chatbot is located
    switchView("Home");
    
    // 2. Locate chatbot input
    const inputEl = document.getElementById("userInput");
    if (!inputEl) return;
    
    // 3. Pre-populate the user query
    inputEl.value = `Plan a 3-day trip to ${destinationName} ${details}`;
    
    // 4. Fire the message submission automatically
    sendMessage();
}

// ==========================================
// TRIP SETTINGS SYSTEM
// ==========================================

const SETTINGS_STORAGE_KEY = "travel_buddy_settings";
const DEFAULT_SETTINGS = {
    username: "Explorer",
    currency: "₹",
    pace: "moderate",
    budget: "moderate"
};

// Retrieve settings from localStorage
function getSettings() {
    try {
        const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    } catch (e) {
        console.error("Failed to read settings from storage:", e);
        return DEFAULT_SETTINGS;
    }
}

// Set selected preference button group class highlights
function setSelectPreference(type, value) {
    const groupEl = document.getElementById(`settings${type}Group`);
    if (!groupEl) return;
    
    const buttons = groupEl.querySelectorAll(".preference-btn");
    buttons.forEach(btn => {
        if (btn.getAttribute("data-value") === value) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// Load and populate settings values in UI
function loadSettings() {
    const settings = getSettings();
    
    const usernameInput = document.getElementById("settingsUsername");
    const currencySelect = document.getElementById("settingsCurrency");
    const greetingHeader = document.getElementById("greetingHeader");
    
    if (usernameInput) usernameInput.value = settings.username || "Explorer";
    if (currencySelect) currencySelect.value = settings.currency || "₹";
    
    if (settings.pace) setSelectPreference("Pace", settings.pace);
    if (settings.budget) setSelectPreference("Budget", settings.budget);
    
    if (greetingHeader) {
        greetingHeader.textContent = `Hey ${settings.username || "Explorer"}! 👋`;
    }
}

// Save preferences to localStorage
function saveSettings() {
    const usernameInput = document.getElementById("settingsUsername");
    const currencySelect = document.getElementById("settingsCurrency");
    
    if (!usernameInput || !currencySelect) return;
    
    const paceBtn = document.querySelector("#settingsPaceGroup .preference-btn.active");
    const budgetBtn = document.querySelector("#settingsBudgetGroup .preference-btn.active");
    
    const paceVal = paceBtn ? paceBtn.getAttribute("data-value") : "moderate";
    const budgetVal = budgetBtn ? budgetBtn.getAttribute("data-value") : "moderate";
    
    const settings = {
        username: usernameInput.value.trim() || "Explorer",
        currency: currencySelect.value,
        pace: paceVal,
        budget: budgetVal
    };
    
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        loadSettings(); // Reload header and details
        showToast("⚙️ Settings saved successfully!");
    } catch (e) {
        console.error("Failed to save settings:", e);
        showToast("❌ Failed to save settings.");
    }
}

// Display floating toast alerts
function showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast-alert";
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Clear search chat conversation log
function clearChatHistory() {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;
    
    chatBox.innerHTML = `
        <div class="message-wrapper bot-wrapper">
            <img src="assets/bot_avatar.png" alt="Bot Avatar" class="message-avatar">
            <div class="bot-message">
                👋 Hi! I'm Travel Buddy. I can plan your trips, detail daily budgets, find great photography spots, recommend local food, and provide smart travel tips.<br><br>
                Tell me where you want to go next! (e.g. <em>"Plan a 3-day trip to Munnar"</em> or <em>"I want a weekend beach getaway"</em>)
            </div>
        </div>
    `;
    
    showToast("💬 Chat history cleared!");
}

// Reset all browser local storage data
function wipeAllStorage() {
    const confirmWipe = confirm(
        "Are you sure you want to reset all application storage? This will clear all saved trips, favorites, and settings, and cannot be undone."
    );
    
    if (confirmWipe) {
        try {
            localStorage.clear();
            showToast("🗑️ All data reset! Reloading...");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            console.error("Wipe failed:", e);
        }
    }
}

// Initialise settings on runtime load
loadSettings();
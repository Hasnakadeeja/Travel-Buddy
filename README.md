# Travel Buddy Premium ✈️🗺️

**Travel Buddy** is a responsive, feature-rich single-page AI Travel Companion application. It helps users generate structured itineraries, manage budgets, curate inspiration, and bookmark favorites.

🔗 **Live Link**: [https://travel-buddy-ryp0.onrender.com](https://travel-buddy-ryp0.onrender.com)

---

## 🌟 Key Features

1. **AI Travel Planner Chatbot**: Custom itinerary plans, budget breakdowns, sightseeing spots, and tips powered by the Gemini 2.5 Flash model.
2. **Offline-First Persistence**: Saves itineraries, favorites, and settings locally using browser `localStorage`.
3. **Interactive Budget Planner**: Computes total budgets, travel durations, and daily averages. Includes CSS-animated progress bars representing the percentage allocation of expenses.
4. **Travel Inspiration Grid**: Staggered cover cards with filter tag category toggles and one-click chatbot planning shortcuts.
5. **Explorer Settings Dashboard**: Customizable profile names (syncs greeting banners), default currency/pace/budget presets that enrich AI prompt queries, and data maintenance storage cleanses.

---

## 🛠️ Technology Stack

*   **Frontend**: Vanilla HTML5, CSS3 (Flexbox, Grid, Custom Variables), JavaScript (ES6+, DOM Manipulation).
*   **Backend**: Node.js, Express, CORS.
*   **AI Integration**: `@google/genai` querying `gemini-2.5-flash`.
*   **Hosting**: Render.com (Web Services).

---

## 🚀 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Hasnakadeeja/travel-buddy.git
   cd travel-buddy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Add Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

# Travel Buddy Premium ✈️🗺️

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Platform](https://img.shields.io/badge/platform-web-blue.svg)]()
[![License](https://img.shields.io/badge/license-ISC-green.svg)]()

> Transform your travel dreams into fully-tailored itineraries in seconds. **Travel Buddy Premium** is an ultra-responsive, feature-rich single-page application powered by Gemini 2.5 Flash that organizes your itineraries, streamlines budget tracking, curates inspiration, and manages settings—all with offline-first persistence.

🔗 **Explore Live**: [travel-buddy-ryp0.onrender.com](https://travel-buddy-ryp0.onrender.com)

---

## 🌟 Key Features

*   **🤖 AI Travel Planner Chatbot**
    *   Get personalized, structured itineraries, daily activities, sightseeing recommendations, and safety tips.
    *   Powered by `gemini-2.5-flash` for rapid, contextual responses.
*   **📊 Interactive Budget Planner**
    *   Input budgets, calculate daily averages, and track expenses across categories.
    *   Dynamic CSS-animated progress indicators visually map out expense allocation percentages.
*   **📍 Travel Inspiration Grid**
    *   Curated cards with tag-based filtering (e.g., Adventure, Beaches, Cultural).
    *   One-click chatbot planning shortcuts to instantly prompt the AI about a specific destination.
*   **⚙️ Explorer Settings Dashboard**
    *   Personalize profile greeting names.
    *   Preset default preferences (currency, travel pace, budget levels) to automatically enrich AI prompt queries.
    *   Data maintenance tools to inspect or purge browser `localStorage`.
*   **💾 Offline-First Persistence**
    *   All customized configurations, generated itineraries, bookmarks, and budgets are saved locally.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, ES6+ JS | Responsive Single Page App (SPA) design, Flexbox & Grid layouts, and custom theme variables. |
| **Backend** | Node.js, Express.js | API route handling, CORS management, and static file serving. |
| **AI Engine** | `@google/genai` | Powering the contextual, chat-based trip generation using `gemini-2.5-flash`. |
| **Hosting** | Render | Automated web service deployments. |

---

## 📁 Repository Structure

```text
├── assets/             # Images, icons, and visual assets
├── index.html          # Core single-page interface layout
├── style.css           # Styling system (layouts, animations, themes)
├── script.js           # Client-side logic, AI prompt building, and state management
├── server.js           # Node/Express backend configuration
├── package.json        # Project manifest and dependencies
└── .env.example        # Reference environment configuration
```

---

## 🚀 Local Installation & Setup

Get your local copy of Travel Buddy Premium up and running by following these steps:

### 1. Clone the repository
```bash
git clone https://github.com/Hasnakadeeja/travel-buddy.git
cd travel-buddy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. Start the Application
```bash
npm start
```
Once started, navigate to `http://localhost:3000` in your web browser.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the ISC License. See `package.json` for details.

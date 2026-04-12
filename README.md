# 🛠️ Steam Patch Analyzer Web

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Steam Patch Analyzer** is a specialized AI-powered web utility designed for gamers. It distills complex, thousands-of-words-long patch notes into actionable intelligence in seconds. By leveraging the **Gemini**, it categorizes technical updates into Buffs, Nerfs, and Optimal Strategies to keep you ahead of the meta.

For the Python version, see [Steam Patch Analyzer](https://github.com/VittorioCodes/Steam-Patch-Analyzer)

---

## ✨ Key Features

-   **🤖 Intelligent Meta-Analysis:** Automatically identifies and categorizes technical changes from raw Steam news feeds.
-   **🎯 Strict Content Filtering:** Advanced logic filters out marketing fluff, sales announcements, and third-party news to focus solely on technical deployment data.
-   **📊 Quad-Column Dashboard:**
    -   🟢 **Buffs:** Direct improvements to characters, items, or mechanics.
    -   🔴 **Nerfs:** Reductions in power or utility.
    -   🟡 **Other:** General balance adjustments and quality-of-life changes.
    -   ⚪ **Misc:** Bug fixes, server maintenance, and technical optimizations.
-   **💬 Strategy Consultant (Chat):** A dedicated "Follow-up" window to discuss specific builds or cumulative changes with the AI in plain text.
-   **⚡ High-Speed Engine:** Multi-model fallback system (Gemini 2.5) ensures high availability and speed.

## 🕹️ Live Demo

This project is hosted with Github Pages for live usage without any installation. [See here](https://vittoriocodes.github.io/Steam-Patch-Analyzer-Web).

## 🚀 Getting Started

### Prerequisites
-   A **Google AI Studio API Key** (Get yours [here](https://aistudio.google.com/app/apikey)).
-   Node.js (v18 or higher) & npm/yarn.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vittoriocodes/Steam-Patch-Analyzer-Web.git
    cd Steam-Patch-Analyzer-Web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Launch the development server:**
    ```bash
    npm run dev
    ```

## 🛠️ Technology Stack

-   **Core Framework:** [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
-   **AI Integration:** [@google/generative-ai SDK](https://www.npmjs.com/package/@google/generative-ai)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Custom Dark Theme)
-   **Data Retrieval:** Axios with a secure Worker Proxy for Steam API requests. (It wasn't available free otherwise without the hassle of the end-user so I implemented my Cloudflare Worker into it but you're welcome to use it as it's free)

## 📄 Legal Disclaimer

This application is **not** affiliated with, maintained, authorized, endorsed, or sponsored by **Valve Corporation** or **Steam**. All game titles, images, and data retrieved via the Steam Web API are trademarks and property of their respective owners. AI-generated summaries may contain inaccuracies; please consult official developer notes for final verification.

## 🤝 Contributing

Feel free to fork it for usage with other AI/LLMs.

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---
*Built with ❤️ for the gaming community by a gamer. I needed something like this because I didn't want to read Dead by Daylight's all patch notes so I made myself something, then decided to host it for others too.*

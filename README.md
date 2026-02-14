# DroneCalc — Advanced Drone Performance Calculator

A comprehensive web-based tool for designing, simulating, and validating multirotor drone configurations. Built with React and Vite, DroneCalc helps hobbyists and engineers optimize their builds by calculating flight time, thrust-to-weight ratio, efficiency, and more.

![DroneCalc Interface](./public/screenshot.png) *(Note: Add a screenshot to public folder if available)*

## 🚀 Features

### Core Functionality
-   **Multi-Section Configuration**: Detailed inputs for Environment, Frame, Battery, ESC, Motors, and Propellers.
-   **Real-time Calculations**: Instant feedback on Hover Time, Max Thrust, TWR, Efficiency, and Electrical Load.
-   **Unit Conversion**: Toggle between Metric and Imperial units (m/ft, g/kg/lbs, °C/°F) seamlessly.
-   **Presets System**: Save and load custom configurations for Environment and Frames (e.g., "5" Freestyle", "Cinewhoop", "High Altitude").

### Advanced Analytics
-   **System Validation**: Automatic checks for common issues (e.g., motor over-current, battery sag, insufficient TWR).
```markdown
-   **Interactive UI**: Glassmorphic result cards with real-time, color-coded validation status.
```
-   **PDF Export**: Generate detailed reports of your drone configuration.
-   **Shareable Configs**: Save and load full configurations to/from local storage or files.

### Customization
-   **Settings Panel**: Configure application defaults, theme preferences, and branding (Disclaimer, Footer text).
-   **Responsive Design**: optimized for desktop and tablet usage.

## 🛠️ Tech Stack

-   **Frontend**: React 18, Vite
-   **Styling**: Vanilla CSS with CSS Variables (Theming support)
-   **Icons**: Lucide React
-   **Utils**: jsPDF (Report generation), LocalStorage (Persistence)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/imskjai-sudo/ck-dronecalc.git
    cd ck-dronecalc
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run development server**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

4.  **Build for production**
    ```bash
    npm run build
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
© Copyright Cavin Infotech 2026

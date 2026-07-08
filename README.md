# Portal Tic-Tac-Toe Portal

A premium, startup-grade dashboard portal game featuring multiple board sizes, local PvP, advanced AI configurations, canvas analytics charts, achievements matrix, leaderboard rankings, customizable themes, and offline PWA functionality.

Built with **pure HTML5, CSS3, and modern ES6 JavaScript** - no frameworks, no external charting libraries, no CSS utilities, and no compilers.

---

## Project Structure

```text
/ (Project Root)
├── index.html        - Main HTML template containing landing, navigation, tabs, and reward modals
├── manifest.json     - PWA installation metadata configurations
├── sw.js             - PWA service worker caching shells for offline support
├── css/
│   ├── style.css      - Main styles, custom variable maps, layout splits, and widgets
│   ├── animations.css - Custom click ripples, floats, spin wheel animations, and toast slides
│   └── responsive.css - Grid resizes and mobile flex orders
├── js/
│   ├── app.js         - View router, dynamic canvas charts, PWA triggers, and file exports
│   ├── ai.js          - AI engines (Easy, Medium, Hard, and impossible Minimax with Alpha-Beta Pruning)
│   ├── game.js        - Engine board state, timer loop, undo/redo logs, and prediction formula
│   ├── storage.js     - LocalStorage wrapper handling user profiles, stats, and achievements
│   ├── animations.js  - Canvas particle networks, isometric grids, and lucky wheels
│   └── theme.js       - Themes controller applying class maps for 7 unique themes
└── README.md         - Setup and technical documentation
```

---

## Features

1. **Intelligent AI**:
   - Includes **Easy** (random), **Medium** (single depth block/win check), **Hard** (shallow depth search), and **Impossible** (Minimax search with Alpha-Beta Pruning).
   - Dynamic search depth boundaries depending on grid size to prevent thread blocking (9 plies on 3x3, 5 plies on 4x4, 3 plies on 5x5).
2. **Custom Canvas Analytics Charts**:
   - Drawn entirely using raw Canvas 2D contexts (no Chart.js).
   - Includes a Pie Chart (Wins/Losses/Ties), a Bar Chart (Wins per difficulty), and a Line Graph (Match duration history timelines).
3. **PWA Offline Support**:
   - The registered service worker caches all static stylesheets, script configurations, and dynamic assets (like Google Fonts or profile images) to ensure game access without connection.
4. **Achievements & Badges**:
   - Pushes dynamic toast unlock popups containing SVG achievements details onto the screen which slide out automatically after 4.5 seconds.
5. **Interactive Reward Wheels**:
   - Canvas-drawn lucky wheel rotates using cubic ease-out calculations. Users can spin it to earn random profile avatar seeds.
6. **Themes Engine**:
   - Swaps visual layers immediately between **Dark**, **Light**, **Cyberpunk**, **Ocean**, **Forest**, **Sunset**, and **Minimal** modes.
7. **Accessibility (A11y)**:
   - Includes full keyboard focus grids, Tab indexes, and visual contrast supports.
8. **Export Utilities**:
   - Triggers native print sheets to save statistical PDF summaries.
   - Captures grid matrices on secondary Canvas layouts to download high-resolution game screenshots directly.

---

## Local Setup

Since this is a client-side vanilla application, you do not need node packages or servers to run basic features, but running on a local server is required to test PWA Service Worker caching:

### Method 1: Using Python (Recommended)
1. Open terminal inside the workspace folder.
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Visit [http://localhost:8000](http://localhost:8000) in your browser.

### Method 2: Using Node (Http-Server)
1. Install and run:
   ```bash
   npx http-server -p 8000
   ```
2. Visit [http://localhost:8000](http://localhost:8000) in your browser.

---

## Keyboard Shortcuts & Navigation

- `Tab` / `Shift + Tab` - Cycle focus through menus, cell elements, and settings buttons.
- `Space` / `Enter` - Select buttons or mark focused cell spots.
- `Escape` - Close active modals (profile editor, lucky rewards).
- `U` - Undo last game move.
- `R` - Redo last undone move.

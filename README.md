# Project Structure

This project is a FastAPI-powered portfolio website for a Python / ML / product engineering portfolio.

## Overview

- The backend is a lightweight FastAPI app in `main.py`.
- The frontend is a static website under `static/`.
- The app serves the portfolio landing page and exposes a few JSON APIs for project data and contact form submissions.

## Root files

- `main.py` — application entry point and API configuration
- `requirements.txt` — Python dependencies
- `static/` — frontend assets (HTML, CSS, JS, images)

## Backend structure

### `main.py`
The backend does the following:

- Creates a FastAPI app with the title `Mirajul Portfolio`
- Defines a `PROJECTS` array for portfolio project cards
- Exposes:
  - `GET /api/health` — health check endpoint
  - `GET /api/projects` — returns project metadata as JSON
  - `POST /api/contact` — validates a contact form payload and writes it to `messages.jsonl`
- Mounts the static frontend at `/` via `StaticFiles`

### Data flow

- The frontend calls `/api/projects` to render project cards dynamically.
- The contact form posts to `/api/contact`.
- The cursor-following robot loads the root `robot.glb` through `/robot.glb`.
- Contact submissions are rate-limited by IP and stored in a JSON Lines file named `messages.jsonl`.

## Frontend structure

### `static/index.html`
This is the main page structure for the portfolio:

- sticky header and navigation
- hero section with animated terminal text and a cursor-following Three.js robot
- developer profile section
- process and stack sections
- projects gallery section
- contact form section
- command palette / jump navigation

### `static/css/style.css`
Contains the complete visual design system:

- light/dark theme variables
- layout and spacing rules
- typography and card styling
- responsive design
- animations and hover effects

### `static/js/script.js`
Handles interactive behavior:

- theme toggle
- animated hero text
- terminal typing effect
- scroll tracking and nav highlighting
- section reveal animation using `IntersectionObserver`
- rendering project cards from `/api/projects`
- interactive card tilt effect
- contact form submission logic
- glow cursor effect

### `static/img/`
Image assets for the portfolio, such as the profile image.

## Project architecture summary

The app follows a simple practice:

- Python backend serves structured data
- Frontend reads JSON from the API
- Static assets deliver the UI
- Portfolio content is configurable from the backend, not hardcoded in the frontend

## Practical notes

- The project is organized for a simple portfolio or small app deployment.
- The backend is intentionally minimal and easy to extend.
- A future enhancement could include:
  - real project data storage
  - database-backed contact logs
  - richer CMS-like project management
  - deployment configuration for production

## Suggested next steps

- Add a real `messages.jsonl` file or switch to a database for contact entries.
- Replace placeholder project entries in `main.py` with real portfolio items.
- Add an actual profile image in `static/img/me.jpg`.
- Update the social links and email in `static/index.html`.

## Folder tree

```text
portfolio/
├── main.py
├── requirements.txt
├── PROJECT_STRUCTURE.md
├── static/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── img/
│   └── js/
│       └── script.js
└── messages.jsonl   (created at runtime when contact form is used)
```

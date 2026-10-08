# Neon Clash

Neon Clash is a browser-based canvas fighting game. Its production build is a self-contained static `dist/index.html`; players do not need Node.js, a development server, or a localhost port to play a deployed build.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. The workflow in `.github/workflows/deploy.yml` builds the game and publishes it after each push to `main`. It can also be started manually from the repository's **Actions** tab.

## Deploy to Vercel

Import the repository into Vercel. The included `vercel.json` configures the Vite build command and `dist` output directory; deployments rebuild automatically on pushes.

## Pilot profiles and saved progress

The Neon Clash sign-in/register screen appears before the lobby. Pilot callsigns and high scores are stored in the current browser's local storage. They are not online accounts, are not password protected, and do not sync to another browser or device. Clearing browser data removes them. Real cross-device accounts require a separately configured authentication backend.

## Controls

- Move: `A` / `D` or arrow keys
- Jump: `W` / `Space`
- Attack: `J` / `Z`
- Special: `K` / `X` when the energy meter is full
- Dash: `L` / `C` / `Shift`
- Guard: `S` / Down arrow
- Pause: `P` / `Escape`

Touch devices have on-screen controls. Music and effects are generated in-browser and begin after the first user interaction, as required by browser autoplay rules.

The original arcade-style soundtrack, interface clicks, and character-tuned fight sounds are synthesized in-browser; no external game music or sound files are required.

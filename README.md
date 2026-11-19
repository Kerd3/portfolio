# Ezekeil Third Cruz | AI Applications, Backend and Automation Portfolio

A responsive static portfolio built with HTML, CSS, and vanilla JavaScript. No build step, framework, or API key is needed.

## Design

- **Poster typography.** Anton for display type, Work Sans for text. Headlines stay within two lines at every width.
- **Colour by chapter.** Each section is a full field of white, light grey, black or blue. The header takes the colour of the section beneath it and steps aside while you scroll down.
- **A hero you can use.** The headline "Tested, not demoed." is split across a white and a black field. In the black field, visitors can run one of three real pipelines from the projects (the support-ticket workflow, the OpsDesk notification outbox, an EvalForge evaluation job) and watch each step hand off, over an animated node graph that reacts to the pointer.
- **Real pictures only.** Every image is a screenshot or capture of the projects themselves. The VEKTA clip is the project's own 115-frame sequence encoded as a muted loop.
- **Motion.** Masked headline reveal, staggered section entrances, frames that open from a mask, table rows and figures that count up, a poster list that wipes in. Everything switches to a still page under `prefers-reduced-motion`, and content stays visible without JavaScript.
- **Accessible basics.** Skip link, visible focus, 44 px touch targets, labelled controls, keyboard-operable screenshot viewer, and no horizontal scroll at 390 px.
- **Checked.** The homepage and case-study pages pass the taste-skill browser inspector (headline lengths, type sizes, contrast, overflow, covered text) at 1440, 768 and 390 px.

## Projects

### AI and automation
1. **OpsDesk AI** (new): IT support portal with grounded Gemini answers, role-based security, an append-only audit log, and n8n notifications. React 19, Express 5, PostgreSQL 17.
2. **EvalForge AI Reliability Platform**: queued evaluation runs, model adapters, graders, traces, and run comparison. Node.js, Express, PostgreSQL, Redis, BullMQ.
3. **AI Customer Support Ticket Automation**: Gmail intake, duplicate protection, AI triage, Slack alerts, human approval, and a PostgreSQL audit trail.
4. **AI Shop Support Agent**: n8n chat agent with stock, order, and policy tools and confirmation-gated ordering.
5. **AI Receptionist**: n8n AI Agent connected to explicit business tools.
6. **Order Processing and Fulfillment**: webhook intake, validation, API enrichment, MongoDB, and scheduled reporting.

### Full-stack apps
7. **DesignHub Studio** (new): studio website and project workspace on a token-based design system, with 84 Playwright and 20 API tests.
8. **The Box Ward: Puzzle and Strategy Lab**: Next.js puzzle with cycle analysis and Monte Carlo simulation.
9. **Authenticated Todo Manager**: Express 5, MongoDB, bcrypt, and sessions.

### Interactive and 3D
10. **AURA One Showcase** (new): scroll-driven three.js product page with headphones modelled entirely in code.
11. **Interactive Landscape Journey** (new): procedural three.js valley that moves from dawn to night as you scroll.
12. **VEKTA Nightfall 16** (new): laptop launch page that scrubs video frames on a canvas with GSAP ScrollTrigger.
13. **NexusAI Landing Page**: frontend concept for a fictional AI product with a pricing calculator.

### Quality engineering
14. **QA Testing Portfolio**: manual test artifacts, Reqres API checks, and Playwright UI tests.

## Run locally

Open `index.html` directly, use VS Code Live Server, or run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Structure

```text
ezekeil-portfolio/
├── index.html
├── css/style.css          tokens, chapters, homepage and case-study styles
├── js/main.js             chapter header, pipeline runner, graph canvas, reveals, viewer
├── projects/              one case-study page per project (14)
└── assets/screenshots/
    ├── opsdesk-ai/        from the OpsDesk AI repository
    ├── evalforge/         from the EvalForge repository
    ├── designhub/         from the DesignHub repository
    ├── landscape-journey/ from the Interactive Landscape Journey repository
    ├── aura-showcase/     captured from a local run
    ├── vekta-nightfall/   captured from a local run, plus a loop of its frames
    └── ...                earlier workflow evidence and diagrams
```

## Accuracy notes

- Numbers on the homepage come from the project READMEs: 125 API and 28 end-to-end tests in OpsDesk AI, 84 Playwright and 20 API tests in DesignHub (257 in total), and 0 axe violations reported by both apps' accessibility scans.
- OpsDesk AI and DesignHub use fictional demo data. DesignHub's workspace sign-in is a client-side demo gate, not real authentication.
- AURA One, Northwind Retreat, and VEKTA Nightfall 16 are fictional brands made for design showcases. VEKTA's specifications and benchmark figures are demo copy.
- EvalForge is a portfolio MVP, not a hardened multi-tenant service.
- The QA portfolio does not claim pass rates or CI results.
- SVG illustrations are simplified diagrams, not product screenshots.

## Deploy to Vercel

The site is plain static files, so Vercel serves it as is: no framework preset, no build command, no output directory.

**Option A: from GitHub (recommended, redeploys on every push)**

1. Create a new GitHub repository and push this folder to it.
2. In Vercel, choose **Add New > Project**, import the repository, and leave Framework Preset as **Other** with the build settings empty.
3. Deploy. Vercel gives you a `*.vercel.app` address, and you can add your own domain under **Settings > Domains**.

**Option B: from the command line**

```bash
npx vercel
```

Then, when the preview looks right:

```bash
npx vercel --prod
```

### What is configured

- `vercel.json` sets security headers (a strict Content-Security-Policy, HSTS, no framing, no sniffing) and caching: one week for `assets/`, one hour for `css/` and `js/`.
- The Content-Security-Policy allows exactly one inline script by its hash (`document.documentElement.classList.add('js')`). If you change that line in any page, update the hash in `vercel.json`, or the scroll animations will not switch on.
- `404.html` is served for any missing address.
- `favicon.svg`, `robots.txt`, and an Open Graph share image (`assets/social-preview.jpg`) are included. Once you know the final address, change each page's `og:image` to the full URL (for example `https://your-domain/assets/social-preview.jpg`), because some sites (LinkedIn, Facebook) only read absolute image URLs.
- `.vercelignore` keeps local tooling (`.claude`, `.taste-skill`) and this README out of the deployment.

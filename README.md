# Pocket Trainer

Pocket Trainer is a role-based corporate training demo. It turns the idea of a document-to-training experience into a clickable, local-first hackathon prototype: leaders create bite-sized lessons, juniors complete them, and managers can follow progress.

## Stack

- React 19 + Vite for the interactive single-page application.
- Custom CSS for the responsive glassmorphism visual system.
- Three.js for the hero orbital scene on the landing page (lazy-loaded).
- Recharts for the Department Head's student skill comparison.
- `lucide-react` for UI icons.
- `jspdf` + `jspdf-autotable` for client-side PDF/CSV report export.
- Browser `localStorage` for demo persistence.

The PRD recommends React and Tailwind. React is used; custom CSS was retained because this project already had a complete bespoke visual system, and it lets the interface stay consistent without a large styling migration.

## Run locally

```bash
npm install
npm run dev
```

Use any `@company.com` email in the sign-in form, then select a demo role:

- Junior — complete lessons, quizzes, and view personal progress.
- Senior — view the team dashboard, search juniors, create training, archive/delete training.
- Dept Head — all management actions plus student development charts and progress reports.

## Product flows

1. Landing → optional Product thinking brief → company-email gate → role-based workspace.
2. Junior: training library → lesson → knowledge check → completion/progress update.
3. Senior/Dept Head: dashboard → new training → set audience/difficulty → upload source → simulated generation → publish.
4. Senior/Dept Head: archive or delete active training; changes persist immediately.
5. Dept Head: compare student progress and skills, then generate an on-screen report and matching CSV download.

## Proposed revenue model

The product brief proposes a $1 per user per month subscription for platform access. This is a pricing concept only; the demo does not collect payments or implement subscriptions.

## Structure

```text
src/
  App.jsx               Application screens, mock data, routing, state, and interactions
  SolarSystemScene.jsx  Three.js orbital hero scene, lazy-loaded on the landing page
  App.css               Responsive glassmorphism product UI
  index.css             Global reset and font setup
  assets/               Static images used by the UI
```

## Data model

```text
USER
  id, name, email, role (Junior | Senior | Dept Head)

TRAINING
  id, title, difficulty (1–10), audience, status
  source, completion, createdBy, optional lesson

LECTURE
  title, summary, points[], questions[]

QUIZ_QUESTION
  prompt, options[], correct (zero-based option index)

TRAINING_PROGRESS
  training id → percent complete
```

## Known limitations / mocked components

### Simulated AI generation

The document upload flow is deliberately a Wizard-of-Oz stub. It does **not** read, upload, or use file contents. After a short scripted sequence—“Analyzing document”, “Extracting key concepts”, “Generating bite-sized lecture”—it returns one of two fixed lesson and quiz payloads at random. This keeps the demo transparent while proving the intended product interaction.

### Authentication

Authentication is a UI-only gate. It accepts only addresses ending in `@company.com`, and the role picker controls the demo route. There is no password, SSO, server, or real identity verification.

### Persistence

Trainings and junior progress are stored in this browser using `localStorage` (`pt-trainings` and `pt-progress`). They survive refreshes on this device only and are neither encrypted nor shared between users.

### Student report

The report uses locally saved training completion for Aisha and sample skill evaluations, capabilities, and issues for the demo learners. Generate report downloads both a CSV and a PDF in the browser; no data is transmitted to a server.

## Path to production

Replace the local AI stub with a secured API that extracts document content and returns validated lesson JSON. Add SSO (such as Google Workspace or Azure AD), a database with server-enforced role permissions, encrypted storage, audit trails, genuine GDPR workflows, and a proper reporting/data-export service.

## License

MIT — see [LICENSE](LICENSE).

The source code is released under the MIT License. The sample names, email addresses, and training content used in the demo are fictional.

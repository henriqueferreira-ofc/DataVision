

## Datavision Pro — MVP Plan

### 1. Landing Page
- Hero section with tagline and CTA ("Comece Agora" / "Get Started")
- Features section highlighting AI analysis, dashboards, and report generation
- Pricing section with 3 tiers: Basic, Pro, Enterprise (connected to Stripe)
- Footer with links
- Dark/light modern design inspired by Stripe/Notion
- Language switcher (PT-BR / EN) using i18n context

### 2. Internationalization (i18n)
- Language context provider with PT-BR and EN translations
- Language switcher component in navbar
- All UI strings externalized into translation files

### 3. Authentication
- Supabase Auth with email/password signup and login
- User profiles table for storing name, plan, and preferences
- Protected routes for dashboard and analysis pages
- Login/Signup pages with clean, modern design

### 4. Dashboard (Post-Login)
- Sidebar navigation (Notion-style)
- Home view with recent analyses and quick stats
- Upload area prominently displayed
- Analysis history list with status indicators

### 5. File Upload & Processing
- Supabase Storage bucket for user files
- Drag-and-drop upload zone accepting .xlsx, .csv, .pdf, .pptx
- File type detection and metadata extraction
- Upload progress indicator
- Files linked to user account with RLS

### 6. AI Analysis Engine
- Edge function calling Google Gemini API (user's own key stored as secret)
- File content extraction (parse CSV/Excel data, extract text from PDF/PPTX)
- Structured AI analysis generating:
  - **Diagnóstico**: Key findings, bottlenecks
  - **Insights**: Hidden opportunities, risks
  - **Plano de Ação**: Short/medium/long-term actions
  - **Recomendações**: Strategic executive recommendations
- Results stored in database per analysis

### 7. Analytics Dashboard View
- KPI cards (auto-detected from uploaded data)
- Charts (bar, line, pie) using Recharts
- Trend indicators (growth/decline arrows)
- Smart alerts for anomalies
- All visualizations auto-generated from AI analysis

### 8. Stripe Subscription
- 3 plans: Basic, Pro, Enterprise
- Stripe Checkout integration
- Customer portal for managing subscriptions
- Plan-based feature gating (e.g., number of analyses per month)

### 9. Design System
- Dark theme primary, light theme option
- Color palette: Deep navy (#0F172A), Electric blue (#3B82F6), Clean whites
- Professional typography with Inter font
- Responsive: mobile-first with adaptive sidebar
- Premium SaaS aesthetic throughout


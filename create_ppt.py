from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# Color scheme
NAVY = RGBColor(0x0A, 0x19, 0x2F)
GOLD = RGBColor(0xD4, 0xAF, 0x37)
CYAN = RGBColor(0x06, 0xB6, 0xD4)
WHITE = RGBColor(0xF1, 0xF5, 0xF9)
LIGHT_GRAY = RGBColor(0x94, 0xA3, 0xB8)
BG = RGBColor(0x0B, 0x0F, 0x19)

prs = Presentation()
prs.slide_width = Inches(13.33)
prs.slide_height = Inches(7.5)

def add_bg(slide, color=BG):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_text(slide, left, top, width, height, text, size=24, color=WHITE, bold=False):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = 'Arial'
    return tf

def add_title_bar(slide, title, subtitle=""):
    shape = slide.shapes.add_shape(1, Inches(0), Inches(0), prs.slide_width, Inches(1.5))
    shape.fill.solid()
    shape.fill.fore_color.rgb = NAVY
    shape.line.fill.background()
    add_text(slide, 0.5, 0.2, 12, 0.8, title, size=36, color=CYAN, bold=True)
    if subtitle:
        add_text(slide, 0.5, 0.8, 12, 0.5, subtitle, size=18, color=GOLD)

def add_card(slide, left, top, width, height, title, body, title_color=CYAN):
    shape = slide.shapes.add_shape(1, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(0x1A, 0x1F, 0x2E)
    shape.line.color.rgb = RGBColor(0x2A, 0x2F, 0x3D)
    shape.line.width = Pt(1)
    add_text(slide, left + 0.3, top + 0.2, width - 0.6, 0.4, title, size=20, color=title_color, bold=True)
    add_text(slide, left + 0.3, top + 0.6, width - 0.6, height - 0.8, body, size=14, color=WHITE)

def add_bullet_list(slide, left, top, width, height, items, size=16):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = item
        p.font.size = Pt(size)
        p.font.color.rgb = WHITE
        p.font.name = 'Arial'
        p.space_after = Pt(8)
    return tf

# Slide 1: Title
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, NAVY)
add_text(slide, 1, 2, 11, 1.5, "SAT-7 GATE", size=60, color=CYAN, bold=True)
add_text(slide, 1, 3.5, 11, 0.8, "Security Operations Center Dashboard", size=28, color=GOLD)
add_text(slide, 1, 4.5, 11, 0.5, "Built with React + TypeScript + Tailwind + Supabase", size=16, color=LIGHT_GRAY)
add_text(slide, 1, 5.5, 11, 0.5, "Deployed on Vercel | Secure Cloud Infrastructure", size=14, color=LIGHT_GRAY)

# Slide 2: Project Overview
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Project Overview", "SAT-7 GATE - Security Entrance Management System")
add_card(slide, 1, 2, 5.5, 3, "Goal", "SOC dashboard for managing access control, visitor entry, employee records, and real-time gate monitoring for SAT-7 complex in Lebanon.")
add_card(slide, 7, 2, 5.5, 3, "Company Profile", "Ali Safa - President & DG\n+242 06 822 22 20\nAvenue Docteur Cardorelle, Songolo, Congo\n\nDomain: sat7-gate.vercel.app")
add_text(slide, 1, 5.5, 11, 1.5, "Key Features", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 6, 11, 1, [
    "Enterprise security dashboard",
    "Real-time monitoring & analytics",
    "Role-based access control",
    "Cloud-native (Supabase + Vercel)"
], size=16)

# Slide 3: Technology Stack
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Technology Stack", "Modern web technologies for enterprise security")
add_text(slide, 1, 2, 5, 0.5, "Core Technologies", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 3, [
    "React - Component-based UI",
    "TypeScript - Type-safe JS",
    "Tailwind CSS v4 - Utility-first CSS",
    "Vite - Fast build tool",
], size=16)
add_text(slide, 7, 2, 5, 0.5, "Additional Libraries", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5, 3, [
    "Supabase - Auth, DB, RLS",
    "Recharts - Interactive charts",
    "Lucide Icons - Icon set",
    "Voice Input - Web Speech API",
], size=16)

# Slide 4: Architecture
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Architecture Overview", "Client-side UI + Server-side API + Supabase Backend")
add_text(slide, 1, 2, 11, 1.5, "System Architecture", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 11, 3, [
    "1. User Browser - Web interface",
    "2. Next.js / React App - SSR, client components",
    "3. API Routes (/api/*) - Server-side auth enforcement",
    "4. Supabase - Authentication, Postgres DB, RLS",
    "   - User authentication via Supabase Auth",
    "   - Row Level Security (RLS) for data protection",
], size=15)

# Slide 5: Dashboard Features
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Dashboard Features", "Security Operations Center - Key Metrics & Monitoring")
add_text(slide, 1, 2, 5, 0.5, "Key Metrics", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 2, [
    "24/7 Live Monitoring",
    "Access Control",
    "Real-time Stats",
    "Audit Trail",
], size=16)
add_text(slide, 7, 2, 5, 0.5, "Metrics Details", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5, 3, [
    "Total visitors this month",
    "Currently inside/outside",
    "Peak hours analysis",
    "Staff vs visitor breakdown",
    "Recent gate movements",
], size=16)

# Slide 6: New Entry
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "NEW ENTRY - Visitor Registration", "Quick and secure visitor registration with auto-fill")
add_text(slide, 1, 2, 5.5, 1.5, "Features", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 3, [
    "Employee auto-fill by name (debounced)",
    "Quick-select dropdown",
    "Create new employees on-the-fly",
    "Voice input for hands-free",
    "Company destination selection",
], size=15)
add_text(slide, 7, 2, 5, 0.5, "Auto-fill Logic", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5, 3, [
    "Search persons table (400ms debounce)",
    "Filter: person_category = 'employee'",
    "Auto-fill category & ID number",
    "On submit, use employee's ID",
    "If not found, create new employee",
], size=15)

# Slide 7: Role-Based Access Control
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Role-Based Access Control", "4 roles with different permissions")
add_text(slide, 1, 2, 5, 0.5, "Administrator", size=20, color=RGBColor(0x7C, 0x3A, 0xED), bold=True)
add_text(slide, 1, 2.5, 5, 3, "- Manage users & roles\n- Create/edit companies\n- Manage vehicles\n- Generate reports\n- Full system access", size=14, color=WHITE)
add_text(slide, 7, 2, 5, 0.5, "Security Officer", size=20, color=CYAN, bold=True)
add_text(slide, 7, 2.5, 5, 3, "- Register entries\n- View live gate & occupancy\n- Manage visitors\n- Audit trail access", size=14, color=WHITE)
add_text(slide, 1, 5.5, 5, 0.5, "Management", size=20, color=GOLD, bold=True)
add_text(slide, 1, 6, 5, 1, "- View reports & analytics\n- View dashboard metrics\n- Manage employees", size=14, color=WHITE)
add_text(slide, 7, 5.5, 5, 0.5, "Viewer", size=20, color=LIGHT_GRAY, bold=True)
add_text(slide, 7, 6, 5, 1, "- Read-only access\n- View dashboard\n- Live gate & occupancy", size=14, color=WHITE)

# Slide 8: Database Schema
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Database Schema", "Supabase Postgres tables with RLS policies")
add_text(slide, 1, 2, 11, 1.5, "Core Tables", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 11, 3, [
    "profiles - User profiles with roles",
    "persons - People (employees, visitors, contractors)",
    "companies - Destination companies",
    "visitors - Visitor records",
    "vehicles - Vehicle registrations",
    "gate_movements - Entry/exit records",
    "audit_logs - Action audit trail",
], size=16)
add_text(slide, 1, 5.5, 11, 0.5, "RLS Policies", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 6, 11, 1.5, [
    "Administrator: Full access to all tables",
    "Security Officer: Read/insert to visitors, gate_movements",
    "Management: Read access to dashboard data",
    "SECURITY DEFINER functions: is_admin(), is_security_officer()",
], size=14)

# Slide 9: Responsive Design
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Responsive Design", "Mobile-first, touch-friendly, cross-device compatible")
add_text(slide, 1, 2, 5, 0.5, "Mobile (iPhone, Android)", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 3, [
    "Slide-out sidebar drawer",
    "Hamburger menu toggle",
    "44px minimum touch targets",
    "Overflow-x-auto on tables",
    "Stacked card layout for mobile",
], size=16)
add_text(slide, 7, 2, 5, 0.5, "Desktop (2K/4K)", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5.5, 3, [
    "Fixed sidebar (w-64)",
    "Full data tables",
    "KPI grid (4 columns)",
    "Wide charts",
    "No horizontal scrolling",
], size=16)

# Slide 10: Security
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Security & Compliance", "No local dependencies, secure cloud architecture")
add_text(slide, 1, 2, 5, 0.5, "Security Features", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 3, [
    "Service role key never exposed client-side",
    "Server-side API routes with auth",
    "Row Level Security (RLS) policies",
    "HTTPS enforced (Vercel)",
    "Supabase authentication",
], size=16)
add_text(slide, 7, 2, 5, 0.5, "Zero Local Dependencies", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5.5, 3, [
    "No localhost or file:// references",
    "All backend on Supabase cloud",
    "All API calls to Vercel/CDN",
    "Environment variables on Vercel",
    "Production SSL/TLS certificates",
], size=16)

# Slide 11: Deployment
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Deployment & DevOps", "Built on Vercel with GitHub CI/CD")
add_text(slide, 1, 2, 5.5, 1.5, "Development", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 2, [
    "GitHub: github.com/lebanonsms-debug/sat7gate.git",
    "Vercel: sat7-gate.vercel.app",
    "Supabase: klazebnttcpszdjkulrq.supabase.co",
], size=14)
add_text(slide, 7, 2, 5.5, 1.5, "Environment Variables", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5.5, 2, [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
], size=14)
add_text(slide, 1, 5, 11, 0.5, "Verification Checklist", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 5.5, 11, 1.5, [
    "Build: npm run build -> exit 0",
    "TypeScript: tsc --noEmit -> 0 errors",
    "Lint: npm run lint -> exit 0",
    "No localhost dependencies",
    "API auth enforcement verified",
    "Mobile responsiveness verified",
], size=16)

# Slide 12: Key Achievements
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Key Achievements", "What was built and verified")
add_text(slide, 1, 2, 5, 0.5, "Completed Features", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 5.5, 4, [
    "SOC dashboard with KPIs, charts, live stats",
    "NEW ENTRY with auto-fill and voice input",
    "Live gate with timestamp quick-select buttons",
    "Live occupancy statistics",
    "Employee management (CRUD + audit logging)",
    "Company management (admin-only)",
    "User management with role-based access",
    "Vehicle management with full CRUD",
], size=14)
add_text(slide, 7, 2, 5, 0.5, "Verification", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 7, 2.5, 5.5, 3, [
    "Build: npm run build -> exit 0",
    "TypeScript: tsc --noEmit -> 0 errors",
    "Lint: npm run lint -> exit 0",
    "No localhost dependencies",
    "Production verified",
], size=14)

# Slide 13: Next Steps
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_title_bar(slide, "Next Steps", "Future enhancements and improvements")
add_text(slide, 1, 2, 11, 1.5, "Planned Enhancements", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 2.5, 11, 3, [
    "Push/live-update mechanism (Supabase channel)",
    "Bulk import/export (CSV, Excel)",
    "PWA support (installable app)",
    "API rate limiting",
    "Notifications (email, SMS)",
    "Two-factor authentication (2FA)",
    "Multi-language (FR + EN)",
], size=16)
add_text(slide, 1, 5.5, 11, 0.5, "Changes Made", size=20, color=CYAN, bold=True)
add_bullet_list(slide, 1, 6, 11, 1.5, [
    "QR visitor passes removed per user request",
    "Audit logs removed from sidebar navigation",
    "Default timezone: Asia/Beirut (Beirut, Lebanon)",
], size=14)

# Slide 14: Thank You
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, NAVY)
add_text(slide, 1, 2.5, 11, 1.5, "Thank You!", size=54, color=CYAN, bold=True)
add_text(slide, 1, 4, 11, 0.8, "SAT-7 GATE - Security Operations Center Dashboard", size=24, color=GOLD)
add_text(slide, 1, 5, 11, 0.8, "Built with React + TypeScript + Vite + Tailwind CSS", size=16, color=LIGHT_GRAY)
add_text(slide, 1, 5.5, 11, 0.8, "Powered by Supabase | Deployed on Vercel", size=16, color=LIGHT_GRAY)

# Save
prs.save('/c/Users/elielb/sat7-gate/SAT-7_GATE_Presentation.pptx')
print("Presentation saved: /c/Users/elielb/sat7-gate/SAT-7_GATE_Presentation.pptx")
print("Slides: " + str(len(prs.slides)))

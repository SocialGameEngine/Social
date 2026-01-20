# Documentation Structure

This directory contains all project documentation, organized by category for easier navigation.

## 📁 Directory Structure

### Core Business Documentation
- `01-product-vision.md` - Product vision and strategy
- `02-pricing-trials.md` - Pricing and trial information
- `03-team-structure.md` - Team organization and roles
- `04-tech-architecture.md` - Technical architecture overview
- `05-feature-roadmap.md` - Feature development roadmap
- `06-sales-playbook.md` - Sales and marketing strategies
- `07-metrics-definitions.md` - Key metrics and KPIs

### Specialized Documentation

#### `/business/` - Business & Product (4 files)
Business documentation and presentations:
- Executive summaries and investor materials
- Lean business model canvas
- Product pitch decks and slides

#### `/games/` - Game Systems (5 files)
Game-specific documentation and strategies:
- General game flow and mechanics
- Jukebox and SocialGameEngine systems
- Top comment game flow
- Vibox chart night strategy

#### `/jeopardy/` - Jeopardy Game Mode (4 files)
Jeopardy game mode implementation and progress:
- Implementation plans and completion status
- Development progress reports
- 6x7 grid implementation details

#### `/ai/` - AI Systems (2 files)
AI-related documentation and arguments:
- AI personality bots and music generation
- AI system design and implementation

#### `/security/` - Security & Access Control (1 file)
Security documentation:
- Row Level Security (RLS) implementation

#### `/design/` - Design Systems (1 file)
Design documentation:
- UI/UX styles and design guidelines

#### `/teams/` - Team Management (13 files)
Team-related features, implementation, and fixes:
- Team codes and grouping logic
- Team member management and display fixes
- Anonymous user support
- Team join flows and fixes
- Team implementation reports and status

#### `/database/` - Database & Security (5 files)
Database schema, RLS policies, and security fixes:
- Database schema guides and analysis
- Row Level Security (RLS) implementations
- Edge function fixes and migration instructions

#### `/vibox/` - Vibox Game System (12 files)
Vibox-specific documentation:
- API implementation and deployment guides
- Implementation summaries and quick starts
- Cleanup plans and completion status
- Voting database setup and functionality reports
- Deployment, logging, and code quality guides
- Voter incentive systems

#### `/implementation/` - Implementation Reports (10 files)
Feature implementations, fixes, and improvements:
- Bingo points system
- Join flow improvements and fixes
- Player name and team display fixes
- Dynamic loading implementations
- Content filtering and migration plans
- General implementation status reports

#### `/troubleshooting/` - Debugging & Setup (3 files)
Technical troubleshooting and setup guides:
- Vercel realtime debugging
- Windows-specific troubleshooting
- OpenAI API key setup instructions

#### `/auto-generated/` - Auto-Generated Documentation
Automatically generated documentation that may be outdated:
- Architecture reviews
- Migration reports
- Implementation summaries
- Backend documentation

## 📝 Contributing to Documentation

### File Organization Rules
- **Auto-generated docs** → `docs/auto-generated/`
- **Manual documentation** → Appropriate category subdirectory
- **New categories** → Create new subdirectories as needed

### Naming Conventions
- Use descriptive, lowercase filenames with hyphens
- Include implementation status in filenames when relevant (e.g., `*_complete.md`, `*_guide.md`)
- Group related files with consistent prefixes

## 🔍 Finding Documentation

Use the directory structure above to locate relevant documentation. For example:
- Looking for team features? Check `/teams/`
- Database issues? Check `/database/`
- Vibox problems? Check `/vibox/`
- Implementation status? Check `/implementation/`
- Technical issues? Check `/troubleshooting/`

## 🧹 Maintenance

- Review `/auto-generated/` regularly and remove outdated files
- Move important auto-generated content to main documentation directories when appropriate
- Keep the root directory clean of loose documentation files
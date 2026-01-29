# VIBox Documentation

## Overview

VIBox is the Social Game Engine's AI-powered jukebox system that allows patrons to collaboratively manage and play music during game sessions. This documentation has been consolidated into three comprehensive guides for easier navigation and maintenance.

## 📚 Documentation Structure

### [VIBOX_TECHNICAL_GUIDE.md](./VIBOX_TECHNICAL_GUIDE.md)
**Comprehensive technical documentation covering:**
- Architecture overview and system design
- Database schema and API implementation
- Real-time subscriptions and client library
- Deployment procedures and security considerations
- Performance optimization and troubleshooting

### [VIBOX_FEATURES_GUIDE.md](./VIBOX_FEATURES_GUIDE.md)
**Complete feature documentation including:**
- Core functionality and user experience flows
- Host and player capabilities
- Voting systems and voter incentives
- Analytics and insights
- Maintenance procedures and cleanup

### [VIBOX_OPERATIONS_GUIDE.md](./VIBOX_OPERATIONS_GUIDE.md)
**Operational procedures and standards:**
- Quick start deployment guide
- Logging, monitoring, and alerting
- Code quality standards and testing
- Daily/weekly/monthly checklists
- Incident response and troubleshooting

## 🚀 Quick Start

### 1. Deploy API
```bash
cd apps/vibox-api
pnpm deploy
```

### 2. Configure Environment
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Test API
```bash
curl https://your-vibox-api.vercel.app/api/health
curl https://your-vibox-api.vercel.app/api/queue
```

### 4. Use in App
```typescript
import { ViboxClient } from '@social/vibox-client';

const vibox = new ViboxClient({
  apiUrl: 'https://your-vibox-api.vercel.app',
  supabaseUrl: process.env.VITE_SUPABASE_URL!,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY!,
});

const { data } = await vibox.getQueue();
```

## 🎯 Key Features

- **Real-time Queue Management** - Live synchronization across all apps
- **AI Music Generation** - Integration with Suno API for custom tracks
- **Voting System** - Skip voting and vibe classification
- **Analytics Engine** - Comprehensive usage tracking and insights
- **Mobile-First Design** - Responsive PWA interface
- **Multi-Venue Support** - Scalable architecture for multiple locations

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   pubFeed       │    │   dashboard      │    │   other apps    │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ VIBox UI  │  │    │  │ VIBox UI  │  │    │  │ VIBox UI  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      vibox-api           │
                    │   (Vercel Serverless)    │
                    │                           │
                    │  ┌─────────────────────┐ │
                    │  │   Supabase DB       │ │
                    │  │  ┌───────────────┐  │ │
                    │  │  │ vibox_queue   │ │ │
                    │  │  └───────────────┘  │ │
                    │  └─────────────────────┘ │
                    └───────────────────────────┘
```

## 🔧 Tech Stack

- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL + Real-time)
- **Frontend**: React + TypeScript
- **Real-time**: Supabase WebSocket subscriptions
- **AI Integration**: Suno API for music generation
- **Analytics**: Custom tracking and reporting

## 📈 Business Model

- **Venue Pricing**: $299/month CAD (Pro plan, unlimited scans)
- **Patron Revenue**: $1.50–$2.00 per play
- **Revenue Split**: Venues keep 100% of patron revenue
- **Tips**: 40% to team, 60% to venues

## 🎮 Integration Points

### Top Comment Game
- QR code scanning for venue access
- Team-based music voting
- Real-time leaderboards

### VIBox Jukebox
- AI-powered music generation
- Collaborative queue management
- Skip voting and vibe classification

### Venue Dashboard
- Host controls and settings
- Analytics and reporting
- Revenue tracking

## 🔒 Security Features

- Row Level Security (RLS) policies
- CORS configuration
- Rate limiting
- Input validation
- Secure API authentication

## 📱 Mobile Experience

- Progressive Web App (PWA)
- Touch-optimized interface
- Offline capabilities
- Push notifications

## 🎯 Success Metrics

- **Engagement**: 40+ plays per night
- **Revenue**: ~$100 patron revenue per venue
- **Retention**: 14-day free trial with library lock-in
- **Growth**: Target 50+ venues in Victoria, BC

## 🆘 Support

### Documentation
- Technical issues: See [Technical Guide](./VIBOX_TECHNICAL_GUIDE.md)
- Feature questions: See [Features Guide](./VIBOX_FEATURES_GUIDE.md)
- Operations help: See [Operations Guide](./VIBOX_OPERATIONS_GUIDE.md)

### Common Issues
- **API not responding**: Check Vercel deployment status
- **Real-time updates not working**: Verify Supabase subscriptions
- **Queue stuck**: Review database connections and RLS policies

### Getting Help
1. Check the relevant documentation guide
2. Review troubleshooting sections
3. Check system status and logs
4. Contact development team

---

## 📝 Documentation History

**Consolidated from 12 documents to 3 comprehensive guides:**
- `VIBOX_API_IMPLEMENTATION_GUIDE.md` → Merged into Technical Guide
- `VIBOX_DEPLOYMENT_GUIDE.md` → Merged into Technical Guide
- `VIBOX_VOTING_DATABASE_SETUP.md` → Merged into Technical Guide
- `VIBOX_FUNCTIONALITY_REPORT.md` → Merged into Features Guide
- `VIBOX_VOTER_INCENTIVE_IMPLEMENTATION_GUIDE.md` → Merged into Features Guide
- `VIBOX_CLEANUP_PLAN.md` → Merged into Features Guide
- `VIBOX_QUICK_START.md` → Merged into Operations Guide
- `VIBOX_LOGGING_GUIDE.md` → Merged into Operations Guide
- `VIBoxJukebox_Code_Quality_Report.md` → Merged into Operations Guide
- `VIBOX_IMPLEMENTATION_SUMMARY.md` → Consolidated across all guides
- `VIBOX_CLEANUP_COMPLETE.md` → Consolidated across all guides
- `vibox-deployment-summary.md` → Consolidated across all guides

---

*This consolidated documentation provides comprehensive coverage of the VIBox system while maintaining easy navigation and reducing duplication.*

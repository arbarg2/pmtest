
# Rìan Intelligence Platform

A comprehensive blockchain investigation and wallet analysis platform built with React, TypeScript, and Supabase.

## Features

### Core Platform
- **Wallet Risk Analysis**: Comprehensive blockchain wallet investigation and risk scoring
- **Case Management**: Full case lifecycle management for investigations
- **Real-time Monitoring**: Watch wallets for changes and receive alerts
- **Advanced Analytics**: Transaction flow analysis and counterparty intelligence
- **Export & Reporting**: Generate detailed investigation reports

### AI-Powered Features ✨

#### Holly AI Summary (NEW)
- **Automated AI Analysis**: Generate intelligent summaries of wallet investigations using AI
- **Tines Integration**: Seamless webhook integration with Tines for AI processing
- **Version Control**: Track previous AI summaries with comparison capabilities
- **Real-time Updates**: Automatic polling for summary completion
- **One-Click Generation**: Simple button to trigger AI analysis from investigation results

**AI Summary Endpoint**: `https://edjkvebuxfxoylzgoddi.supabase.co/functions/v1/ai-summary`

The AI summary feature integrates with external AI services via Tines webhooks to provide intelligent analysis of wallet investigations. When a user clicks "Generate AI Summary" from an investigation, the system:

1. Sends investigation data to configured Tines webhook
2. Polls for AI processing completion
3. Updates the database with generated summary
4. Displays results with previous version tracking

### Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Edge Functions)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router
- **State Management**: React Query, Context API

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Database

The platform uses Supabase with Row Level Security (RLS) policies ensuring users can only access their own data. Key tables include:

- `investigation_records` - Wallet investigation data and AI summaries
- `audit_logs` - System audit trail
- `watched_wallets` - Monitored wallet addresses
- `case_audit_log` - Case-specific audit events

## Security

- Row Level Security (RLS) on all tables
- User authentication via Supabase Auth
- Secure API endpoints with CORS handling
- Audit logging for all critical operations

---

*AI Summary feature added December 2024 - Provides intelligent analysis of blockchain investigations through integrated AI workflows.*


# Rìan Intelligence - Blockchain Investigation Platform

## Recent Changes

### [2025-01-17 - Transaction Flow Navigation & Visualization]
- **Fixed TransactionFlowPreview navigation**: Properly wired up `onViewFlow` handlers to route to dedicated transaction flow pages
- **Added new route**: `/wallets/:recordId/flow` for detailed transaction flow analysis
- **Created WalletTransactionFlow page**: Full-page transaction flow visualization with proper data loading and error handling
- **Enhanced TransactionGraph component**: 
  - Added support for both real backend data and mock data fallback
  - Implemented resilient data handling for edge cases (single nodes, no counterparties)
  - Added interactive SVG-based graph visualization with risk-based color coding
  - Included network statistics, node details panel, and risk assessment summaries
  - Added "Mock Data" alerts to avoid confusion during demos
  - Implemented data export functionality
- **Updated App.tsx routing**: Added new transaction flow route to router configuration
- **Enhanced EnhancedWalletResults**: Updated to use proper navigation instead of callback-only approach

### Features Added:
- Interactive transaction graph with SVG-based visualization
- Real-time node selection and detail viewing  
- Risk-based color coding (red=high, yellow=medium, green=low risk)
- Network statistics dashboard
- Export functionality for graph data
- Graceful handling of missing/malformed data
- Mock data fallback for consistent demo experience
- Edge case handling for isolated wallets

### Technical Details:
- Uses React Router for navigation between analysis and flow views
- Implements TypeScript interfaces for graph data structures
- SVG-based rendering for better performance and customization
- Responsive design that works on desktop and mobile
- Proper error boundaries and loading states

---

A React-based blockchain investigation platform built with TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Routing**: React Router DOM
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Key Features

- Wallet risk analysis and scoring
- Transaction flow visualization
- Case management system
- Bulk wallet analysis
- AI-powered insights
- Real-time monitoring
- Export capabilities

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── services/           # API and business logic
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

[License information here]

## 🔄 Changelog - [2025-01-17]

- Fixed broken navigation from /dashboard > View Details to correct record route (`/record/:recordId`)
- Added drillable, toggleable chart panels to /all-records and /all-cases pages
- Charts show lookups and cases over time and by category (risk level, case status)
- RecordChartsPanel displays daily lookup trends and risk level distribution
- CaseChartsPanel shows case creation timeline and status breakdown
- All charts are responsive, toggleable (hide/show), and handle empty states gracefully


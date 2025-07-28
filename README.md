# Diet Dashboard

A dashboard application for tracking health metrics from iPhone Health app via Shortcuts integration.

## Architecture

This project is currently migrating from a legacy implementation to a clean architecture pattern using:

- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **Prisma ORM**: Type-safe database access with automatic migrations
- **Repository Pattern**: Abstract data access layer
- **Service Layer**: Business logic separation
- **Feature Flags**: Gradual rollout of new architecture

## Project Structure

```
src/
├── app/api/                    # API routes
├── components/                 # React components
├── lib/
│   ├── repositories/          # Data access layer
│   │   ├── interfaces/       # Repository contracts
│   │   └── implementations/  # Concrete implementations
│   ├── services/             # Business logic layer
│   ├── middleware/           # Cross-cutting concerns
│   ├── validators/           # Input validation
│   └── utils/               # Utilities
├── types/                    # Type definitions
└── ...
```

## Features

- **Health Data Tracking**: Weight, body fat, muscle mass, steps, calories
- **iPhone Integration**: Receive data via Shortcuts app
- **Real-time Dashboard**: Auto-refreshing charts and metrics
- **Secure API**: API key authentication
- **Type Safety**: Full TypeScript implementation

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL (via Supabase)
- iPhone with Shortcuts app (for data input)

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Security
API_SECRET_KEY=your_secret_api_key

# Database (Prisma)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Feature Flags
USE_CLEAN_ARCHITECTURE=false  # Set to true to enable new architecture
```

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

### Database

The application uses Supabase (PostgreSQL) with Prisma ORM for type-safe database access.

#### Schema

```sql
CREATE TABLE health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  steps INTEGER,
  active_calories INTEGER,
  resting_calories INTEGER,
  total_calories INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## iPhone Shortcuts Integration

### Setup iPhone Shortcut

1. Create a new Shortcut in the Shortcuts app
2. Add "Get Contents of URL" action:
   - URL: `https://your-app.vercel.app/api/health`
   - Method: POST
   - Headers:
     - `Content-Type: application/json`
     - `X-API-Key: your_api_secret_key`
   - Request Body: JSON with health data

### Example Request

```json
{
  "date": "2025-07-28",
  "weight": 70.5,
  "bodyFatPercentage": 15.2,
  "steps": 8500,
  "activeCalories": 450,
  "restingCalories": 1800
}
```

## API Endpoints

### GET /api/health
Fetch health data (public, no authentication required)

### POST /api/health  
Submit health data (requires X-API-Key header)

### OPTIONS /api/health
CORS preflight request handling

## Architecture Migration

The project is gradually migrating from legacy code to clean architecture:

### Current State: Feature Flag Pattern
- `USE_CLEAN_ARCHITECTURE=false`: Uses legacy Supabase client directly
- `USE_CLEAN_ARCHITECTURE=true`: Uses Prisma with clean architecture

### Clean Architecture Benefits
1. **SOLID Principles**: Single responsibility, dependency inversion
2. **Testability**: Easy to unit test with dependency injection
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Easy to add new features (e.g., PFC nutrition)

### Migration Steps
1. ✅ Implement Prisma and repository pattern
2. ✅ Create service layer with business logic
3. ✅ Add validation and middleware
4. ⏳ Enable feature flag in production
5. 🔄 Remove legacy code after testing

## Future Enhancements

- **PFC Nutrition Tracking**: Protein, fat, carbohydrate logging (ready to implement)
- **Advanced Analytics**: Trends, correlations, predictions
- **Data Export**: CSV, PDF reports
- **User Management**: Multi-user support
- **Mobile App**: Native iOS/Android apps

## Deployment

The application is deployed on Vercel with Supabase as the database.

### Production Deployment

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

2. Configure environment variables in Vercel dashboard

3. Update iPhone shortcut URL to production URL

## Contributing

1. Create feature branch from `develop`
2. Implement changes following clean architecture principles
3. Add tests for new functionality
4. Submit PR to `develop` branch

## Architecture Documentation

- [Clean Architecture Analysis](docs/code-analysis-solid-principles.md)
- [Prisma Migration Plan](docs/prisma-migration-plan.md)
- [Branch Strategy](docs/branch-strategy.md)
- [Database Migration Strategy](docs/database-migration-strategy.md)

## License

Private project - All rights reserved.
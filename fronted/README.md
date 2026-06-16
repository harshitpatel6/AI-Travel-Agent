# TravelAI - AI-Powered Travel Assistant

A modern, production-level React web application for AI-powered travel planning and booking. Features a beautiful, responsive design with complete integration to the Travel AI Assistant API.

## Features

- **AI Chat Assistant** - Interactive chat interface with AI travel assistant
- **User Authentication** - Complete registration, login, and OTP verification
- **Dashboard** - Comprehensive overview of bookings and account status
- **Booking Management** - View and manage hotel and flight bookings
- **Profile Management** - Update profile information and change password
- **Admin Panel** - Full admin dashboard with analytics and user management
- **Responsive Design** - Beautiful UI that works on all devices
- **Modern UI/UX** - Gradient designs, smooth animations, and intuitive navigation

## Tech Stack

- React 18
- React Router v6
- Axios for API calls
- Lucide React for icons
- CSS3 with custom properties
- Modern JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL:
```
REACT_APP_API_URL=http://localhost:8000
```

5. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.js
│   └── Navbar.css
├── pages/              # Page components
│   ├── Home.js
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   ├── Chat.js
│   ├── Bookings.js
│   ├── Profile.js
│   └── AdminDashboard.js
├── utils/              # Utility functions
│   └── api.js         # API integration
├── App.js             # Main app component
├── App.css            # Global styles
├── index.js           # Entry point
└── index.css          # Base styles
```

## API Integration

The app integrates with the following API endpoints:

### Authentication
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/send-otp` - Send OTP
- POST `/auth/verify-otp` - Verify OTP

### Chat
- POST `/chat` - Send chat message
- POST `/chat/stream` - Stream chat response
- GET `/sessions` - Get chat sessions
- GET `/sessions/:id/messages` - Get session messages

### Bookings
- GET `/bookings/hotels` - Get hotel bookings
- GET `/bookings/flights` - Get flight bookings

### Profile
- GET `/profile` - Get user profile
- PUT `/profile` - Update profile
- POST `/profile/change-password` - Change password

### Subscription
- GET `/subscription/status` - Get subscription status
- POST `/subscription/create` - Create subscription

### Admin
- GET `/admin/dashboard` - Get dashboard stats
- GET `/admin/users` - Get users list
- GET `/admin/analytics` - Get analytics data
- GET `/admin/activity-logs` - Get activity logs

## Features Overview

### Home Page
- Hero section with gradient background
- Feature showcase
- Statistics display
- Call-to-action sections
- Responsive design

### Authentication
- User registration with OTP verification
- Secure login
- Form validation
- Error handling

### Dashboard
- Quick stats overview
- Recent bookings display
- Quick action cards
- Subscription status

### AI Chat
- Real-time chat interface
- Message history
- Typing indicators
- Suggested prompts
- Session management

### Bookings
- Tabbed interface (All, Hotels, Flights)
- Detailed booking cards
- Status badges
- Responsive grid layout

### Profile
- Update personal information
- Change password
- Form validation
- Success/error notifications

### Admin Dashboard
- Platform statistics
- User management
- Subscription breakdown
- Recent users table
- Analytics overview

## Styling

The app uses a modern design system with:
- CSS custom properties for theming
- Gradient backgrounds
- Smooth animations
- Responsive breakpoints
- Card-based layouts
- Consistent spacing and typography

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Production Build

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `build` folder ready for deployment.

## Deployment

The app can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

Make sure to set the `REACT_APP_API_URL` environment variable in your deployment platform.

## License

MIT License

## Support

For support, email support@travelai.com or open an issue in the repository.

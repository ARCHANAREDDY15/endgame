# Endgame - Social Media Platform for Athletes

A modern, full-stack social media platform specifically designed for athletes to share their sports moments, connect with teammates, and build their athletic community. Built with cutting-edge technologies and featuring a premium dark theme with neon accents.

## 🚀 Features

### Core Social Media Features
- **User Authentication**: Secure signup/login with Supabase Auth
- **Post Creation**: Upload multiple images with captions
- **Real-time Interactions**: Like and comment on posts instantly
- **Follow System**: Connect with other athletes and build your network
- **Tagging System**: Tag teammates, sports, and achievements with hashtags
- **Notifications**: Real-time notifications for likes and interactions

### Athlete-Focused Features
- **Sport Categories**: Basketball, Soccer, Tennis, and more
- **Profile Management**: Custom profiles with bio, sport, and stats
- **Leaderboard**: Track athletic achievements and rankings
- **Search Functionality**: Find athletes and posts by tags or usernames

### Premium UI/UX
- **Dark Theme**: Modern dark interface with neon cyan/purple accents
- **Glass Morphism**: Elegant glass-like effects and animations
- **Responsive Design**: Optimized for mobile and desktop
- **Smooth Animations**: Particle effects and hover transitions

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **React Router** - Client-side routing
- **React Query** - Data fetching and state management

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Real-time Subscriptions** - Live updates for likes, comments, notifications
- **Supabase Storage** - File uploads and media management
- **Row Level Security** - Database-level security policies

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ARCHANAREDDY15/endgame.git
   cd athlete-allure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref your-project-ref

   # Push database migrations
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npx supabase db push  # Push database migrations
npx supabase db reset # Reset database

# Code Quality
npm run lint         # Run ESLint
```

## 🎨 Design System

### Color Palette
- **Primary**: Cyan (#00FFFF) and Purple (#8B5CF6) gradients
- **Background**: Dark theme with subtle gradients
- **Text**: White and gray variations for readability
- **Accents**: Neon effects for interactive elements

### Typography
- **Font Family**: System fonts with fallbacks
- **Sizes**: Responsive scaling from mobile to desktop
- **Weights**: Regular, medium, semibold, and bold

## 🔒 Security Features

- **Row Level Security**: Database policies ensure users can only access their own data
- **Authentication**: Secure JWT-based authentication with Supabase
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Restricted file types and sizes

## 📈 Performance Optimizations

- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Efficient image loading and caching
- **Real-time Updates**: Optimized subscriptions for live features
- **Caching**: React Query for efficient data fetching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


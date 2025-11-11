# 🎨 Comic Frontend

React-based web interface for AI-powered comic generation.

## 📋 Features

- **Landing Page** - Showcase platform features and benefits
- **Comic Creator** - Interactive interface for comic generation
- **Examples Gallery** - Browse sample comics
- **How It Works** - Step-by-step guide
- **Pricing** - Subscription plans and pricing
- **Authentication** - Login and signup pages
- **Responsive Design** - Mobile-friendly interface
- **Modern UI** - Built with Tailwind CSS and Framer Motion

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## 📁 Project Structure

```
src/
├── components/
│   ├── sections/      # Page sections
│   ├── ui/            # Reusable UI components
│   └── AppNavbar.tsx  # Navigation bar
├── pages/
│   ├── Landing.tsx    # Landing page
│   ├── CreateComic.tsx # Comic creation interface
│   ├── Examples.tsx   # Examples gallery
│   ├── HowItWorks.tsx # Tutorial page
│   ├── Pricing.tsx    # Pricing page
│   ├── Login.tsx      # Login page
│   └── Signup.tsx     # Signup page
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
└── App.tsx            # Main app component
```

## 🎨 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **html2canvas** - Screenshot generation
- **jsPDF** - PDF export

## 🛠️ Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (one-way operation)

## 🎯 Pages

### Landing Page
- Hero section with call-to-action
- Features showcase
- How it works section
- Testimonials
- Pricing preview

### Create Comic
- Interactive comic creation interface
- Panel management
- Character customization
- Dialogue editor
- Export options (PNG, PDF)

### Examples
- Gallery of sample comics
- Filter by genre/style
- Preview and details

### How It Works
- Step-by-step tutorial
- Visual guides
- Tips and best practices

### Pricing
- Subscription tiers
- Feature comparison
- Payment integration

### Authentication
- Login form
- Signup form
- Password recovery
- Social login options

## 🎨 Styling

The project uses Tailwind CSS with custom configuration:

- Custom color palette
- Responsive breakpoints
- Custom animations
- Dark mode support (optional)

## 🔧 Configuration

### Tailwind Config

Edit `tailwind.config.js` to customize:
- Colors
- Fonts
- Spacing
- Breakpoints
- Plugins

### PostCSS

The project uses PostCSS with:
- Tailwind CSS
- Autoprefixer

## 📱 Responsive Design

The interface is fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🎭 Components

### UI Components
- Buttons
- Cards
- Modals
- Forms
- Tooltips
- Dropdowns

### Section Components
- Hero
- Features
- Gallery
- Testimonials
- Footer

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel deploy
```

### Deploy to Netlify

```bash
netlify deploy --prod
```

## 🔗 Integration

The frontend is designed to integrate with the comic-backend API:

- API endpoints for comic generation
- Real-time status updates
- Image upload and management
- User authentication

## 💡 Development Tips

- Use React DevTools for debugging
- Follow component composition patterns
- Keep components small and focused
- Use TypeScript for type safety
- Leverage Tailwind utilities
- Optimize images and assets

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

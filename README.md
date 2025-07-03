# ⏰ Docket

**Organize your time. Structure your hours with intention.**

Docket is a modern, mobile-first Progressive Web App (PWA) designed for intentional timeboxing and focused productivity. Built with React and powered by offline-first architecture, Docket helps you structure your day with precision and purpose.

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA](https://img.shields.io/badge/PWA-ready-purple.svg)

## ✨ Features

### 🎯 **Core Functionality**
- **Daily Timeboxing**: 24-hour vertical timeline with visual time blocks
- **Smart Scheduling**: Create, edit, and manage time-blocked tasks
- **Live Timers**: Built-in countdown timers with background persistence
- **Recurring Events**: Set up daily, weekly, or custom recurring tasks
- **Category System**: Organize tasks with color-coded categories

### 📱 **Mobile-First Experience**
- **Progressive Web App**: Install directly to your home screen
- **Offline Support**: Full functionality without internet connection
- **Touch-Optimized**: Swipeable cards and mobile-friendly interactions
- **Responsive Design**: Seamless experience across all devices

### 🎨 **User Interface**
- **Focus View**: Distraction-free task management interface
- **Calendar View**: Traditional timeline with hour-by-hour visualization
- **Search & Filter**: Find tasks quickly by title or category
- **Dark/Light Theme**: Automatic theme switching
- **Live Countdown**: Real-time progress tracking for active tasks

### 🔧 **Advanced Features**
- **IndexedDB Storage**: Lightning-fast local data persistence
- **Timer Management**: Background timers that survive app backgrounding
- **Overflow Handling**: Smart management of overlapping time blocks
- **Profile Settings**: Customize work hours and preferences
- **Export/Import**: Data portability (planned)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with PWA support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/docket.git
   cd docket
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173` and start organizing your time!

### Production Build
```bash
npm run build
npm run preview
```

## 📖 How to Use

### Getting Started
1. **Create Your First Task**: Tap the `+` button to schedule your first time block
2. **Set Duration**: Choose start and end times for focused work sessions
3. **Add Categories**: Organize your tasks with color-coded categories
4. **Start Timer**: Tap any task to begin a focused work session
5. **Track Progress**: Monitor your daily accomplishments

### Key Concepts

- **Task**: A scheduled time block for focused work
- **Timeline**: Your daily timeline view
- **Live Timer**: An active timer session
- **Recurring Task**: A repeating task or event
- **Focus Session**: Extended focus sessions with distraction blocking

### Views & Navigation

#### 🎯 Focus View
- Central hub for all your tasks
- Search and filter capabilities
- Swipe gestures for quick actions
- One-tap timer activation

#### 📅 Calendar View  
- Traditional timeline visualization
- Hour-by-hour daily planning
- Visual time block management
- Overflow handling for busy periods

#### ⏱️ Timer View
- Full-screen timer interface
- Progress tracking and controls
- Background operation support
- Completion notifications

## 🛠️ Technical Architecture

### Built With
- **Frontend**: React 19.1.0 with modern hooks
- **Build Tool**: Vite 7.0.0 for blazing-fast development
- **Storage**: IndexedDB for offline-first data persistence
- **PWA**: Service Worker with full offline capability
- **UI**: Custom CSS with mobile-first responsive design
- **Icons**: Lucide React and React Icons

### Key Dependencies
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "lucide-react": "^0.525.0",
  "react-icons": "^5.5.0",
  "vite-plugin-pwa": "^1.0.1"
}
```

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── FocusView/      # Main task management interface
│   ├── TimerView/      # Full-screen timer
│   ├── TaskTimeline/   # Calendar timeline view
│   └── ...            # Modal dialogs, navigation, etc.
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
└── App.jsx            # Main application component
```

## 🎨 Design Philosophy

Notch embraces minimalist design principles focused on:
- **Clarity**: Clean, uncluttered interface
- **Intention**: Every interaction serves a purpose  
- **Focus**: Distraction-free work environments
- **Precision**: Exact time management and tracking

### Brand Values
- ⚡ **Performance**: Lightning-fast interactions
- 🎯 **Focus**: Distraction-free productivity
- 📱 **Accessibility**: Universal design principles
- 🔒 **Privacy**: Offline-first, data stays local

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- ESLint configuration provided
- Prettier for consistent formatting
- Mobile-first responsive design
- Semantic HTML and accessible patterns

## 📋 Roadmap

### Current Version (v0.1.0)
- ✅ Core timeboxing functionality
- ✅ PWA installation and offline support
- ✅ Timer system with background persistence
- ✅ Category management
- ✅ Recurring events

### Upcoming Features
- 📊 **Analytics Dashboard**: Time tracking insights and productivity metrics
- 🔄 **Data Sync**: Cloud backup and multi-device synchronization
- 🎵 **Focus Modes**: Ambient sounds and distraction blocking
- 🤖 **Smart Suggestions**: AI-powered scheduling recommendations
- 📅 **Calendar Integration**: Import/export with popular calendar apps
- 👥 **Team Features**: Collaborative timeboxing for teams

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the timeboxing methodology and focused productivity principles
- Built with the React ecosystem and modern web technologies
- Special thanks to the open-source community for tools and inspiration

## 📧 Support

- 📝 **Issues**: [GitHub Issues](https://github.com/yourusername/notch/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/notch/discussions)
- 📧 **Email**: support@notch.app

---

**Start notching your time today. Every hour, marked with intention.**

Built with ❤️ for focused productivity and intentional time management.

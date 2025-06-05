# 3D Product Configurator

A modern 3D product configurator built with React Three Fiber, featuring real-time color customization and smooth 3D interactions.

## Features

- **Real-time 3D Visualization**: Interactive PlayStation 5 DualSense controller model
- **Color Customization**: Change colors of different controller parts (back plate, buttons, front plate)
- **Smooth Interactions**: Hover effects and orbital camera controls
- **Modern UI**: Clean, minimal interface with backdrop blur effects
- **TypeScript**: Fully typed for better development experience

## Tech Stack

- **React 19** - UI framework
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for React Three Fiber
- **TypeScript** - Type safety
- **Vite** - Fast build tool

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Check TypeScript types

## Project Structure

```
src/
├── components/
│   ├── Configurator.tsx    # Main 3D model component
│   ├── Scene.tsx          # 3D scene setup
│   └── ColorControls.tsx  # Color picker UI
├── App.tsx               # Main app component
├── App.css              # Styles
└── types.d.ts           # Type definitions
```

## Customization

### Adding New Materials

1. Update the `MATERIALS` object in `Configurator.tsx`
2. Add corresponding entries in `ColorControls.tsx`
3. Update the `Colors` type definition

### Changing the 3D Model

1. Replace the model file in `public/models/`
2. Update the path in `Configurator.tsx`
3. Adjust material names and mappings as needed

## Performance Optimization

- Models are loaded using Suspense for better UX
- Materials are efficiently updated using useEffect
- Color changes use React.memo and useCallback for optimization

## Deployment

This project includes GitHub Actions for automatic deployment to GitHub Pages.

### Manual Deployment

```bash
npm run build
npm run preview  # Test the build locally
```

### GitHub Pages Setup

1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions"
3. Push to main branch to trigger automatic deployment

## Live Demo

Once deployed, your app will be available at:
`https://yourusername.github.io/product-configurator-3d/`

## License

MIT License

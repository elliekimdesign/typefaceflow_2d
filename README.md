# Typeface2D - Gesture-Controlled Font Selection

A 2D demo of an interactive typography tool that allows you to select fonts using hand gestures through camera-based recognition.

## Features

- **Flowing Fonts**: Three rows of fonts continuously flowing from left to right
- **Hand Gesture Control**: Camera-based hand tracking using MediaPipe
- **Stop Gesture**: Make a fist to pause the font animation
- **Font Selection**: Point at fonts to highlight them, then pinch to select
- **Live Preview**: Selected fonts are instantly applied to sample text
- **Modern UI**: Beautiful gradient backgrounds and smooth animations

## How to Use

1. **Start the Demo**: Open `index.html` in a modern web browser
2. **Enable Camera**: Click "Start Camera" to begin hand tracking
3. **Stop Fonts**: Make a closed fist to pause the flowing fonts
4. **Highlight Fonts**: Point with your index finger at any font to highlight it
5. **Select Font**: While pointing, pinch your thumb and index finger together to select the highlighted font
6. **Resume Flow**: Open your hand to resume font animation

## Keyboard Shortcuts (for testing)

- **Spacebar**: Pause/resume font animation
- **Enter**: Select the currently highlighted font
- **Click**: Click any font directly to select it

## Gestures

- **Closed Fist** 👊: Pause font animation
- **Index Finger Pointing** 👉: Highlight fonts
- **Pinch (Thumb + Index)** 🤏: Select highlighted font
- **Open Hand** ✋: Resume animation

## Technical Details

- Uses MediaPipe Hands for real-time hand tracking
- CSS animations for smooth font flow
- Responsive design that works on desktop and mobile
- No server required - runs entirely in the browser

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Camera access permissions
- JavaScript enabled

## Files

- `index.html` - Main HTML structure
- `styles.css` - CSS animations and styling
- `script.js` - Hand tracking and interaction logic
- `README.md` - This documentation

## Troubleshooting

- **Camera not working**: Make sure to allow camera permissions
- **Hand tracking issues**: Ensure good lighting and clear hand visibility
- **Performance**: Close other tabs/applications for better performance

Enjoy exploring fonts with gesture control! 🎨✋

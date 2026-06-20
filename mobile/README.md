# Bijli Tracker Mobile App

A React Native (Expo) app to track your electricity usage by uploading monthly bills and meter readings.

## Requirements

- Node.js
- Expo CLI
- The "Bijli Tracker Backend" running locally or hosted

## Setup and Running Locally

1. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Variables:**
   Create a \`.env\` file in the root of the \`mobile\` directory (where this README is) and set your backend API URL. If you are running the backend locally and testing on an Android emulator, use \`http://10.0.2.2:5000\`. If testing on iOS simulator, use \`http://localhost:5000\`. If testing on a physical device, use your computer's local IP address (e.g., \`http://192.168.x.x:5000\`).

   Example \`.env\` file:
   \`\`\`env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
   \`\`\`

3. **Start Expo Development Server:**
   \`\`\`bash
   npx expo start
   \`\`\`
   
   - Press \`a\` to open on Android emulator
   - Press \`i\` to open on iOS simulator
   - Scan the QR code with the Expo Go app on a physical device

## Features
- **Auth Flow:** Login and Register screens using JWT stored securely via \`expo-secure-store\`.
- **Dashboard:** At-a-glance view of units consumed, estimated cost, and daily averages.
- **Bill Upload:** Take a photo or upload from the gallery. AI automatically extracts the month, units, and total cost.
- **Meter Reading:** Quickly capture a photo of your meter to record a reading, with AI confidence warnings.
- **History:** Tabbed view of your past uploaded bills and meter readings.
- **Trends:** Line and Bar charts visualizing your electricity usage and cost over time.

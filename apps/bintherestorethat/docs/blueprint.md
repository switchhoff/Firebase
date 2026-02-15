# **App Name**: Box Detective

## Core Features:

- Box Creation: Users can create new storage boxes, which are stored in a Firestore database.
- Room Management: Users can create and manage rooms (e.g., garage, attic, basement). These are stored in Firestore.
- Item Addition: Users can add items to specific boxes. This data is linked to the corresponding box ID in Firestore.
- QR Code Generation: Generates a unique QR code for each box, encoding a URL to view the box's contents without authentication. Each QR Code is linked to Firestore data.
- Content Display via QR Code: When a QR code is scanned, the app displays the contents of the linked storage box. Read the contents from Firestore and display them in a user-friendly way.
- Smart Suggestions for box names: Suggest an accurate and concise box name using AI, as a tool.

## Style Guidelines:

- Primary color: Light periwinkle (#CCCCFF), inspired by a clean, organized feeling, but avoiding the cliche of blues for storage apps.
- Background color: Very light periwinkle (#F5F5FF).
- Accent color: Muted violet (#9999CC), a color shift from the primary that suggests calm authority.
- Body and headline font: 'PT Sans', sans-serif, a modern font with some warmth and personality that is readable and approachable.
- Use clear and simple icons to represent storage boxes, rooms, and items.
- The app layout should be clean and intuitive, allowing easy navigation and item management.
- Subtle animations can be used when adding/removing items or scanning QR codes.
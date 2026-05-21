import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import PushNotificationManager from "@/components/PushNotificationManager";

export const metadata = {
  title: "PrintExpress | High-End Printing & Xerox Command Deck",
  description: "Secure multi-file uploads, real-time interactive calculations, Stripe simulations, and immediate status updates via Socket.io.",
  keywords: ["PrintExpress", "Xerox", "Print Shop", "A4 Color Printing", "Binding Service", "Real-Time Tracking"]
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}


import "./globals.css";

export const metadata = {
  title: "Kiddistan Admin",
  description: "Kiddistan administration console",
  icons: {
    icon: "/kiddistan-favicon.png",
    shortcut: "/kiddistan-favicon.png",
    apple: "/kiddistan-favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
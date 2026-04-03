import "./globals.css";

export const metadata = {
  title: "PetroStation - Petrol Pump Management",
  description: "Professional Petrol Pump Station Management Software",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}

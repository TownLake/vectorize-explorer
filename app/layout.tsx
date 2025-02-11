// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Vectorize Explorer",
  description: "Explore your vector database",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-spaceMidnight text-white">
        {children}
      </body>
    </html>
  );
}
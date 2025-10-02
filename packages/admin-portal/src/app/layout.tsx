import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../providers/auth-provider';
import { FooterCopyright } from '../components/footer-copyright';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bell Registry Admin Portal',
  description: 'Administrative portal for Bell Registry platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <FooterCopyright />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 
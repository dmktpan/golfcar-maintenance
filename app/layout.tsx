
import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GolfCart Maintenance",
  description: "ระบบบันทึก ตรวจสอบ และอนุมัติงานซ่อมรถกอล์ฟไฟฟ้า",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={sarabun.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}

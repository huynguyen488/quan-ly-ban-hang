import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../src/components/Sidebar";
import { Toaster } from 'react-hot-toast';

// trong layout.tsx hoặc page.tsx
<Toaster position="top-right" />
// import Header from "../src/components/Header"; // 1. Đã tắt import Header

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Quản Lý Bán Hàng | Trường Anh Computer",
  description: "Hệ thống POS nội bộ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-slate-50 overflow-hidden flex h-screen w-full`}>
        {/* Cột trái: Sidebar cố định */}
        <Sidebar />

        {/* Cột phải: Chỉ còn Nội dung chính, không còn Header chiếm chỗ nữa */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* <Header />  <-- 2. Đã vô hiệu hóa thẻ Header ở đây */}
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
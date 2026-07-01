import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../src/components/Sidebar";
import { Toaster } from 'react-hot-toast';

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
        {/* Đưa Toaster vào đúng chuẩn React */}
        <Toaster position="top-right" />
        
        {/* Cột trái: Sidebar (Đã tích hợp cơ chế đóng/mở Mobile) */}
        <Sidebar />

        {/* Cột phải: Nội dung chính */}
        {/* 🔥 LƯU Ý: Thêm pt-14 trên mobile để bù chỗ cho Thanh Menu Bar, trên desktop (lg) trả về 0 */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden pt-14 lg:pt-0">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
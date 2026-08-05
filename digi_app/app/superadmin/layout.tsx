"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar"; // Sesuaikan path dengan lokasi Sidebar Anda
import Header from "@/components/header";   // Sesuaikan path dengan lokasi Header Anda

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f9f8f4] overflow-hidden">
      <Sidebar 
        userRole="Superadmin" 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          userRole="Superadmin" 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
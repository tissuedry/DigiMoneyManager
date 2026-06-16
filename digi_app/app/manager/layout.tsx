"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Direktur / Manajemen"
      />
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userRole="Direktur / Manajemen"
        />
        {children}
      </div>
    </div>
  );
}

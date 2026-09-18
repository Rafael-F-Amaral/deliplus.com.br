"use client"

import { useState } from 'react'

export function DeviceWrapper({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#2D333B]">
      <div className="h-14 bg-[#22272E] border-b border-[#444C56] text-white flex items-center justify-center gap-4 shrink-0 shadow-sm">
        <span className="text-sm font-semibold text-gray-300 mr-2">Sandbox Preview:</span>
        <button 
          onClick={() => setIsMobile(false)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${!isMobile ? 'bg-[#539BF5] text-white' : 'bg-[#373E47] text-gray-300 hover:bg-[#444C56]'}`}
        >
          Desktop
        </button>
        <button 
          onClick={() => setIsMobile(true)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isMobile ? 'bg-[#539BF5] text-white' : 'bg-[#373E47] text-gray-300 hover:bg-[#444C56]'}`}
        >
          Mobile (390px)
        </button>
      </div>
      
      <div className="flex-1 overflow-auto flex justify-center items-start p-4 lg:p-8">
        <div 
          className={`bg-white h-full overflow-hidden shadow-2xl transition-all duration-300 ease-in-out relative flex flex-col ${isMobile ? 'w-[390px] shrink-0 border-[12px] border-black rounded-[3rem]' : 'w-full rounded-xl border border-gray-200'}`}
        >
          <div className="flex-1 overflow-auto bg-[#F7F6F2]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

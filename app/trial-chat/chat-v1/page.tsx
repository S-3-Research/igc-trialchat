"use client";

import { ChatV1Panel } from "@/components/ChatV1Panel";
import { useColorScheme } from "@/contexts/ColorSchemeContext";

export default function ChatV1Page() {
  const { scheme } = useColorScheme();

  return (
    <main className="flex flex-1 flex-col items-center">
      <div className="main-layout-container mx-auto w-[95%] max-w-6xl flex-1 flex flex-col py-6 pb-10">
        <ChatV1Panel theme={scheme} />
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DemoPasswordModal from '@/components/DemoPasswordModal';
import { isDemoUnlockedClient } from '@/lib/demoAuth';

export default function TrialChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if demo is unlocked on client side
    const checkUnlocked = () => {
      const unlocked = isDemoUnlockedClient('trial-chat');
      setIsUnlocked(unlocked);
    };
    
    checkUnlocked();
  }, []);

  const handleSuccess = () => {
    setIsUnlocked(true);
  };

  const handleCancel = () => {
    router.push('/');
  };

  // Show loading state while checking
  if (isUnlocked === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Show password modal if not unlocked
  if (isUnlocked === false) {
    return (
      <DemoPasswordModal
        demoId="trial-chat"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return <>{children}</>;
}

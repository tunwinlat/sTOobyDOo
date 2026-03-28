'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const [isChecking, setIsChecking] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/setup');
        const data = await res.json();
        setIsSetupComplete(data.isSetupComplete);
      } catch (error) {
        console.error('Failed to check setup status:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkSetup();
  }, []);

  useEffect(() => {
    if (isChecking || isSetupComplete === null) return;

    if (!isSetupComplete) {
      router.replace('/setup');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [isSetupComplete, status, isChecking, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

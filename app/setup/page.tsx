'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Check, ChevronRight, ChevronLeft, Loader2, Users, Bell, Mail, Sparkles } from 'lucide-react';

const steps = [
  { id: 'family', title: 'Family Setup', description: 'Create your family space', icon: Users },
  { id: 'admin', title: 'Admin Account', description: 'Set up the administrator', icon: Sparkles },
  { id: 'notifications', title: 'Notifications', description: 'Configure alerts (optional)', icon: Bell },
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    familyName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    pushoverAppToken: '',
    pushoverUserKey: '',
    resendApiKey: '',
    resendFromEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.familyName.trim()) {
        newErrors.familyName = 'Family name is required';
      }
    } else if (currentStep === 1) {
      if (!formData.adminName.trim()) {
        newErrors.adminName = 'Name is required';
      }
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        newErrors.adminEmail = 'Invalid email address';
      }
      if (!formData.adminPassword) {
        newErrors.adminPassword = 'Password is required';
      } else if (formData.adminPassword.length < 8) {
        newErrors.adminPassword = 'Password must be at least 8 characters';
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: formData.familyName,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          pushoverAppToken: formData.pushoverAppToken || undefined,
          pushoverUserKey: formData.pushoverUserKey || undefined,
          resendApiKey: formData.resendApiKey || undefined,
          resendFromEmail: formData.resendFromEmail || undefined,
        }),
      });

      if (response.ok) {
        router.push('/login?setup=success');
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Setup failed' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-2xl border border-white/10 mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            sTOobyDOo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Setup your family workspace</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {/* Progress */}
          <div className="flex gap-1.5 mb-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-foreground/60' 
                    : 'bg-white/[0.06]'
                }`}
              />
            ))}
          </div>

          {/* Step Header */}
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <CurrentIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
            <p className="text-muted-foreground text-sm">{steps[currentStep].description}</p>
          </div>

          {/* Form Content */}
          <div className="space-y-4">
            {currentStep === 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Family Name</label>
                <Input
                  placeholder="Enter your family name"
                  value={formData.familyName}
                  onChange={(e) => updateField('familyName', e.target.value)}
                  className={`h-11 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm ${errors.familyName ? 'border-red-500/50' : ''}`}
                />
                {errors.familyName && (
                  <p className="text-xs text-red-400">{errors.familyName}</p>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    className={`h-11 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm ${errors.adminName ? 'border-red-500/50' : ''}`}
                  />
                  {errors.adminName && <p className="text-xs text-red-400">{errors.adminName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    className={`h-11 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm ${errors.adminEmail ? 'border-red-500/50' : ''}`}
                  />
                  {errors.adminEmail && <p className="text-xs text-red-400">{errors.adminEmail}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Password</label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={formData.adminPassword}
                    onChange={(e) => updateField('adminPassword', e.target.value)}
                    className={`h-11 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm ${errors.adminPassword ? 'border-red-500/50' : ''}`}
                  />
                  {errors.adminPassword && <p className="text-xs text-red-400">{errors.adminPassword}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={`h-11 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm">Pushover Notifications</h3>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Pushover App Token (optional)"
                      value={formData.pushoverAppToken}
                      onChange={(e) => updateField('pushoverAppToken', e.target.value)}
                      className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
                    />
                    <Input
                      placeholder="Pushover User Key (optional)"
                      value={formData.pushoverUserKey}
                      onChange={(e) => updateField('pushoverUserKey', e.target.value)}
                      className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm">Email Notifications (Resend)</h3>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Resend API Key (optional)"
                      value={formData.resendApiKey}
                      onChange={(e) => updateField('resendApiKey', e.target.value)}
                      className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
                    />
                    <Input
                      type="email"
                      placeholder="From Email (optional)"
                      value={formData.resendFromEmail}
                      onChange={(e) => updateField('resendFromEmail', e.target.value)}
                      className="h-10 bg-white/[0.03] border-white/[0.08] rounded-xl text-sm"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  These settings can be changed later in the admin settings.
                </p>
              </div>
            )}

            {errors.submit && (
              <p className="text-xs text-red-400 text-center">{errors.submit}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
              className="px-4 py-2 rounded-xl text-muted-foreground font-medium hover:bg-white/[0.03] transition-all disabled:opacity-50 flex items-center gap-1.5 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl btn-primary text-white font-medium transition-all hover:scale-[1.02] flex items-center gap-1.5 text-sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 rounded-xl btn-primary text-white font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

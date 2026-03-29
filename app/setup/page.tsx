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
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-purple-500/30 mx-auto mb-6">
            S
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            sTOobyDOo
          </h1>
          <p className="text-muted-foreground mt-2">Setup your family workspace</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Step Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <CurrentIcon className="h-8 w-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
          </div>

          {/* Form Content */}
          <div className="space-y-5">
            {currentStep === 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Family Name</label>
                <Input
                  placeholder="Enter your family name"
                  value={formData.familyName}
                  onChange={(e) => updateField('familyName', e.target.value)}
                  className={`h-14 bg-white/5 border-white/10 rounded-xl text-lg ${errors.familyName ? 'border-red-500' : ''}`}
                />
                {errors.familyName && (
                  <p className="text-sm text-red-400">{errors.familyName}</p>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    className={`h-14 bg-white/5 border-white/10 rounded-xl ${errors.adminName ? 'border-red-500' : ''}`}
                  />
                  {errors.adminName && <p className="text-sm text-red-400">{errors.adminName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    className={`h-14 bg-white/5 border-white/10 rounded-xl ${errors.adminEmail ? 'border-red-500' : ''}`}
                  />
                  {errors.adminEmail && <p className="text-sm text-red-400">{errors.adminEmail}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={formData.adminPassword}
                    onChange={(e) => updateField('adminPassword', e.target.value)}
                    className={`h-14 bg-white/5 border-white/10 rounded-xl ${errors.adminPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.adminPassword && <p className="text-sm text-red-400">{errors.adminPassword}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={`h-14 bg-white/5 border-white/10 rounded-xl ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold">Pushover Notifications</h3>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Pushover App Token (optional)"
                      value={formData.pushoverAppToken}
                      onChange={(e) => updateField('pushoverAppToken', e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                    <Input
                      placeholder="Pushover User Key (optional)"
                      value={formData.pushoverUserKey}
                      onChange={(e) => updateField('pushoverUserKey', e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold">Email Notifications (Resend)</h3>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Resend API Key (optional)"
                      value={formData.resendApiKey}
                      onChange={(e) => updateField('resendApiKey', e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                    <Input
                      type="email"
                      placeholder="From Email (optional)"
                      value={formData.resendFromEmail}
                      onChange={(e) => updateField('resendFromEmail', e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  These settings can be changed later in the admin settings.
                </p>
              </div>
            )}

            {errors.submit && (
              <p className="text-sm text-red-400 text-center">{errors.submit}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
              className="px-6 py-3 rounded-xl bg-white/5 text-muted-foreground font-medium hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105 flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete
                    <Check className="h-5 w-5" />
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

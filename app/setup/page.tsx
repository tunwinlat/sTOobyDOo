'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronRight, ChevronLeft, Loader2, Users, Bell, Mail } from 'lucide-react';

const steps = [
  { id: 'family', title: 'Family Setup', description: 'Create your family space' },
  { id: 'admin', title: 'Admin Account', description: 'Set up the administrator' },
  { id: 'notifications', title: 'Notifications', description: 'Configure alerts (optional)' },
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">sTOobyDOo</span>
          </div>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
          
          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Family Name</label>
                <Input
                  placeholder="Enter your family name"
                  value={formData.familyName}
                  onChange={(e) => updateField('familyName', e.target.value)}
                  className={errors.familyName ? 'border-destructive' : ''}
                />
                {errors.familyName && (
                  <p className="text-sm text-destructive">{errors.familyName}</p>
                )}
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    className={errors.adminName ? 'border-destructive' : ''}
                  />
                  {errors.adminName && (
                    <p className="text-sm text-destructive">{errors.adminName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    className={errors.adminEmail ? 'border-destructive' : ''}
                  />
                  {errors.adminEmail && (
                    <p className="text-sm text-destructive">{errors.adminEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={formData.adminPassword}
                    onChange={(e) => updateField('adminPassword', e.target.value)}
                    className={errors.adminPassword ? 'border-destructive' : ''}
                  />
                  {errors.adminPassword && (
                    <p className="text-sm text-destructive">{errors.adminPassword}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Pushover Notifications</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">App Token (optional)</label>
                    <Input
                      placeholder="Your Pushover app token"
                      value={formData.pushoverAppToken}
                      onChange={(e) => updateField('pushoverAppToken', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User Key (optional)</label>
                    <Input
                      placeholder="Your Pushover user key"
                      value={formData.pushoverUserKey}
                      onChange={(e) => updateField('pushoverUserKey', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Email Notifications (Resend)</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Key (optional)</label>
                    <Input
                      placeholder="Your Resend API key"
                      value={formData.resendApiKey}
                      onChange={(e) => updateField('resendApiKey', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Email (optional)</label>
                    <Input
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      value={formData.resendFromEmail}
                      onChange={(e) => updateField('resendFromEmail', e.target.value)}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  These settings can be changed later in the admin settings.
                </p>
              </div>
            </>
          )}

          {errors.submit && (
            <p className="text-sm text-destructive text-center">{errors.submit}</p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

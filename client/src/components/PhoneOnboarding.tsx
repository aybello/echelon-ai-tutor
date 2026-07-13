import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PhoneOnboardingProps {
  onComplete: () => void;
}

export default function PhoneOnboarding({ onComplete }: PhoneOnboardingProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const updatePhone = trpc.auth.updatePhone.useMutation({
    onSuccess: () => {
      toast.success("Phone number saved!");
      onComplete();
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
    if (cleaned.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    updatePhone.mutate({ phone: cleaned });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          One last step
        </h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          Add your phone number to receive exam reminders and important updates about your certification prep.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1 block">
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-base"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl"
            disabled={updatePhone.isPending}
          >
            {updatePhone.isPending ? "Saving..." : "Continue to Echelon Institute"}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your number is used for exam reminders only. We never share your information.
        </p>
      </div>
    </div>
  );
}

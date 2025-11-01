import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Mail, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterTime, setNewsletterTime] = useState("08:00");

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  useEffect(() => {
    if (user && open) {
      fetchNewsletterStatus();
    }
  }, [user, open]);

  const fetchNewsletterStatus = async () => {
    try {
      const response = await fetch('/api/newsletter/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      setNewsletterSubscribed(data.newsletterSubscription);
      setNewsletterTime(data.newsletterTime || "08:00");
    } catch (error) {
      console.error('Error fetching newsletter status:', error);
    }
  };

  const toggleNewsletter = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ subscribe: !newsletterSubscribed }),
      });
      const data = await response.json();
      if (response.ok) {
        setNewsletterSubscribed(data.newsletterSubscription);
        toast.success(data.message);
      } else {
        toast.error('Failed to update newsletter subscription');
      }
    } catch (error) {
      console.error('Error updating newsletter subscription:', error);
      toast.error('Failed to update newsletter subscription');
    }
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setNewsletterTime(newTime);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ subscribe: newsletterSubscribed, time: newTime }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Newsletter delivery time updated');
      } else {
        toast.error('Failed to update delivery time');
      }
    } catch (error) {
      console.error('Error updating newsletter time:', error);
      toast.error('Failed to update delivery time');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="p-2 bg-secondary rounded-lg"
              >
                {isDark ? (
                  <Moon className="w-5 h-5 text-accent" />
                ) : (
                  <Sun className="w-5 h-5 text-accent" />
                )}
              </motion.div>
              <div>
                <Label htmlFor="theme-mode" className="text-base font-medium">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <Switch
              id="theme-mode"
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
          </div>
          {user && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 bg-secondary rounded-lg"
                  >
                    <Mail className="w-5 h-5 text-accent" />
                  </motion.div>
                  <div>
                    <Label htmlFor="newsletter-mode" className="text-base font-medium">
                      Daily Newsletter
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily top headlines via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="newsletter-mode"
                  checked={newsletterSubscribed}
                  onCheckedChange={toggleNewsletter}
                />
              </div>
              {newsletterSubscribed && (
                <div className="flex items-center gap-3 ml-8">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="newsletter-time" className="text-sm font-medium">
                    Delivery Time
                  </Label>
                  <Input
                    id="newsletter-time"
                    type="time"
                    value={newsletterTime}
                    onChange={handleTimeChange}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Settings, Bell, Shield, Palette, Info } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your chat experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-medium">Notifications</h3>
            </div>

            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-sm">
                  Push Notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-sm">
                  Message Sound
                </Label>
                <Switch
                  id="sound"
                  checked={sound}
                  onCheckedChange={setSound}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              <h3 className="font-medium">Appearance</h3>
            </div>

            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-sm">
                  Dark Mode
                </Label>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  disabled
                />
                <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy & Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <h3 className="font-medium">Privacy & Security</h3>
            </div>

            <div className="space-y-3 pl-7">
              <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                <span className="text-sm">Blocked Contacts</span>
              </Button>

              <Button variant="ghost" className="w-full justify-start p-0 h-auto" disabled>
                <span className="text-sm">Privacy Settings</span>
                <span className="text-xs text-gray-500 ml-auto">Coming Soon</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              <h3 className="font-medium">About</h3>
            </div>

            <div className="space-y-3 pl-7">
              <div className="text-sm text-gray-600">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Platform:</strong> Web</p>
                <p><strong>Last Updated:</strong> April 2026</p>
              </div>

              <Button variant="ghost" className="w-full justify-start p-0 h-auto" disabled>
                <span className="text-sm">Help & Support</span>
                <span className="text-xs text-gray-500 ml-auto">Coming Soon</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
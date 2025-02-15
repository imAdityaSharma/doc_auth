import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsOverlay({ role }) {
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [patientDataSharing, setPatientDataSharing] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Settings</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md mx-auto p-6 rounded-lg shadow-lg bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{role} Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Common Settings for All Roles */}
          <div className="flex justify-between items-center">
            <Label>Dark Mode</Label>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <div className="flex justify-between items-center">
            <Label>Enable Notifications</Label>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Role-Specific Settings */}
          {role === "Patient" && (
            <div className="flex justify-between items-center">
              <Label>Share Medical Data</Label>
              <Switch checked={patientDataSharing} onCheckedChange={setPatientDataSharing} />
            </div>
          )}

          {role === "Doctor" && (
            <div className="flex justify-between items-center">
              <Label>Show Online Status</Label>
              <Switch />
            </div>
          )}

          {role === "Paramedic" && (
            <div className="flex justify-between items-center">
              <Label>Emergency Notifications</Label>
              <Switch />
            </div>
          )}

          {/* Save Button */}
          <Button className="w-full mt-4" onClick={() => alert("Settings Saved!")}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

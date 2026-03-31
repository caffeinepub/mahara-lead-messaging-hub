import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Plus, Shield, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type AppUser,
  type SectionKey,
  getUsers,
  hashPassword,
  useAuth,
} from "../hooks/useAuth";

const ALL_SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "compose", label: "Compose" },
  { key: "templates", label: "Templates" },
  { key: "sent", label: "Sent History" },
];

export default function SettingsPage() {
  const {
    currentUser,
    changePassword,
    createUser,
    deleteUser,
    updateUserPermissions,
    getAllUsers,
  } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  // Change password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Create user state
  const [newUsername, setNewUsername] = useState("");
  const [newUserPwd, setNewUserPwd] = useState("");
  const [newUserPerms, setNewUserPerms] = useState<SectionKey[]>([]);
  const [showNewUserPwd, setShowNewUserPwd] = useState(false);

  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    setUsers(getAllUsers());
  }, [getAllUsers]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (hashPassword(currentPwd) !== currentUser.passwordHash) {
      toast.error("Current password is incorrect");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }
    changePassword(currentUser.id, newPwd);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    toast.success("Password updated successfully");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error("Username is required");
      return;
    }
    if (newUserPwd.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      createUser(newUsername.trim(), newUserPwd, newUserPerms);
      setNewUsername("");
      setNewUserPwd("");
      setNewUserPerms([]);
      setUsers(getAllUsers());
      toast.success(`User "${newUsername}" created`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    deleteUser(userId);
    setUsers(getAllUsers());
    toast.success(`User "${username}" deleted`);
  };

  const handlePermissionToggle = (
    userId: string,
    section: SectionKey,
    checked: boolean,
  ) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const perms = checked
      ? [...user.permissions, section]
      : user.permissions.filter((p) => p !== section);
    updateUserPermissions(userId, perms);
    setUsers(getAllUsers());
  };

  const toggleNewUserPerm = (key: SectionKey, checked: boolean) => {
    setNewUserPerms((prev) =>
      checked ? [...prev, key] : prev.filter((p) => p !== key),
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Change Password
          </CardTitle>
          <CardDescription>Update your login password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      {/* User Management (admin only) */}
      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create New User
              </CardTitle>
              <CardDescription>
                Add a sub-user and set which sections they can access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewUserPwd ? "text" : "password"}
                        value={newUserPwd}
                        onChange={(e) => setNewUserPwd(e.target.value)}
                        placeholder="At least 6 characters"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNewUserPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Section Access</Label>
                  <div className="flex flex-wrap gap-4">
                    {ALL_SECTIONS.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`new-${key}`}
                          checked={newUserPerms.includes(key)}
                          onCheckedChange={(v) => toggleNewUserPerm(key, !!v)}
                        />
                        <Label
                          htmlFor={`new-${key}`}
                          className="font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" /> Create User
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> Manage Users
              </CardTitle>
              <CardDescription>
                Edit permissions or remove existing users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </div>
                    {user.id !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {user.role !== "admin" && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Section Access
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {ALL_SECTIONS.map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <Checkbox
                                id={`${user.id}-${key}`}
                                checked={user.permissions.includes(key)}
                                onCheckedChange={(v) =>
                                  handlePermissionToggle(user.id, key, !!v)
                                }
                              />
                              <Label
                                htmlFor={`${user.id}-${key}`}
                                className="font-normal text-sm cursor-pointer"
                              >
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {user.role === "admin" && (
                    <p className="text-xs text-muted-foreground">
                      Admin has full access to all sections.
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

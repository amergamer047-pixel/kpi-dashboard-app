import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function UsersPage() {
  const { data: users = [], isLoading, refetch } = trpc.users.list.useQuery();
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "viewer" as "admin" | "manager" | "viewer",
  });
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setShowDialog(false);
      setUserForm({ name: "", email: "", role: "viewer" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setShowDialog(false);
      setEditingUser(null);
      setUserForm({ name: "", email: "", role: "viewer" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      setUserToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", role: "viewer" });
    setShowDialog(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "viewer",
    });
    setShowDialog(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingUser) {
      updateUser.mutate({
        id: editingUser.id,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      });
    } else {
      createUser.mutate({
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      });
    }
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser.mutate({ id: userToDelete });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "viewer":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={handleAddUser} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found</p>
            ) : (
              users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="mt-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setUserToDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                placeholder="Enter user name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                placeholder="Enter user email"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) =>
                  setUserForm({
                    ...userForm,
                    role: value as "admin" | "manager" | "viewer",
                  })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={createUser.isPending || updateUser.isPending}
            >
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete User
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

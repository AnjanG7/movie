"use client";

import { useEffect, useState } from "react";
import { fetchUsersApi, deleteUserApi, createUserApi } from "./users.service";

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const ROLES = ["Admin", "Producer", "User"];

export function useAdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("Producer");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetchUsersApi();
      setUsers(res?.data?.users || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    await deleteUserApi(userToDelete);
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) return setError("Passwords do not match");

    setCreateLoading(true);
    try {
      await createUserApi({
        name,
        email,
        password,
        role: selectedRole,
      });

      setSuccessMessage("User created successfully!");
      resetCreateModal();
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  function resetCreateModal() {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSelectedRole("Producer");
    setError("");
    setSuccessMessage("");
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return {
    users,
    filteredUsers,
    loading,

    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,

    selectedUsers,
    setSelectedUsers,

    showCreateModal,
    setShowCreateModal,

    showDeleteConfirm,
    setShowDeleteConfirm,
    userToDelete,
    setUserToDelete,

    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    selectedRole,
    setSelectedRole,

    error,
    successMessage,
    createLoading,

    handleCreateUser,
    handleDeleteUser,
    resetCreateModal,
  };
}

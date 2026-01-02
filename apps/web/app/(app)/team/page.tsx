"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Briefcase,
  Search,
  Filter,
  Check,
  X,
  Mail,
  Shield,
  Edit2,
  Save,
  Trash2,
  Lock,
  User,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// Types
interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string | Role | null;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  ownerId: string | null;
  owner?: User;
}

interface ProjectUserAssignment {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string | Role | null;
  };
}

const AVAILABLE_ROLES = ["Investor", "LineProducer", "Accountant"] as const;
const API_BASE_URL = "https://film-finance-app.onrender.com/api";

// Helper function to get role name from string or object
const getRoleName = (role: string | Role | null): string => {
  if (!role) return "No Role";
  if (typeof role === "string") return role;
  return role.name;
};

export default function TeamManagementPage() {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<
    Map<string, ProjectUserAssignment[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [createError, setCreateError] = useState("");
  const [editingUserProject, setEditingUserProject] = useState<{
    userId: string;
    projectId: string;
  } | null>(null);
  const [editingRole, setEditingRole] = useState("");

  // Create User Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProjects(), fetchAllUsers()]);
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/allUsers`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const result = await response.json();
      if (result?.data?.users) {
        setUsers(result.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch all users:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success && data.data?.projects) {
        setProjects(data.data.projects);
        await fetchAllProjectAssignments(data.data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchAllProjectAssignments = async (projectsList: Project[]) => {
    const assignmentsMap = new Map<string, ProjectUserAssignment[]>();

    await Promise.all(
      projectsList.map(async (project) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/projects/${project.id}/users`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const result = await response.json();

          if (result?.data) {
            const projectUsers = result.data;
            if (projectUsers.length > 0) {
              assignmentsMap.set(project.id, projectUsers);
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch users for project ${project.id}:`,
            error
          );
        }
      })
    );

    setProjectAssignments(assignmentsMap);
  };

  const userProjectsMap = useMemo(() => {
    const map = new Map<string, Project[]>();

    // Add projects where user is owner
    projects.forEach((project) => {
      if (project.ownerId) {
        if (!map.has(project.ownerId)) {
          map.set(project.ownerId, []);
        }
        map.get(project.ownerId)!.push(project);
      }
    });

    // Add projects where user is assigned
    projectAssignments.forEach((assignments, projectId) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        assignments.forEach((assignment) => {
          if (!map.has(assignment.userId)) {
            map.set(assignment.userId, []);
          }
          if (!map.get(assignment.userId)!.some((p) => p.id === projectId)) {
            map.get(assignment.userId)!.push(project);
          }
        });
      }
    });

    return map;
  }, [projects, projectAssignments]);

  const getUserProjectRole = (
    userId: string,
    projectId: string
  ): string | null => {
    const assignments = projectAssignments.get(projectId);
    const assignment = assignments?.find((a) => a.userId === userId);
    return assignment?.role || null;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setCreateError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/add-user`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: name,
          role: "User", // Always "User" for system role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      if (data.success && data.data?.user) {
        setSuccessMessage("User created successfully!");

        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Refresh users list
        await fetchAllUsers();

        // Close modal after 2 seconds
        setTimeout(() => {
          setShowCreateModal(false);
          setSuccessMessage("");
        }, 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to create account");
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCreateError("");
    setSuccessMessage("");
  };

  const handleAssignToProject = async (projectId: string) => {
    if (!selectedUserId) return;

    try {
      const selectedUser = users.find((u) => u.id === selectedUserId);
      if (!selectedUser) {
        alert("User not found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/users`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: selectedUser.email,
            role: "Investor", // Default role for new assignment
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const project = projects.find((p) => p.id === projectId);
        alert(
          `${selectedUser.name} assigned to ${project?.title} successfully!`
        );
        setShowAssignModal(false);
        setSelectedUserId("");
        await fetchAllProjectAssignments(projects);
      } else {
        alert(data.message || "Failed to assign user");
      }
    } catch (error) {
      console.error("Error assigning user:", error);
      alert("Failed to assign user. Please try again.");
    }
  };

  const handleUpdateProjectRole = async (userId: string, projectId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        alert("User not found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/users/${user.email}/role`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: editingRole,
          }),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        alert("Role updated successfully!");
        setEditingUserProject(null);
        setEditingRole("");
        await fetchAllProjectAssignments(projects);
      } else {
        alert(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    }
  };

  const handleRemoveFromProject = async (userId: string, projectId: string) => {
    if (!confirm("Are you sure you want to remove this user from the project?"))
      return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        alert("User removed from project successfully!");
        await fetchAllProjectAssignments(projects);
      } else {
        alert(data.message || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user. Please try again.");
    }
  };

  const getUserProjects = (userId: string): Project[] => {
    return userProjectsMap.get(userId) || [];
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !filterRole || getRoleName(user.role) === filterRole;
      const matchesProject =
        !filterProject ||
        (filterProject === "unassigned"
          ? !userProjectsMap.has(user.id)
          : userProjectsMap.get(user.id)?.some((p) => p.id === filterProject));

      return matchesSearch && matchesRole && matchesProject;
    });
  }, [users, searchTerm, filterRole, filterProject, userProjectsMap]);

  const stats = useMemo(() => {
    const assigned = users.filter((u) => userProjectsMap.has(u.id)).length;
    return {
      total: users.length,
      totalProjects: projects.length,
      assigned,
      unassigned: users.length - assigned,
    };
  }, [users, projects, userProjectsMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Team Management
              </h1>
              <p className="text-gray-600">
                Create and assign users to your film projects
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <UserPlus className="w-5 h-5" />
              Create New User
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">Total Users</p>
                <Users className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">Total Projects</p>
                <Briefcase className="w-8 h-8 text-green-500 opacity-20" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalProjects}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">Assigned</p>
                <Check className="w-8 h-8 text-green-500 opacity-20" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.assigned}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">Unassigned</p>
                <X className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.unassigned}
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">All Roles</option>
                {AVAILABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[200px]">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">All Projects</option>
                <option value="unassigned">Unassigned Users</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          {(filterRole || filterProject || searchTerm) && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filterRole && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-2">
                  Role: {filterRole}
                  <button
                    onClick={() => setFilterRole("")}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterProject && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-2">
                  Project:{" "}
                  {filterProject === "unassigned"
                    ? "Unassigned"
                    : projects.find((p) => p.id === filterProject)?.title}
                  <button
                    onClick={() => setFilterProject("")}
                    className="hover:text-green-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-2">
                  Search: &quot;{searchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setFilterRole("");
                  setFilterProject("");
                  setSearchTerm("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    System Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assigned Projects
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const userProjects = getUserProjects(user.id);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {getRoleName(user.role)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {userProjects.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {userProjects.map((project) => {
                              const projectRole = getUserProjectRole(
                                user.id,
                                project.id
                              );
                              const isEditing =
                                editingUserProject?.userId === user.id &&
                                editingUserProject?.projectId === project.id;

                              return (
                                <div
                                  key={project.id}
                                  className="flex items-center justify-between gap-2 bg-gray-50 p-3 rounded border border-gray-200"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <Briefcase className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-gray-900 block">
                                        {project.title}
                                      </span>

                                      {isEditing ? (
                                        <div className="flex items-center gap-2 mt-2">
                                          <select
                                            value={editingRole}
                                            onChange={(e) =>
                                              setEditingRole(e.target.value)
                                            }
                                            className="px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {AVAILABLE_ROLES.map((role) => (
                                              <option key={role} value={role}>
                                                {role}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() =>
                                              handleUpdateProjectRole(
                                                user.id,
                                                project.id
                                              )
                                            }
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                          >
                                            <Save className="w-3 h-3" />
                                            Save
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingUserProject(null);
                                              setEditingRole("");
                                            }}
                                            className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                          <button
                                            onClick={() => {
                                              setEditingUserProject({
                                                userId: user.id,
                                                projectId: project.id,
                                              });
                                              setEditingRole(
                                                projectRole || "Admin"
                                              );
                                            }}
                                            className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded cursor-pointer hover:bg-green-200 transition-colors"
                                            title="Click to change role"
                                          >
                                            {projectRole || "No Role"}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {!isEditing && projectRole && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingUserProject({
                                            userId: user.id,
                                            projectId: project.id,
                                          });
                                          setEditingRole(projectRole);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit role"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRemoveFromProject(
                                            user.id,
                                            project.id
                                          )
                                        }
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Remove from project"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setShowAssignModal(true);
                          }}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {userProjects.length > 0
                            ? "Add to Project"
                            : "Assign to Project"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No users found</p>
                <p className="text-gray-400 text-sm">
                  {filterRole || filterProject || searchTerm
                    ? "Try adjusting your filters"
                    : "Create your first team member to get started"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-90vh overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New User
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateModal();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">
                    {successMessage}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {createError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700 font-medium">
                    {createError}
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                {/* System Role - Fixed as "User" */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Role
                  </label>
                  <input
                    type="text"
                    value="User"
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    All users are assigned &quot;User&quot; role.
                    Project-specific roles can be assigned after creation.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateModal();
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {createLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Project Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Assign to Project
                </h2>
                <p className="text-sm text-gray-500">
                  Select a project for{" "}
                  {users.find((u) => u.id === selectedUserId)?.name}
                </p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Click on a project to assign this user.
                Users can be assigned to multiple projects.
              </p>
            </div>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No projects available</p>
                </div>
              ) : (
                projects.map((project) => {
                  const userProjects = getUserProjects(selectedUserId);
                  const isAssigned = userProjects.some(
                    (p) => p.id === project.id
                  );
                  const projectRole = getUserProjectRole(
                    selectedUserId,
                    project.id
                  );
                  const isEditingThis =
                    editingUserProject?.userId === selectedUserId &&
                    editingUserProject?.projectId === project.id;

                  return (
                    <div
                      key={project.id}
                      className={`p-4 border rounded-lg transition-all ${
                        isAssigned
                          ? "bg-green-50 border-green-300"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {project.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {project.id.substring(0, 8)}...
                          </p>

                          {/* Show current assignment status */}
                          {isAssigned && projectRole && (
                            <div className="mt-2">
                              {isEditingThis ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={editingRole}
                                    onChange={(e) =>
                                      setEditingRole(e.target.value)
                                    }
                                    className="px-3 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {AVAILABLE_ROLES.map((role) => (
                                      <option key={role} value={role}>
                                        {role}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      handleUpdateProjectRole(
                                        selectedUserId,
                                        project.id
                                      );
                                      setShowAssignModal(false);
                                    }}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                  >
                                    <Save className="w-3 h-3" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUserProject(null);
                                      setEditingRole("");
                                    }}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingUserProject({
                                        userId: selectedUserId,
                                        projectId: project.id,
                                      });
                                      setEditingRole(projectRole);
                                    }}
                                    className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded cursor-pointer hover:bg-green-200 transition-colors"
                                    title="Click to change role"
                                  >
                                    {projectRole}
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleRemoveFromProject(
                                        selectedUserId,
                                        project.id
                                      );
                                      setShowAssignModal(false);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700 underline flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Assignment Button */}
                        <div className="flex-shrink-0">
                          {isAssigned ? (
                            <div className="flex flex-col items-end gap-2">
                              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
                                Assigned
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAssignToProject(project.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              Assign Here
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId("");
                  setEditingUserProject(null);
                  setEditingRole("");
                }}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

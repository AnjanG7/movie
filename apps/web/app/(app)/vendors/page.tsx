"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Building2, X, Save } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
  status: string;
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
  bankInfo?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    swiftCode?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  projectId: string;
  project?: {
    id: string;
    title: string;
  };
  purchaseOrders?: any[];
  invoices?: any[];
  createdAt: string;
  updatedAt: string;
}

interface VendorFormData {
  name: string;
  currency: string;
  bankInfo: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

export default function VendorsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    currency: "NPR",
    bankInfo: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      swiftCode: "",
    },
    contactInfo: {
      email: "",
      phone: "",
      address: "",
    },
  });

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?fetchAll=true`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const result = await response.json();
      const projectsList = result.data.projects || [];
      setProjects(projectsList);

      // Auto-select first project if available
      if (projectsList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch vendors for selected project
  const fetchVendors = async (projectId: string) => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/vendors/project/${projectId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }

      const result = await response.json();
      setVendors(result.data.vendors || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchVendors(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Handle project selection
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    setVendors([]);
  };

  // Create vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a project first");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/vendors/project/${selectedProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vendor");
      }

      await fetchVendors(selectedProjectId);
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update vendor
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !selectedProjectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/vendors/project/${selectedProjectId}/${editingVendor.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vendor");
      }

      await fetchVendors(selectedProjectId);
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete vendor
  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/vendors/project/${selectedProjectId}/${vendorId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete vendor");
      }

      await fetchVendors(selectedProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating
  const handleOpenCreateModal = () => {
    if (!selectedProjectId) {
      setError("Please select a project first");
      return;
    }
       const selectedProject = projects.find(p => p.id === selectedProjectId);
       const projectCurrency = selectedProject?.baseCurrency || 'USD';
  
    setEditingVendor(null);
    setFormData({
      name: "",
      currency: projectCurrency,
      bankInfo: {
        accountName: "",
        accountNumber: "",
        bankName: "",
        swiftCode: "",
      },
      contactInfo: {
        email: "",
        phone: "",
        address: "",
      },
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      currency: vendor.currency,
      bankInfo: {
        accountName: vendor.bankInfo?.accountName || "",
        accountNumber: vendor.bankInfo?.accountNumber || "",
        bankName: vendor.bankInfo?.bankName || "",
        swiftCode: vendor.bankInfo?.swiftCode || "",
      },
      contactInfo: {
        email: vendor.contactInfo?.email || "",
        phone: vendor.contactInfo?.phone || "",
        address: vendor.contactInfo?.address || "",
      },
    });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setError("");
  };

  // Handle basic input changes
  const handleBasicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle bank info changes
  const handleBankInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankInfo: {
        ...prev.bankInfo,
        [name]: value,
      },
    }));
  };

  // Handle contact info changes
  const handleContactInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [name]: value,
      },
    }));
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Project Selector */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-1">
              Manage vendors for your projects
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            disabled={!selectedProjectId}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Add Vendor
          </button>
        </div>

        {/* Project Selector */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project *
          </label>
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title} ({project.baseCurrency})
              </option>
            ))}
          </select>
          {selectedProject && (
            <p className="mt-2 text-sm text-gray-600">
              <strong>Status:</strong> {selectedProject.status} |{" "}
              <strong>Currency:</strong> {selectedProject.baseCurrency}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-800 hover:text-red-900"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && vendors.length === 0 && selectedProjectId && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading vendors...</div>
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProjectId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Project Selected
          </h3>
          <p className="text-gray-600">
            Please select a project to view and manage vendors
          </p>
        </div>
      )}

      {/* Vendors Grid */}
      {selectedProjectId && !loading && vendors.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No vendors yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first vendor
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Vendor
          </button>
        </div>
      )}

      {selectedProjectId && vendors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Vendor Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {vendor.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {vendor.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {vendor.contactInfo && (
                <div className="mb-4 space-y-2">
                  {vendor.contactInfo.email && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Email: </span>
                      <span className="text-gray-600">
                        {vendor.contactInfo.email}
                      </span>
                    </div>
                  )}
                  {vendor.contactInfo.phone && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Phone: </span>
                      <span className="text-gray-600">
                        {vendor.contactInfo.phone}
                      </span>
                    </div>
                  )}
                  {vendor.contactInfo.address && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">
                        Address:{" "}
                      </span>
                      <span className="text-gray-600">
                        {vendor.contactInfo.address}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Info */}
              {vendor.bankInfo?.bankName && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="text-sm text-gray-700">
                    <strong>Bank:</strong> {vendor.bankInfo.bankName}
                  </div>
                  {vendor.bankInfo.accountNumber && (
                    <div className="text-sm text-gray-600">
                      A/C: {vendor.bankInfo.accountNumber}
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">POs: </span>
                  <span className="font-semibold text-gray-900">
                    {vendor.purchaseOrders?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Invoices: </span>
                  <span className="font-semibold text-gray-900">
                    {vendor.invoices?.length || 0}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEditModal(vendor)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteVendor(vendor.id)}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVendor ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={editingVendor ? handleUpdateVendor : handleCreateVendor}
            >
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleBasicChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter vendor name"
                      />
                    </div>
                   
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.contactInfo.email}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="vendor@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.contactInfo.phone}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.contactInfo.address}
                        onChange={handleContactInfoChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter vendor address"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bank Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        value={formData.bankInfo.accountName}
                        onChange={handleBankInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Account holder name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.bankInfo.accountNumber}
                        onChange={handleBankInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankInfo.bankName}
                        onChange={handleBankInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SWIFT Code
                      </label>
                      <input
                        type="text"
                        name="swiftCode"
                        value={formData.bankInfo.swiftCode}
                        onChange={handleBankInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ABCDUS33XXX"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {loading
                    ? "Saving..."
                    : editingVendor
                      ? "Update Vendor"
                      : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

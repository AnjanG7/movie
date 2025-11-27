'use client';

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Vendor {
  id: string;
  name: string;
  currency: string;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
  } | null;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

interface VendorFormData {
  name: string;
  currency: string;
  bankName: string;
  accountNumber: string;
  swiftCode: string;
  iban: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    currency: 'USD',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setVendors(result.data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      alert('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => ({
    name: formData.name,
    currency: formData.currency,
    bankInfo: {
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      swiftCode: formData.swiftCode,
      iban: formData.iban,
    },
    contactInfo: {
      name: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    },
  });

  const handleCreateVendor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = buildPayload();
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        alert('Vendor created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchVendors();
      } else {
        alert(result.message || 'Failed to create vendor');
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
      alert('Failed to create vendor');
    }
  };

  const handleUpdateVendor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVendor) return;
    try {
      const payload = buildPayload();
      const response = await fetch(
        `${API_BASE_URL}/vendors/${selectedVendor.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (result.success) {
        alert('Vendor updated successfully');
        setShowEditModal(false);
        setSelectedVendor(null);
        resetForm();
        fetchVendors();
      } else {
        alert(result.message || 'Failed to update vendor');
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor');
    }
  };

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      currency: vendor.currency,
      bankName: vendor.bankInfo?.bankName || '',
      accountNumber: vendor.bankInfo?.accountNumber || '',
      swiftCode: vendor.bankInfo?.swiftCode || '',
      iban: vendor.bankInfo?.iban || '',
      contactName: vendor.contactInfo?.name || '',
      email: vendor.contactInfo?.email || '',
      phone: vendor.contactInfo?.phone || '',
      address: vendor.contactInfo?.address || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        alert('Vendor deleted successfully');
        fetchVendors();
      } else {
        alert(result.message || 'Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      currency: 'USD',
      bankName: '',
      accountNumber: '',
      swiftCode: '',
      iban: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderVendorForm = (isEdit: boolean) => (
    <form
      onSubmit={isEdit ? handleUpdateVendor : handleCreateVendor}
      className="space-y-6"
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Basic Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Vendor Name *
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleFormChange}
              required
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Currency *
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleFormChange}
              required
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="NPR">NPR - Nepali Rupee</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Contact Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Contact Name
            </label>
            <input
              name="contactName"
              type="text"
              value={formData.contactName}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Banking Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Bank Name
            </label>
            <input
              name="bankName"
              type="text"
              value={formData.bankName}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Account Number
            </label>
            <input
              name="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              SWIFT Code
            </label>
            <input
              name="swiftCode"
              type="text"
              value={formData.swiftCode}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              IBAN
            </label>
            <input
              name="iban"
              type="text"
              value={formData.iban}
              onChange={handleFormChange}
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setSelectedVendor(null);
            } else {
              setShowCreateModal(false);
            }
            resetForm();
          }}
          className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 h-9 rounded-lg bg-slate-900 text-white text-sm font-semibold"
        >
          {isEdit ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600">
              Manage production vendors, currencies, and banking details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 h-10 rounded-lg bg-slate-900 text-white text-sm font-semibold"
          >
            Add New Vendor
          </button>
        </div>

        {/* Create Vendor Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">Create New Vendor</h2>
              {renderVendorForm(false)}
            </div>
          </div>
        )}

        {/* Edit Vendor Modal */}
        {showEditModal && selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">Edit Vendor</h2>
              {renderVendorForm(true)}
            </div>
          </div>
        )}

        {/* Vendors Table */}
        {loading ? (
          <p className="text-center text-slate-600 mt-10">Loading vendors...</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left">Vendor Name</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-left">Contact Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Bank Name</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-600"
                    >
                      No vendors found. Click “Add New Vendor” to create one.
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-t hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 font-semibold">
                        {vendor.name}
                      </td>
                      <td className="px-4 py-2">{vendor.currency}</td>
                      <td className="px-4 py-2">
                        {vendor.contactInfo?.name || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {vendor.contactInfo?.email || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {vendor.contactInfo?.phone || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {vendor.bankInfo?.bankName || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(vendor)}
                          className="mr-2 px-3 h-8 rounded-md border border-slate-300 text-xs hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vendor.id)}
                          className="px-3 h-8 rounded-md border border-red-300 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {vendors.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
            <h3 className="font-semibold mb-1">Summary</h3>
            <p>Total Vendors: {vendors.length}</p>
            <p>
              Currencies:{' '}
              {Array.from(new Set(vendors.map((v) => v.currency))).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

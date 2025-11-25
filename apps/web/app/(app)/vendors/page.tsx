'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

interface Vendor {
  id: string;
  name: string;
  currency: string;
  bankInfo?: any;
  contactInfo?: any;
  createdAt: string;
  updatedAt?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
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
        setVendors(result.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      alert('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
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
    };

    try {
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

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    const payload = {
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
    };

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${selectedVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

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

  const renderVendorForm = (isEdit: boolean) => (
    <form onSubmit={isEdit ? handleUpdateVendor : handleCreateVendor}>
      <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Vendor Name: *
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Currency: *
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="NPR">NPR - Nepali Rupee</option>
          </select>
        </label>
      </div>

      <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Contact Information</h3>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Contact Name:
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) =>
              setFormData({ ...formData, contactName: e.target.value })
            }
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Email:
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Phone:
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Address:
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Banking Information</h3>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Bank Name:
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Account Number:
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) =>
              setFormData({ ...formData, accountNumber: e.target.value })
            }
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          SWIFT Code:
          <input
            type="text"
            value={formData.swiftCode}
            onChange={(e) =>
              setFormData({ ...formData, swiftCode: e.target.value })
            }
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          IBAN:
          <input
            type="text"
            value={formData.iban}
            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
        <button type="submit" style={{ padding: '10px 20px' }}>
          {isEdit ? 'Update Vendor' : 'Create Vendor'}
        </button>
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
          style={{ padding: '10px 20px' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Vendors</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '10px 20px' }}
        >
          Add New Vendor
        </button>
      </div>

      {/* Create Vendor Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              width: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h2>Create New Vendor</h2>
            {renderVendorForm(false)}
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && selectedVendor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              width: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h2>Edit Vendor</h2>
            {renderVendorForm(true)}
          </div>
        </div>
      )}

      {/* Vendors Table */}
      {loading ? (
        <p>Loading vendors...</p>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th>Vendor Name</th>
                <th>Currency</th>
                <th>Contact Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Bank Name</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                    No vendors found. Click "Add New Vendor" to create one.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>{vendor.name}</td>
                    <td>{vendor.currency}</td>
                    <td>{vendor.contactInfo?.name || '-'}</td>
                    <td>{vendor.contactInfo?.email || '-'}</td>
                    <td>{vendor.contactInfo?.phone || '-'}</td>
                    <td>{vendor.bankInfo?.bankName || '-'}</td>
                    <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleEditClick(vendor)}
                        style={{ marginRight: '5px', padding: '5px 10px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        style={{ padding: '5px 10px' }}
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

      {/* Summary Stats */}
      {vendors.length > 0 && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5' }}>
          <h3>Summary</h3>
          <p>Total Vendors: {vendors.length}</p>
          <p>
            Currencies:{' '}
            {Array.from(new Set(vendors.map((v) => v.currency))).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

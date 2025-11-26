'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:4000/api';

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Quotation {
  id: string;
  version: string;
  type: string;
  template?: string;
  total: number;
  createdAt: string;
  acceptedAt?: string;
}

export default function QuotationsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    template: 'FEATURE',
    versionNo: 'v1.0',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchQuotations();
    }
  }, [selectedProjectId]);

const fetchProjects = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects?limit=1000`, {
      credentials: 'include',
    });
    const result = await response.json();
    console.log('Projects response:', result); // Debug line
    if (result.success) {
      setProjects(result.data.projects);
      console.log('Projects loaded:', result.data.projects.length); // Debug line
    } else {
      console.error('API returned error:', result.message);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
};

  const fetchQuotations = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setQuotations(result.data);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

const handleCreateQuotation = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedProjectId) {
    alert('Please select a project first');
    return;
  }

  if (!formData.versionNo.trim()) {
    alert('Please enter a version number');
    return;
  }


  try {
    // Create payload with correct field name
    const payload = {
      template: formData.template,
      versionNo: formData.versionNo, // Backend expects 'versionNo' not 'version'
    };

    console.log('Sending payload:', payload); // Debug

    const response = await fetch(
      `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log('Create response:', result); // Debug
    
    if (result.success) {
      alert('Quotation created successfully');
      setShowCreateModal(false);
      setFormData({ template: 'FEATURE', versionNo: 'v1.0' });
      fetchQuotations();
    } else {
      alert(result.message || 'Failed to create quotation');
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    alert('Failed to create quotation');
  }
};

const handleDeleteQuotation = async (quotationId: string) => {
  if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${selectedProjectId}/quotations/${quotationId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    const result = await response.json();
    if (result.success) {
      alert('Quotation deleted successfully');
      fetchQuotations();
    } else {
      alert(result.message || 'Failed to delete quotation');
    }
  } catch (error) {
    console.error('Error deleting quotation:', error);
    alert('Failed to delete quotation');
  }
};

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Investor Quotations</h1>

      {/* Project Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>
          Select Project:
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="">-- Select Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        {selectedProjectId && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '8px 15px' }}
          >
            Create New Quotation
          </button>
        )}
      </div>

      {/* Create Modal */}
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
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              width: '500px',
              borderRadius: '8px',
            }}
          >
            <h2>Create New Quotation</h2>
            <form onSubmit={handleCreateQuotation}>
              <div style={{ marginBottom: '15px' }}>
                <label>
                  <strong>Template:</strong>
                  <select
                    value={formData.template}
                    onChange={(e) =>
                      setFormData({ ...formData, template: e.target.value })
                    }
                    required
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  >
                    <option value="FEATURE">Feature Film</option>
                    <option value="SERIES">TV Series</option>
                    <option value="SHORT">Short Film</option>
                  </select>
                </label>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {formData.template === 'FEATURE' && 'Standard feature film with 10% contingency'}
                  {formData.template === 'SERIES' && 'TV series with 8% contingency'}
                  {formData.template === 'SHORT' && 'Short film with 15% contingency'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Version Number:</strong>
                  <input
                    type="text"
                    value={formData.versionNo}
                    onChange={(e) =>
                      setFormData({ ...formData, versionNo: e.target.value })
                    }
                    required
                    placeholder="e.g., v1.0, v1.1, v2.0"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px' }}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotations Table */}
      {selectedProjectId && (
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : quotations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}
            >
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
                No quotations yet.
              </p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Create your first quotation to start planning project finances.
              </p>
            </div>
          ) : (
            <table
              border={1}
              cellPadding={10}
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th>Version</th>
                  <th>Template</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <strong>{quote.version}</strong>
                    </td>
                    <td>{quote.template || 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(quote.total)}</td>
                    <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                    <td>
                      {quote.acceptedAt ? (
                        <span
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#d4edda',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          Accepted
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          Draft
                        </span>
                      )}
                    </td>
                    <td>
                 
                      <button
                        onClick={() =>
                          router.push(
                            `/quotations/${quote.id}/view?projectId=${selectedProjectId}`
                          )
                        }
                        style={{ padding: '5px 10px' }}
                      >
                        View
                      </button>
                        <button
    onClick={() => handleDeleteQuotation(quote.id)}
    style={{ 
      padding: '5px 10px', 
      backgroundColor: '#ef4444', 
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '4px'
    }}
  >
    Delete
  </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

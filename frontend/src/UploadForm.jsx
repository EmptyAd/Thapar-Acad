import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Filter, SortAsc, User, Calendar, BookOpen, Plus, Loader2, ExternalLink } from 'lucide-react';

const ResearchPortal = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    department: '',
    journal: '',
    year: '',
    sortBy: 'publication_date',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    department: '',
    publication_date: '',
    journal: '',
    keywords: '',
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'browse', label: 'Browse Papers', icon: Search },
    { id: 'upload', label: 'Upload Paper', icon: Upload },
    { id: 'my-papers', label: 'My Papers', icon: FileText },
  ];

  // Fetch papers on component mount and when search changes
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchPapers();
    }
  }, [activeTab, searchQuery, searchFilters]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (searchFilters.department) {
        params.append('department', searchFilters.department);
      }
      if (searchFilters.journal) {
        params.append('journal', searchFilters.journal);
      }
      if (searchFilters.year) {
        params.append('year', searchFilters.year);
      }
      params.append('sort_by', searchFilters.sortBy);
      params.append('sort_order', searchFilters.sortOrder);
      params.append('limit', '50');

      const endpoint = searchQuery.trim() || Object.values(searchFilters).some(v => v) 
        ? `http://localhost:8000/search?${params.toString()}`
        : 'http://localhost:8000/papers';

      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setPapers(data.papers || []);
      } else {
        console.error('Error fetching papers:', data.error);
        setPapers([]);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      department: '',
      journal: '',
      year: '',
      sortBy: 'publication_date',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please upload a file');
      return;
    }

    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      payload.append(key, formData[key]);
    });
    payload.append('file', file);

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: payload,
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('Upload successful!');
        setFormData({
          title: '',
          authors: '',
          department: '',
          publication_date: '',
          journal: '',
          keywords: '',
        });
        setFile(null);
        // Refresh papers if we're on browse tab
        if (activeTab === 'browse') {
          fetchPapers();
        }
      } else {
        setMessage(`Upload failed: ${result.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).getFullYear().toString();
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0,
                marginRight: '48px'
              }}>
                Research Portal
              </h1>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '500px' }}>
                <Search style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#6b7280'
                }} />
                <input
                  type="text"
                  placeholder="Search papers, authors, keywords..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                {loading && (
                  <Loader2 style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#6b7280',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
                  color: showFilters ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <Filter style={{ width: '16px', height: '16px' }} />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={searchFilters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    placeholder="Filter by department"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Journal
                  </label>
                  <input
                    type="text"
                    value={searchFilters.journal}
                    onChange={(e) => handleFilterChange('journal', e.target.value)}
                    placeholder="Filter by journal"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Year
                  </label>
                  <input
                    type="text"
                    value={searchFilters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    placeholder="Filter by year"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Sort By
                  </label>
                  <select
                    value={searchFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="publication_date">Publication Date</option>
                    <option value="title">Title</option>
                    <option value="authors">Authors</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Order
                  </label>
                  <select
                    value={searchFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 24px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                    borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'browse' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                Browse Research Papers
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  {papers.length > 0 ? `Found ${papers.length} papers` : 'Discover and explore research papers from various fields'}
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <Loader2 style={{ width: '48px', height: '48px', color: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280' }}>Loading papers...</p>
              </div>
            ) : papers.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <Search style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  No papers found
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                  Try adjusting your search query or filters
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {papers.map((paper, index) => (
                  <div key={paper.id || index} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '24px',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '8px',
                          lineHeight: '1.4'
                        }}>
                          {paper.title}
                        </h3>
                        <p style={{ color: '#059669', fontSize: '14px', marginBottom: '8px' }}>
                          {paper.authors}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                          <span>{paper.journal}</span>
                          <span>•</span>
                          <span>{formatDate(paper.publication_date)}</span>
                          <span>•</span>
                          <span>{paper.department}</span>
                        </div>
                        {paper.keywords && (
                          <p style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>
                            Keywords: {paper.keywords}
                          </p>
                        )}
                      </div>
                      {paper.file_url && (
                        <a
                          href={paper.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginLeft: '16px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink style={{ width: '14px', height: '14px' }} />
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                Upload Research Paper
              </h2>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                Share your research with the academic community
              </p>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '32px'
            }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                  {['title', 'authors', 'department', 'publication_date', 'journal', 'keywords'].map((field) => (
                    <div key={field}>
                      <label style={{
                        display: 'block',
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <input
                        type={field === 'publication_date' ? 'date' : 'text'}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '16px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          backgroundColor: '#ffffff',
                          color: '#1f2937'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        placeholder={field === 'keywords' ? 'machine learning, AI, neural networks...' : `Enter ${field.replace('_', ' ').toLowerCase()}...`}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Upload PDF File
                  </label>
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        backgroundColor: '#ffffff',
                        color: '#1f2937'
                      }}
                      required
                    />
                    {file && (
                      <p style={{ color: '#059669', marginTop: '12px', fontWeight: '500' }}>
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto'
                    }}
                  >
                    {loading && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                    {loading ? 'Uploading...' : 'Upload Paper'}
                  </button>
                </div>
              </form>

              {message && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: message.includes('successful') ? '#dcfce7' : '#fee2e2',
                  border: message.includes('successful') ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  color: message.includes('successful') ? '#16a34a' : '#dc2626'
                }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'my-papers' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                My Papers
              </h2>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                Manage your uploaded research papers
              </p>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <FileText style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                No papers uploaded yet
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Upload your first research paper to get started
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Upload Paper
              </button>
            </div>
          </div>
        )}
      </main>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ResearchPortal;
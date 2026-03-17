import React, { useState } from 'react';
import AdminReviews from './adminReviews';
import AdminReports from './adminReports';
import AdminSuspiciousUsers from './adminSuspiciousUsers';
import AdminUsers from './adminUsers';
import '../css/AdminPanel.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (!currentUser || currentUser.uloga !== 'administrator') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3 style={{ color: '#dc3545' }}>Nemate pristup admin panelu</h3>
        <p>Samo administratori mogu pristupiti ovom panelu.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'reviews':
        return <AdminReviews />;
      case 'reports':
        return <AdminReports adminId={currentUser.id} />;
      case 'suspicious':
        return <AdminSuspiciousUsers adminId={currentUser.id} />;
      case 'users':
        return <AdminUsers />;
      default:
        return <AdminReviews />;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          📝 Recenzije
        </button>
        <button
          className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          ⚠️ Prijave
        </button>
        <button
          className={`admin-tab ${activeTab === 'suspicious' ? 'active' : ''}`}
          onClick={() => setActiveTab('suspicious')}
        >
          🔍 Sumnjivi korisnici
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Korisnici
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
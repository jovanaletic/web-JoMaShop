import React, { useState, useEffect } from 'react';
import { getSuspiciousUsers, blockUserAdmin } from '../services/adminService';

const AdminSuspiciousUsers = () => {
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSuspiciousUsers();
  }, []);

  const fetchSuspiciousUsers = async () => {
    try {
      setLoading(true);
      const response = await getSuspiciousUsers();
      setSuspiciousUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching suspicious users:', error);
      alert('Greška pri učitavanju sumnjivih korisnika');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, userName) => {
    if (window.confirm(`Da li ste sigurni da želite da blokirate korisnika ${userName}?`)) {
      try {
        setProcessing(true);
        await blockUserAdmin(userId);
        alert(`Korisnik ${userName} je blokiran`);
        fetchSuspiciousUsers();
      } catch (error) {
        console.error('Error blocking user:', error);
        alert('Greška pri blokiranju korisnika');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (loading) {
    return <div className="admin-loading">Učitavanje sumnjivih korisnika...</div>;
  }

  return (
    <div className="admin-suspicious-users">
      <h2>Sumnjivi korisnici ({suspiciousUsers.length})</h2>
      <p className="info-text">
        Korisnici koji su otkazali 5 ili više porudžbina u poslednjih 30 dana
      </p>
      
      {suspiciousUsers.length === 0 ? (
        <p className="no-data">Nema sumnjivih korisnika.</p>
      ) : (
        <div className="suspicious-users-grid">
          {suspiciousUsers.map(user => (
            <div key={user.id} className="suspicious-user-card">
              <div className="user-header">
                <div className="user-avatar">
                  {user.profilnaSlika ? (
                    <img src={`http://localhost:5000${user.profilnaSlika}`} alt={user.ime} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.ime.charAt(0)}{user.prezime.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <h3>{user.ime} {user.prezime}</h3>
                  <p className="username">@{user.korisnickoIme}</p>
                  <p className="email">{user.email}</p>
                </div>
              </div>
              
              <div className="user-stats">
                <div className="stat-item warning">
                  <span className="stat-icon">⚠️</span>
                  <div>
                    <strong>{user.cancellationCount}</strong>
                    <span>otkazivanja</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <div>
                    <strong>Poslednje:</strong>
                    <span>{new Date(user.lastCancellation).toLocaleDateString('sr-RS')}</span>
                  </div>
                </div>
              </div>
              
              <div className="user-actions">
                {user.blokiran ? (
                  <span className="blocked-badge">✓ Blokiran</span>
                ) : (
                  <button
                    onClick={() => handleBlockUser(user.id, `${user.ime} ${user.prezime}`)}
                    className="block-btn"
                    disabled={processing}
                  >
                    Blokiraj korisnika
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSuspiciousUsers;
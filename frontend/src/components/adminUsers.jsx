import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/users');
      setUsers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm('Da li ste sigurni da želite da blokirate ovog korisnika?')) {
      try {
        await axios.post(`http://localhost:5000/admin/users/${userId}/block`);
        alert('Korisnik je blokiran');
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.error || 'Greška pri blokiranju korisnika');
      }
    }
  };

  const handleUnblockUser = async (userId) => {
    if (window.confirm('Da li ste sigurni da želite da odblokirate ovog korisnika?')) {
      try {
        await axios.post(`http://localhost:5000/admin/users/${userId}/unblock`);
        alert('Korisnik je odblokiran');
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.error || 'Greška pri odblokiranju korisnika');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.korisnickoIme.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.uloga === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !user.blokiran) ||
      (statusFilter === 'blocked' && user.blokiran);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) return <div className="admin-loading">Učitavanje korisnika...</div>;

  return (
    <div>
      <div className="users-filters">
        <input
          type="text"
          placeholder="Pretraži po imenu, email-u ili korisničkom imenu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Sve uloge</option>
          <option value="kupac">Kupac</option>
          <option value="prodavac">Prodavac</option>
          <option value="administrator">Administrator</option>
        </select>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Svi statusi</option>
          <option value="active">Aktivni</option>
          <option value="blocked">Blokirani</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="no-data">Nema korisnika</p>
      ) : (
        <div className="users-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Korisnik</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Uloga</th>
                <th>Status</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.blokiran ? 'blocked-row' : ''}>
                  <td>
                    <div 
                      className="user-name-cell" 
                      onClick={() => navigate(`/profile/${user.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {user.profilnaSlika ? (
                        <img 
                          src={`http://localhost:5000${user.profilnaSlika}`} 
                          alt={user.ime}
                          className="user-avatar-small"
                        />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {user.ime.charAt(0)}{user.prezime.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#c71585' }}>
                          {user.ime} {user.prezime}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          @{user.korisnickoIme}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.telefon}</td>
                  <td>
                    <span className={`role-badge ${user.uloga}`}>
                      {user.uloga}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.blokiran ? 'blocked' : 'active'}`}>
                      {user.blokiran ? 'Blokiran' : 'Aktivan'}
                    </span>
                  </td>
                  <td>
                    {user.uloga !== 'administrator' && (
                      <div className="action-buttons">
                        {user.blokiran ? (
                          <button
                            className="unblock-btn-small"
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            Odblokiraj
                          </button>
                        ) : (
                          <button
                            className="block-btn-small"
                            onClick={() => handleBlockUser(user.id)}
                          >
                            Blokiraj
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
import React, { useState, useEffect } from 'react';
import { getPendingReports } from '../services/reportService';
import { getUserById } from '../services/userService';
import { acceptReport, rejectReport } from '../services/adminService';

const AdminReports = ({ adminId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getPendingReports();
      
      const enrichedReports = await Promise.all(
        response.data.map(async (report) => {
          try {
            const reporterResponse = await getUserById(report.reporterId);
            const reportedResponse = await getUserById(report.reportedUserId);
            
            return {
              ...report,
              reporterName: reporterResponse.data ? `${reporterResponse.data.ime} ${reporterResponse.data.prezime}` : 'Nepoznat',
              reportedName: reportedResponse.data ? `${reportedResponse.data.ime} ${reportedResponse.data.prezime}` : 'Nepoznat'
            };
          } catch (error) {
            return {
              ...report,
              reporterName: 'Nepoznat',
              reportedName: 'Nepoznat'
            };
          }
        })
      );
      
      setReports(enrichedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Greška pri učitavanju prijava');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reportId) => {
    if (window.confirm('Da li ste sigurni da želite da prihvatite ovu prijavu? Korisnik će biti blokiran i svi njegovi proizvodi obrisani.')) {
      try {
        setProcessing(true);
        await acceptReport(reportId, adminId);
        alert('Prijava prihvaćena. Korisnik je blokiran.');
        fetchReports();
      } catch (error) {
        console.error('Error accepting report:', error);
        alert(error.response?.data?.error || 'Greška pri prihvatanju prijave');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Morate uneti razlog odbijanja');
      return;
    }

    try {
      setProcessing(true);
      await rejectReport(selectedReport.id, adminId, rejectionReason.trim());
      alert('Prijava odbijena');
      setSelectedReport(null);
      setRejectionReason('');
      fetchReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert(error.response?.data?.error || 'Greška pri odbijanju prijave');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Učitavanje prijava...</div>;
  }

  return (
    <div className="admin-reports">
      <h2>Prijave na čekanju ({reports.length})</h2>
      
      {reports.length === 0 ? (
        <p className="no-data">Nema prijava na čekanju.</p>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <span className="report-id">Prijava #{report.id}</span>
                <span className="report-date">{new Date(report.createdAt).toLocaleDateString('sr-RS')}</span>
              </div>
              
              <div className="report-info">
                <div className="info-row">
                  <strong>Prijavljuje:</strong> {report.reporterName}
                </div>
                <div className="info-row">
                  <strong>Prijavljeni korisnik:</strong> {report.reportedName}
                </div>
                <div className="info-row reason">
                  <strong>Razlog:</strong>
                  <p>{report.reason}</p>
                </div>
              </div>
              
              <div className="report-actions">
                <button
                  onClick={() => handleAccept(report.id)}
                  className="accept-btn"
                  disabled={processing}
                >
                  ✓ Prihvati
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setRejectionReason('');
                  }}
                  className="reject-btn"
                  disabled={processing}
                >
                  ✗ Odbij
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') {
            setSelectedReport(null);
            setRejectionReason('');
          }
        }}>
          <div className="modal-content">
            <h3>Odbijanje prijave #{selectedReport.id}</h3>
            <p className="modal-subtitle">Unesite razlog odbijanja prijave:</p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Razlog odbijanja..."
              className="rejection-textarea"
              rows="5"
              autoFocus
            />
            
            <div className="modal-actions">
              <button
                onClick={handleReject}
                className="modal-submit-btn"
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Odbijam...' : 'Odbij prijavu'}
              </button>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setRejectionReason('');
                }}
                className="modal-cancel-btn"
                disabled={processing}
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
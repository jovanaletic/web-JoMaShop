import React, { useState, useEffect } from 'react';
import { getAllReviews, updateReview, deleteReview } from '../services/adminService';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: '' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await getAllReviews();
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Greška pri učitavanju recenzija');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment || ''
    });
  };

  const handleSaveEdit = async (reviewId) => {
    try {
      await updateReview(reviewId, editForm);
      alert('Recenzija uspešno izmenjena');
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Greška pri izmeni recenzije');
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovu recenziju?')) {
      try {
        await deleteReview(reviewId);
        alert('Recenzija uspešno obrisana');
        fetchReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Greška pri brisanju recenzije');
      }
    }
  };

  if (loading) {
    return <div className="admin-loading">Učitavanje recenzija...</div>;
  }

  return (
    <div className="admin-reviews">
      <h2>Sve recenzije ({reviews.length})</h2>
      
      {reviews.length === 0 ? (
        <p className="no-data">Nema recenzija u sistemu.</p>
      ) : (
        <div className="reviews-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Proizvod</th>
                <th>Ocena</th>
                <th>Komentar</th>
                <th>Od</th>
                <th>Za</th>
                <th>Datum</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>{review.productName}</td>
                  <td>
                    {editingReview === review.id ? (
                      <select
                        value={editForm.rating}
                        onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) })}
                        className="edit-select"
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num} ⭐</option>
                        ))}
                      </select>
                    ) : (
                      <span className="rating-stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < review.rating ? '#ff69b4' : '#ddd' }}>
                            ★
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingReview === review.id ? (
                      <textarea
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        className="edit-textarea"
                        rows="3"
                      />
                    ) : (
                      <span className="review-comment">{review.comment || 'Bez komentara'}</span>
                    )}
                  </td>
                  <td>{review.reviewerRole === 'buyer' ? review.buyerName : review.sellerName}</td>
                  <td>{review.reviewerRole === 'buyer' ? review.sellerName : review.buyerName}</td>
                  <td>{new Date(review.dateCreated).toLocaleDateString('sr-RS')}</td>
                  <td>
                    <div className="action-buttons">
                      {editingReview === review.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(review.id)}
                            className="save-btn-small"
                          >
                            Sačuvaj
                          </button>
                          <button
                            onClick={() => setEditingReview(null)}
                            className="cancel-btn-small"
                          >
                            Otkaži
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(review)}
                            className="edit-btn-small"
                          >
                            Izmeni
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="delete-btn-small"
                          >
                            Obriši
                          </button>
                        </>
                      )}
                    </div>
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

export default AdminReviews;
class Report {
  constructor(id, reporterId, reportedUserId, reason, status = 'pending', createdAt = new Date().toISOString()) {
    this.id = id;
    this.reporterId = reporterId; // ID korisnika koji podnosi prijavu
    this.reportedUserId = reportedUserId; // ID prijavljenog korisnika
    this.reason = reason; // Razlog prijave
    this.status = status; // 'pending', 'reviewed', 'resolved', 'rejected'
    this.createdAt = createdAt;
    this.reviewedAt = null;
    this.reviewedBy = null; // ID administratora koji je pregledao
    this.adminNote = null; // Napomena administratora
  }
}

module.exports = Report;
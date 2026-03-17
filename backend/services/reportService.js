const fs = require("fs");
const path = require("path");
const Report = require("../model/report");

const reportsFile = path.join(__dirname, "..", "data", "reports.json");

function loadReports() {
  if (!fs.existsSync(reportsFile)) {
    const dir = path.dirname(reportsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(reportsFile, JSON.stringify([]));
    return [];
  }
  return JSON.parse(fs.readFileSync(reportsFile));
}

function saveReports(reports) {
  fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
}

function createReport(reporterId, reportedUserId, reason) {
  const reports = loadReports();
  
  const maxId = reports.length > 0
    ? Math.max(...reports.map(r => Number(r.id)))
    : 0;

  const newReport = new Report(
    maxId + 1,
    reporterId,
    reportedUserId,
    reason
  );

  reports.push(newReport);
  saveReports(reports);

  return newReport;
}

function getAllReports() {
  return loadReports();
}

function getReportById(id) {
  const reports = loadReports();
  return reports.find(r => r.id == id);
}

function getReportsByReporter(reporterId) {
  const reports = loadReports();
  return reports.filter(r => r.reporterId == reporterId);
}

function getReportsByReportedUser(reportedUserId) {
  const reports = loadReports();
  return reports.filter(r => r.reportedUserId == reportedUserId);
}

function getPendingReports() {
  const reports = loadReports();
  return reports.filter(r => r.status === 'pending');
}

function updateReportStatus(id, status, adminId, adminNote) {
  const reports = loadReports();
  const report = reports.find(r => r.id == id);

  if (!report) return null;

  report.status = status;
  report.reviewedAt = new Date().toISOString();
  report.reviewedBy = adminId;
  if (adminNote) report.adminNote = adminNote;

  saveReports(reports);
  return report;
}

function deleteReport(id) {
  const reports = loadReports();
  const index = reports.findIndex(r => r.id == id);

  if (index === -1) return null;

  const deletedReport = reports.splice(index, 1)[0];
  saveReports(reports);

  return deletedReport;
}

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  getReportsByReporter,
  getReportsByReportedUser,
  getPendingReports,
  updateReportStatus,
  deleteReport
};
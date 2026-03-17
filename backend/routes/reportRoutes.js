const express = require("express");
const router = express.Router();
const reportService = require("../services/reportService");
const userService = require("../services/userService");
const { sendUserReportNotification } = require("../services/emailService");

// Kreiranje nove prijave
router.post("/", async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason } = req.body;

    if (!reporterId || !reportedUserId || !reason) {
      return res.status(400).json({ error: "Svi podaci su obavezni" });
    }

    // Provera da li korisnici postoje
    const reporter = userService.getUserById(reporterId);
    const reportedUser = userService.getUserById(reportedUserId);

    if (!reporter) {
      return res.status(404).json({ error: "Korisnik koji prijavljuje nije pronađen" });
    }

    if (!reportedUser) {
      return res.status(404).json({ error: "Prijavljeni korisnik nije pronađen" });
    }

    // Provera da korisnik ne može prijaviti sam sebe
    if (reporterId == reportedUserId) {
      return res.status(400).json({ error: "Ne možete prijaviti sami sebe" });
    }

    const newReport = reportService.createReport(reporterId, reportedUserId, reason);
    
    // Slanje email obaveštenja prijavljenom korisniku
    await sendUserReportNotification(reportedUserId, reporterId, reason);
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dobavljanje svih prijava (samo za administratora)
router.get("/", (req, res) => {
  try {
    const reports = reportService.getAllReports();
    res.json(reports);
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dobavljanje prijava na čekanju (za administratora)
router.get("/pending", (req, res) => {
  try {
    const reports = reportService.getPendingReports();
    res.json(reports);
  } catch (error) {
    console.error("Get pending reports error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dobavljanje prijave po ID-u
router.get("/:id", (req, res) => {
  try {
    const report = reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Prijava nije pronađena" });
    }
    res.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dobavljanje prijava koje je podneo određeni korisnik
router.get("/by-reporter/:reporterId", (req, res) => {
  try {
    const reports = reportService.getReportsByReporter(req.params.reporterId);
    res.json(reports);
  } catch (error) {
    console.error("Get reports by reporter error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dobavljanje prijava protiv određenog korisnika
router.get("/against-user/:reportedUserId", (req, res) => {
  try {
    const reports = reportService.getReportsByReportedUser(req.params.reportedUserId);
    res.json(reports);
  } catch (error) {
    console.error("Get reports against user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Ažuriranje statusa prijave (za administratora)
router.put("/:id/status", (req, res) => {
  try {
    const { status, adminId, adminNote } = req.body;

    if (!status || !adminId) {
      return res.status(400).json({ error: "Status i ID administratora su obavezni" });
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Nevažeći status" });
    }

    const updatedReport = reportService.updateReportStatus(
      req.params.id,
      status,
      adminId,
      adminNote
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Prijava nije pronađena" });
    }

    res.json(updatedReport);
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Brisanje prijave
router.delete("/:id", (req, res) => {
  try {
    const deleted = reportService.deleteReport(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Prijava nije pronađena" });
    }
    res.json({ message: "Prijava uspešno obrisana" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
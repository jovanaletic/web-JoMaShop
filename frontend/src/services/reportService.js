import axios from 'axios';

const API_URL = 'http://localhost:5000/reports';

export const createReport = (reportData) => {
  return axios.post(API_URL, reportData);
};

export const getAllReports = () => {
  return axios.get(API_URL);
};

export const getPendingReports = () => {
  return axios.get(`${API_URL}/pending`);
};

export const getReportById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

export const getReportsByReporter = (reporterId) => {
  return axios.get(`${API_URL}/by-reporter/${reporterId}`);
};

export const getReportsAgainstUser = (reportedUserId) => {
  return axios.get(`${API_URL}/against-user/${reportedUserId}`);
};

export const updateReportStatus = (id, statusData) => {
  return axios.put(`${API_URL}/${id}/status`, statusData);
};

export const deleteReport = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};
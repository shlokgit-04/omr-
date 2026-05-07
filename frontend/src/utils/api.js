import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Exams
export const getExams = () => API.get('/exams');
export const getExam = (id) => API.get(`/exams/${id}`);
export const createExam = (data) => API.post('/exams', data);
export const deleteExam = (id) => API.delete(`/exams/${id}`);

// Students
export const getStudents = (examId) => API.get(`/students?examId=${examId}`);
export const getStudent = (id) => API.get(`/students/${id}`);
export const submitStudent = (data) => API.post('/students', data);
export const deleteStudent = (id) => API.delete(`/students/${id}`);

// Export
export const getExportUrl = (examId) => `http://localhost:5000/api/export/${examId}`;

export default API;

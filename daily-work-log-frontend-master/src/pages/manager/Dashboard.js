import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaFileDownload, FaSearch, FaCheck } from 'react-icons/fa';
import { logService, projectService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Alert } from 'react-bootstrap';


const ManagerDashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    project: '',
    status: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchProjects();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logService.getAllLogs(filters);
      setLogs(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load daily logs. Please try again.');
      toast.error('Failed to load daily logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAllProjects();
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to load projects');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleApproveLog = async (id) => {
    try {
      await logService.approveLog(id);
      toast.success('Log approved successfully');
      fetchLogs(); // Refresh the list
    } catch (err) {
      console.error('Error approving log:', err);
      toast.error('Failed to approve log');
    }
  };

  const handleExportToPdf = async (id) => {
    try {
      const response = await logService.exportLogToPdf(id);
      
      // Create a blob from the PDF stream
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link element to download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily-log-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      toast.error('Failed to export PDF');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge bg="secondary">Draft</Badge>;
      case 'submitted':
        return <Badge bg="primary">Submitted</Badge>;
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Manager Dashboard</h2>
          <p className="text-muted">Welcome back, {user?.fullName}</p>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filter Logs</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={applyFilters}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Project</Form.Label>
                  <Form.Select
                    name="project"
                    value={filters.project}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Projects</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" variant="primary">
              <FaSearch className="me-1" /> Apply Filters
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Daily Work Logs</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <p className="text-center">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center">No logs found matching your criteria.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Team Leader</th>
                  <th>Project</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{moment(log.date).format('MMM DD, YYYY')}</td>
                    <td>{log.teamLeader.fullName}</td>
                    <td>{log.project.name}</td>
                    <td>
                      {moment(log.startTime).format('HH:mm')} - {moment(log.endTime).format('HH:mm')}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td>
                      <Button
                        as={Link}
                        to={`/log-details/${log._id}`}
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                      >
                        <FaEye />
                      </Button>
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleExportToPdf(log._id)}
                      >
                        <FaFileDownload />
                      </Button>
                      
                      {log.status === 'submitted' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleApproveLog(log._id)}
                        >
                          <FaCheck />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ManagerDashboard;

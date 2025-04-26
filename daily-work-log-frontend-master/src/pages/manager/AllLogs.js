import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaFileDownload, FaSearch, FaCheck, FaFilter } from 'react-icons/fa';
import { logService, projectService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const AllLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    project: '',
    status: '',
    teamLeader: '',
    searchTerm: ''
  });
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchProjects();
    fetchTeamLeaders();
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

  const fetchTeamLeaders = async () => {
    try {
      // This would be a new endpoint in your API to get all team leaders
      const response = await logService.getTeamLeaders();
      setTeamLeaders(response.data);
    } catch (err) {
      console.error('Error fetching team leaders:', err);
      toast.error('Failed to load team leaders');
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

  const resetFilters = () => {
    setFilters({
      startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD'),
      project: '',
      status: '',
      teamLeader: '',
      searchTerm: ''
    });
    // Fetch logs with reset filters
    setTimeout(fetchLogs, 0);
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
          <h2>All Daily Work Logs</h2>
          <p className="text-muted">View and manage all team logs</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            onClick={() => setShowFilters(!showFilters)}
            className="mb-2"
          >
            <FaFilter className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Col>
      </Row>

      {showFilters && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Filter Logs</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={applyFilters}>
              <Row>
                <Col md={6} lg={3}>
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
                <Col md={6} lg={3}>
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
                <Col md={6} lg={3}>
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
                <Col md={6} lg={3}>
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
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Team Leader</Form.Label>
                    <Form.Select
                      name="teamLeader"
                      value={filters.teamLeader}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Team Leaders</option>
                      {teamLeaders.map(leader => (
                        <option key={leader._id} value={leader._id}>
                          {leader.fullName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search in work descriptions..."
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                      />
                      <Button variant="outline-secondary" type="submit">
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button type="submit" variant="primary">
                  Apply Filters
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
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

export default AllLogs;

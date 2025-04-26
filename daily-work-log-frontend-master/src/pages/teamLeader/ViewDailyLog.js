import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Alert, Carousel } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaEdit, FaArrowLeft, FaDownload, FaCheck } from 'react-icons/fa';
import { logService } from '../../services/apiService';
import { toast } from 'react-toastify';
import moment from 'moment';

const ViewDailyLog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const response = await logService.getLogById(id);
      setLog(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching log:', err);
      setError('Failed to load the daily log. Please try again.');
      toast.error('Failed to load daily log');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLog = async () => {
    try {
      await logService.submitLog(id);
      toast.success('Log submitted successfully');
      fetchLog(); // Refresh the log data
    } catch (err) {
      console.error('Error submitting log:', err);
      toast.error('Failed to submit log');
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

  if (loading) {
    return <Container><p className="text-center">Loading log details...</p></Container>;
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!log) {
    return (
      <Container>
        <Alert variant="warning">Log not found</Alert>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/')}>
            <FaArrowLeft className="me-1" /> Back to Dashboard
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h2>Daily Work Log Details</h2>
          <div className="d-flex align-items-center">
            <p className="text-muted mb-0 me-2">
              Status: {getStatusBadge(log.status)}
            </p>
            {log.status === 'draft' && (
              <>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  as={Link}
                  to={`/edit-log/${log._id}`}
                >
                  <FaEdit className="me-1" /> Edit
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handleSubmitLog}
                >
                  <FaCheck className="me-1" /> Submit
                </Button>
              </>
            )}
          </div>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">General Information</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Date:</strong> {moment(log.date).format('MMMM D, YYYY')}</p>
              <p><strong>Project:</strong> {log.project.name}</p>
              <p><strong>Location:</strong> {log.project.address}</p>
            </Col>
            <Col md={6}>
              <p><strong>Team Leader:</strong> {log.teamLeader.fullName}</p>
              <p><strong>Work Hours:</strong> {moment(log.startTime).format('h:mm A')} - {moment(log.endTime).format('h:mm A')}</p>
              <p><strong>Weather:</strong> {log.weather || 'Not specified'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Employees Present</h5>
        </Card.Header>
        <Card.Body>
          {log.employees.length === 0 ? (
            <p className="text-muted">No employees recorded for this log</p>
          ) : (
            <ul className="list-unstyled">
              {log.employees.map(employee => (
                <li key={employee._id}>{employee.fullName}</li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Work Description</h5>
        </Card.Header>
        <Card.Body>
          <p>{log.workDescription}</p>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Issues Encountered</h5>
            </Card.Header>
            <Card.Body>
              <p>{log.issuesEncountered || 'No issues reported'}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Next Steps</h5>
            </Card.Header>
            <Card.Body>
              <p>{log.nextSteps || 'No next steps specified'}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {log.materialsUsed && log.materialsUsed.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Materials Used</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped bordered hover>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {log.materialsUsed.map((material, index) => (
                  <tr key={index}>
                    <td>{material.name}</td>
                    <td>{material.quantity}</td>
                    <td>{material.unit}</td>
                    <td>{material.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {log.photos && log.photos.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Photos</h5>
          </Card.Header>
          <Card.Body>
            <Carousel>
              {log.photos.map((photo, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100"
                    src={photo.path}
                    alt={`Site photo ${index + 1}`}
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                  <Carousel.Caption>
                    <p>{photo.description || `Photo ${index + 1}`}</p>
                  </Carousel.Caption>
                </Carousel.Item>
              ))}
            </Carousel>
          </Card.Body>
        </Card>
      )}

      {log.documents && log.documents.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Documents</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {log.documents.map((doc, index) => (
                  <tr key={index}>
                    <td>{doc.originalName}</td>
                    <td>
                      {doc.type === 'delivery_note' && 'Delivery Note'}
                      {doc.type === 'receipt' && 'Receipt'}
                      {doc.type === 'invoice' && 'Invoice'}
                      {doc.type === 'other' && 'Other'}
                    </td>
                    <td>{moment(doc.uploadedAt).format('MMM D, YYYY h:mm A')}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        href={doc.path}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaDownload className="me-1" /> Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Log History</h5>
        </Card.Header>
        <Card.Body>
          <p><strong>Created:</strong> {moment(log.createdAt).format('MMMM D, YYYY h:mm A')}</p>
          <p><strong>Last Updated:</strong> {moment(log.updatedAt).format('MMMM D, YYYY h:mm A')}</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ViewDailyLog;

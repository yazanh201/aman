import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { authService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const initialValues = {
    fullName: '',
    email: '',
    password: '',
    role: 'Team Leader'
  };

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    role: Yup.string().required('Role is required')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');
    try {
      await authService.register(values);
      toast.success('User registered successfully!');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Body className="p-5">
              <h2 className="text-center mb-4">Create New Account</h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                {({
                  values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={values.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.fullName && errors.fullName}
                      />
                      <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.password && errors.password}
                      />
                      <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Role</Form.Label>
                      <Form.Select
                        name="role"
                        value={values.role}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <option value="Team Leader">Team Leader</option>
                        <option value="Manager">Manager</option>
                      </Form.Select>
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={isSubmitting} className="w-100">
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;

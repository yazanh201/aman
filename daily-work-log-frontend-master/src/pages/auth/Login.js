import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useAuth();
  const [error, setError] = useState('');

  // ✅ Updated validation schema (no email format check)
  const validationSchema = Yup.object({
    email: Yup.string().required('Email is required'),
    password: Yup.string().required('Password is required')
  });

  // ✅ Updated initial values (correct field names)
  const initialValues = {
    email: '',
    password: ''
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');
    try {
      const result = await login(values);
      if (!result.success) {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Login failed. Please try again.');
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
              <div className="text-center mb-4">
                <h2 className="fw-bold">Daily Work Log System</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="text"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.password && errors.password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-100 py-2"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
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

export default Login;

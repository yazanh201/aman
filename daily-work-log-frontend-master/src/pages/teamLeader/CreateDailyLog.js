import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { logService } from '../../services/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as fileService from '../../services/fileService'; // 👈 חובה

const CreateDailyLog = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const validationSchema = Yup.object({
    date: Yup.date().required('יש להזין תאריך'),
    project: Yup.string().required('יש להזין שם פרויקט'),
    employees: Yup.array().min(1, 'יש להזין לפחות עובד אחד'),
    startTime: Yup.date().required('יש להזין שעת התחלה'),
    endTime: Yup.date()
      .required('יש להזין שעת סיום')
      .test('is-after-start', 'שעת הסיום חייבת להיות לאחר שעת ההתחלה', function (value) {
        const { startTime } = this.parent;
        return !startTime || !value || value > startTime;
      }),
    workDescription: Yup.string().required('יש להזין תיאור עבודה'),
    deliveryCertificate: Yup.mixed().required('יש לצרף תעודת משלוח')
  });

  const initialValues = {
    date: new Date(),
    project: '',
    employees: [''],
    startTime: new Date(new Date().setHours(8, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    workDescription: '',
    deliveryCertificate: null
  };

  const minSelectableTime = new Date();
  minSelectableTime.setHours(7, 0, 0, 0);
  const maxSelectableTime = new Date();
  maxSelectableTime.setHours(20, 0, 0, 0);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formattedValues = {
        ...values,
        date: new Date(values.date).toISOString(),
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString()
      };

      const response = await logService.createLog(formattedValues);
      const logId = response.data._id;

      if (values.deliveryCertificate) {
        const formData = new FormData();
        formData.append('certificate', values.deliveryCertificate);
        await fileService.uploadCertificate(logId, formData);
      }

      toast.success('דו"ח עבודה יומי נוצר בהצלחה');
      navigate('/');
    } catch (err) {
      console.error('שגיאה ביצירת דו"ח:', err);
      setError('נכשל ביצירת דו"ח. אנא נסה שוב.');
      toast.error('נכשל ביצירת דו"ח');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container dir="rtl">
      <Row className="mb-4">
        <Col>
          <h2>יצירת דו"ח עבודה יומי</h2>
          <p className="text-muted">נא למלא את פרטי העבודה שבוצעה היום</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
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
              setFieldValue,
              isSubmitting
            }) => (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>תאריך</Form.Label>
                      <DatePicker
                        selected={values.date}
                        onChange={(date) => setFieldValue('date', date)}
                        className={`form-control ${touched.date && errors.date ? 'is-invalid' : ''}`}
                        dateFormat="dd/MM/yyyy"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>שם פרויקט</Form.Label>
                      <Form.Control
                        type="text"
                        name="project"
                        value={values.project}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.project && errors.project}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>עובדים נוכחים</Form.Label>
                  {values.employees.map((employee, index) => (
                    <Row key={index} className="mb-2">
                      <Col xs={10}>
                        <Form.Control
                          type="text"
                          name={`employees[${index}]`}
                          value={employee}
                          onChange={handleChange}
                          placeholder="שם העובד"
                        />
                      </Col>
                      <Col xs={2}>
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            const updated = [...values.employees];
                            updated.splice(index, 1);
                            setFieldValue('employees', updated);
                          }}
                        >
                          ✕
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Button
                    variant="outline-primary"
                    onClick={() => setFieldValue('employees', [...values.employees, ''])}
                  >
                    הוסף עובד
                  </Button>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>שעת התחלה</Form.Label>
                      <DatePicker
                        selected={values.startTime}
                        onChange={(time) => setFieldValue('startTime', time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="שעה"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        minTime={minSelectableTime}
                        maxTime={maxSelectableTime}
                        className={`form-control text-end ${touched.startTime && errors.startTime ? 'is-invalid' : ''}`}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>שעת סיום</Form.Label>
                      <DatePicker
                        selected={values.endTime}
                        onChange={(time) => setFieldValue('endTime', time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="שעה"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        minTime={minSelectableTime}
                        maxTime={maxSelectableTime}
                        className={`form-control text-end ${touched.endTime && errors.endTime ? 'is-invalid' : ''}`}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>תיאור העבודה</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="workDescription"
                    value={values.workDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.workDescription && errors.workDescription}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>תעודת משלוח</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFieldValue('deliveryCertificate', e.currentTarget.files[0])}
                    className={touched.deliveryCertificate && errors.deliveryCertificate ? 'is-invalid' : ''}
                  />
                  {touched.deliveryCertificate && errors.deliveryCertificate && (
                    <div className="invalid-feedback d-block">{errors.deliveryCertificate}</div>
                  )}
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate('/')}>ביטול</Button>
                  <div>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                      className="me-2"
                    >
                      {isSubmitting ? 'שומר...' : 'שמור כטיוטה'}
                    </Button>
                    <Button
                      variant="success"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'שולח...' : 'שמור ושלח'}
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateDailyLog;

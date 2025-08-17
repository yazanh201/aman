import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { logService } from '../../services/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const pad2 = (n) => String(n).padStart(2, '0');

/** ---------- פורמט חדש: Select אחד ל-HH:MM ברבעי שעה + Select לשניות ---------- */
const QuarterHourSelectTimePicker = ({ label, value, onChange }) => {
  // value הוא Date
  const h = value ? value.getHours() : 0;
  const m = value ? value.getMinutes() : 0;
  const s = value ? value.getSeconds() : 0;

  // מייצר אפשרויות HH:MM ב-15 דק
  const hhmmOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    [0, 15, 30, 45].forEach((min) => {
      hhmmOptions.push({ label: `${pad2(hour)}:${pad2(min)}`, hour, min });
    });
  }

  const seconds = Array.from({ length: 60 }, (_, i) => i);

  const handleHHMMChange = (e) => {
    const [HH, MM] = e.target.value.split(':').map(Number);
    const next = value ? new Date(value) : new Date();
    next.setHours(HH, MM, s, 0);
    onChange(next);
  };

  const handleSecChange = (e) => {
    const sec = Number(e.target.value);
    const next = value ? new Date(value) : new Date();
    next.setSeconds(sec);
    next.setMilliseconds(0);
    onChange(next);
  };

  const currentHHMM = `${pad2(h)}:${pad2(m - (m % 15))}`; // מעגל ל-רבע שעה הקרוב מטה להצגה

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Row className="g-2">
        <Col xs={8}>
          <Form.Select value={currentHHMM} onChange={handleHHMMChange}>
            {hhmmOptions.map(({ label, hour, min }) => (
              <option key={`${hour}-${min}`} value={`${pad2(hour)}:${pad2(min)}`}>
                {label}
              </option>
            ))}
          </Form.Select>
          {/* <div className="form-text">בחירה בקפיצות של רבע שעה</div> */}
        </Col>
        <Col xs={4}>
          {/* <Form.Select value={s} onChange={handleSecChange}>
            {seconds.map((sec) => (
              <option key={sec} value={sec}>
                {pad2(sec)} שניות
              </option>
            ))}
          </Form.Select>
          <div className="form-text">שניות</div> */}
        </Col>
      </Row>
    </Form.Group>
  );
};

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
    deliveryCertificate: Yup.mixed().nullable(),
    workPhotos: Yup.mixed().nullable()
  });

  const initialValues = {
    date: new Date(),
    project: '',
    employees: [''],
    startTime: new Date(new Date().setHours(8, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    workDescription: '',
    deliveryCertificate: null,
    workPhotos: []
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { deliveryCertificate, workPhotos, ...restValues } = values;

      const formattedValues = {
        ...restValues,
        date: new Date(values.date).toISOString(),
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString()
      };

      const formData = new FormData();
      Object.keys(formattedValues).forEach(key => {
        if (key === 'employees') {
          formData.append(key, JSON.stringify(formattedValues[key]));
        } else {
          formData.append(key, formattedValues[key]);
        }
      });

      if (deliveryCertificate) {
        formData.append('deliveryCertificate', deliveryCertificate);
      }

      if (workPhotos && workPhotos.length > 0) {
        workPhotos.forEach(photo => formData.append('workPhotos', photo));
      }

      await logService.createLog(formData);

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
                        isInvalid={touched.project && !!errors.project}
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
                    {/* בחירת שעת התחלה — פורמט חדש */}
                    <QuarterHourSelectTimePicker
                      label="שעת התחלה"
                      value={values.startTime}
                      onChange={(d) => setFieldValue('startTime', d)}
                    />
                    {touched.startTime && errors.startTime && (
                      <div className="invalid-feedback d-block">{errors.startTime}</div>
                    )}
                  </Col>
                  <Col md={6}>
                    {/* בחירת שעת סיום — פורמט חדש */}
                    <QuarterHourSelectTimePicker
                      label="שעת סיום"
                      value={values.endTime}
                      onChange={(d) => setFieldValue('endTime', d)}
                    />
                    {touched.endTime && errors.endTime && (
                      <div className="invalid-feedback d-block">{errors.endTime}</div>
                    )}
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
                    isInvalid={touched.workDescription && !!errors.workDescription}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>תעודת משלוח</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFieldValue('deliveryCertificate', e.currentTarget.files[0])}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>צרף תמונות</Form.Label>
                  <Form.Control
                    type="file"
                    name="workPhotos"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files);
                      setFieldValue('workPhotos', files);
                    }}
                  />
                  {values.workPhotos.length > 0 && (
                    <ul className="mt-2">
                      {values.workPhotos.map((file, i) => (
                        <li key={i}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => navigate('/')}>ביטול</Button>
                  <div>
                    <Button variant="success" type="submit" disabled={isSubmitting}>
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

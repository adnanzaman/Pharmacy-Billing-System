import React, {
  useEffect,
  useState
} from 'react';

import { createRoot } from 'react-dom/client';

import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Statistic,
  Typography,
  message,
  Tag,
  Space,
  InputNumber,
  AutoComplete,
  Popconfirm,
  Descriptions,
  Checkbox,
  Tabs
} from 'antd';

import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  EyeOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  BankOutlined,
  DollarOutlined,
  CalculatorOutlined
} from '@ant-design/icons';

import 'antd/dist/reset.css';
import './styles.css';

import { API, money, getErrorMessage, normalizeList, dateTime, localYmd } from './common';
import Reports from './reports/ReportsPage.jsx';


/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {

  const [loading, setLoading] =
    useState(false);


  const submitLogin = async values => {

    setLoading(true);

    try {

      const response =
        await API.post(
          '/auth/login',
          values
        );


      localStorage.setItem(
        'xmart_token',
        response.data.token
      );


      onLogin(
        response.data.user
      );

    } catch (error) {

      message.error(
        error.response?.data?.message ||
        'Login failed. Please check your email and password.'
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="login-page">

      <div className="login-hero">

        <div className="hero-content">

          <div className="hero-logo">
            <span>+</span>
          </div>

          <div className="hero-brand">
          </div>

          <div className="hero-line" />

          <h1>
            Punjab
            <br />
            Hospital
          </h1>

          <p>
            Manage patients, pharmacy, inventory,
            purchases, sales and accounts from one
            powerful hospital platform.
          </p>

          <div className="hero-features">

            <div>
              <span>✓</span>
              Patient Management
            </div>

            <div>
              <span>✓</span>
              Pharmacy & Inventory
            </div>

            <div>
              <span>✓</span>
              Accounts & Reports
            </div>

          </div>

        </div>

        <div className="hero-footer">
          Punjab Hospital ERP
        </div>

      </div>


      <div className="login-panel">

        <div className="login-wrapper">

          <div className="mobile-logo">

            <div className="mobile-logo-icon">
         
            </div>

            <div>

              <div className="mobile-brand">
       
              </div>

              <div className="mobile-brand-subtitle">
        
              </div>

            </div>

          </div>


          <div className="login-heading">

            <div className="login-badge">
              SECURE LOGIN
            </div>

            <Typography.Title
              level={1}
              className="login-title"
            >
              Welcome Back
            </Typography.Title>

            <Typography.Text
              className="login-subtitle"
            >
              Sign in to access your hospital dashboard.
            </Typography.Text>

          </div>


          <Card
            className="login-card"
            bordered={false}
          >

            <Form
              layout="vertical"
              initialValues={{
                email: 'admin@gmail.com',
                password: 'Admin@123'
              }}
              onFinish={submitLogin}
            >

              <Form.Item
                name="email"
                label="Email address"
                rules={[
                  {
                    required: true,
                    message:
                      'Please enter your email'
                  }
                ]}
              >

                <Input
                  size="large"
                  placeholder="admin@gmail.com"
                  prefix={
                    <span className="input-icon">
                      @
                    </span>
                  }
                />

              </Form.Item>


              <Form.Item
                name="password"
                label="Password"
                rules={[
                  {
                    required: true,
                    message:
                      'Please enter your password'
                  }
                ]}
              >

                <Input.Password
                  size="large"
                  placeholder="Enter your password"
                  prefix={
                    <span className="input-icon">
                      ●
                    </span>
                  }
                />

              </Form.Item>


              <div className="login-options">

                <span>
                  Hospital Administration
                </span>

                <span className="secure-text">
                  🔒 Secure
                </span>

              </div>


              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="login-button"
              >

                {
                  loading
                    ? 'Signing in...'
                    : 'Sign in to dashboard'
                }

                {!loading && (
                  <span className="login-arrow">
                    →
                  </span>
                )}

              </Button>

            </Form>

          </Card>


          <div className="login-services">

            <div>
              <span>●</span>
              Patients
            </div>

            <div>
              <span>●</span>
              Pharmacy
            </div>

            <div>
              <span>●</span>
              Inventory
            </div>

            <div>
              <span>●</span>
              Accounts
            </div>

          </div>


          <div className="login-copyright">
            © {new Date().getFullYear()} Xmart Solutions LLC
          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function TrendGraph({ data }) {
  const w = 640, h = 160, pad = 8;
  if (!data || !data.length) return <div style={{ height: h, color: 'var(--text-muted)' }}>No sale data yet</div>;
  const max = Math.max(1, ...data.map(d => d.total));
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.total / max) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} width="100%" height={h + 20} preserveAspectRatio="none">
      <path d={area} fill="var(--primary-red)" opacity="0.08" />
      <path d={line} fill="none" stroke="var(--primary-red)" strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill="var(--primary-red)" opacity={i === pts.length - 1 ? 1 : 0.35} />
      ))}
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={pad + i * stepX} y={h + 14} fontSize="9" textAnchor="middle" fill="var(--text-muted)">
            {d.date.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}

function DashStat({ title, value, money: isMoney, sub, tone }) {
  return (
    <Card size="small" className={tone ? `card-variant-${tone}` : undefined}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: tone ? 'inherit' : 'var(--text-muted)', opacity: tone ? 0.85 : 1 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{isMoney ? money(value) : Number(value || 0).toLocaleString()}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function DashboardCalculator({ open, onClose }) {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (!open) return;
    setExpr('');
    setResult('');
  }, [open]);

  const calculate = () => {
    const clean = String(expr || '').replace(/,/g, '').trim();
    if (!clean) return;
    if (!/^[0-9+\-*/().%\s]+$/.test(clean)) { setResult('Invalid'); return; }
    try {
      const value = Function(`"use strict"; return (${clean})`)();
      setResult(Number.isFinite(value) ? String(Number(value.toFixed(10))) : 'Invalid');
    } catch { setResult('Invalid'); }
  };
  const press = key => {
    if (key === 'C') { setExpr(''); setResult(''); return; }
    if (key === '=') { calculate(); return; }
    if (key === '⌫') { setExpr(v => v.slice(0, -1)); return; }
    setExpr(v => `${v}${key}`);
  };
  const keys = [['7','8','9','/'],['4','5','6','*'],['1','2','3','-'],['0','.','%','+'],['C','⌫','(',')'],['=']];
  return (
    <Modal title="Calculator" open={open} onCancel={onClose} footer={null} width={360} destroyOnClose>
      <Input autoFocus value={expr} onChange={e => setExpr(e.target.value)} onPressEnter={calculate} placeholder="Example: 5*200-20" style={{ marginBottom: 8, fontSize: 18, textAlign: 'right' }} />
      <div style={{ minHeight: 32, textAlign: 'right', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{result}</div>
      <Row gutter={[8,8]}>{keys.flat().map(k => <Col key={k} span={k === '=' ? 24 : 6}><Button block size="large" type={k === '=' ? 'primary' : 'default'} onClick={() => press(k)}>{k}</Button></Col>)}</Row>
    </Modal>
  );
}

function Dashboard({ onNavigate, onWorkspaceChange, onAddTransaction }) {
  const [d, setD] = useState({});
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dashboard, trendRes] = await Promise.all([
        API.get('/dashboard/summary'),
        API.get('/dashboard/trend', { params: { days: 30 } })
      ]);
      setD(dashboard.data);
      setTrend(trendRes.data);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener('xmart:data-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('xmart:data-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);


  const changeUp = d.saleChangePercent != null && d.saleChangePercent >= 0;
  // shortcuts are added here as each new report is built
  const quickReports = [
    ['Sale Report', 'reports:sale'],
    ['Purchase Report', 'reports:purchase'],
    ['Stock Report', 'reports:stock_summary'],
    ['Profit & Loss', 'reports:profit_loss'],
    ['Cash Flow', 'reports:cash_flow'],
    ['Day Book', 'reports:daybook']
  ];

  return (
    <>
      <div className="page-head">
        <Typography.Title>Dashboard</Typography.Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onAddTransaction?.('sale')}>
             Add Sale
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => onAddTransaction?.('purchase')}>
             Add Purchase
          </Button>
          <Button icon={<CalculatorOutlined />} onClick={() => setCalculatorOpen(true)}>
             Calculator
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card loading={loading}>
                <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Total Receivable</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>{money(d.totalReceivable)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>From {d.receivableParties || 0} Parties</div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card loading={loading}>
                <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Total Payable</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>{money(d.totalPayable)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>From {d.payableParties || 0} Parties</div>
              </Card>
            </Col>
            <Col span={24}>
              <Card loading={loading}>
                <Row justify="space-between" align="top" wrap>
                  <Col>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Total Sale</div>
                    <Space align="baseline" size={10}>
                      <span style={{ fontSize: 26, fontWeight: 900 }}>{money(d.totalSaleThisMonth)}</span>
                      {d.saleChangePercent != null && (
                        <Tag color={changeUp ? 'green' : 'red'}>
                          {Math.abs(d.saleChangePercent)}% {changeUp ? 'more' : 'less'} than last month
                        </Tag>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Tag>This Month</Tag>
                  </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                  <TrendGraph data={trend} />
                </div>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={24}>
              <DashStat title="Purchases · This Month" value={d.totalPurchaseThisMonth} money tone="orange" />
            </Col>
            <Col xs={12} lg={24}>
              <DashStat title="Expenses · This Month" value={d.totalExpenseThisMonth} money tone="dark" />
            </Col>
            <Col xs={12} lg={24}>
              <DashStat title="Stock Value · As of Now" value={d.stockValue} money />
            </Col>
            <Col xs={12} lg={24}>
              <DashStat title="Cash In Hand · As of Now" value={d.cashInHand} money />
            </Col>
            <Col xs={12} lg={24}>
              <DashStat title="Total Bank Balance · As of Now" value={d.bankBalance} money />
            </Col>
          </Row>
        </Col>
      </Row>

      {(Number(d.lowStock) > 0 || Number(d.expiry90Days) > 0) && (
        <Card style={{ marginTop: 16 }} size="small">
          <Space wrap>
            {Number(d.lowStock) > 0 && (
              <Tag color="warning" onClick={() => onNavigate && onNavigate('medicines')} style={{ cursor: 'pointer' }}>
                {d.lowStock} item(s) low on stock
              </Tag>
            )}
            {Number(d.expiry90Days) > 0 && (
              <Tag color="volcano" onClick={() => onNavigate && onNavigate('reports')} style={{ cursor: 'pointer' }}>
                {d.expiry90Days} batch(es) expiring within 90 days
              </Tag>
            )}
          </Space>
        </Card>
      )}

      <Card title="Most Used Reports" style={{ marginTop: 16 }} size="small">
        <Space wrap>
          {quickReports.map(([label, target]) => (
            <Button key={label} onClick={() => onNavigate && onNavigate(target)}>
              {label}
            </Button>
          ))}
        </Space>
      </Card>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
        Need help? <b>Xmart Solution</b> · 0332-8327729
      </div>
      <DashboardCalculator open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </>
  );
}


/* =========================================================
   PATIENTS
========================================================= */

function Patients() {

  const [data, setData] =
    useState([]);

  const [q, setQ] =
    useState('');

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [visits, setVisits] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [form] =
    Form.useForm();

  const [doctors, setDoctors] =
    useState([]);

  const [deps, setDeps] =
    useState([]);


  const load = async () => {

    setLoading(true);

    try {

      const response =
        await API.get(
          '/patients',
          {
            params: { q }
          }
        );


      setData(
        response.data
      );

    } catch (error) {

      message.error(
        error.response?.data?.message ||
        'Could not load patients'
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    load();

  }, [q]);


  useEffect(() => {

    const loadLookups =
      async () => {

        try {

          const [
            doctorsResponse,
            departmentsResponse
          ] = await Promise.all([

            API.get(
              '/lookups/doctors'
            ),

            API.get(
              '/lookups/departments'
            )

          ]);


          setDoctors(
            doctorsResponse.data
          );

          setDeps(
            departmentsResponse.data
          );

        } catch (error) {

          message.error(
            'Could not load doctors/departments'
          );

        }

      };


    loadLookups();

  }, []);


  const openAdd = () => {

    setEditing(null);

    form.resetFields();

    form.setFieldsValue({

      gender: 'Other',

      registration_fee: 0,

      discount: 0,

      paid: 0

    });

    setOpen(true);

  };


  const openEdit = patient => {

    setEditing(patient);

    form.setFieldsValue({

      name:
        patient.name,

      father_husband_name:
        patient.father_husband_name,

      cnic:
        patient.cnic,

      gender:
        patient.gender,

      dob:
        patient.dob
          ? String(
              patient.dob
            ).substring(0, 10)
          : undefined,

      mobile:
        patient.mobile,

      blood_group:
        patient.blood_group,

      emergency_contact:
        patient.emergency_contact,

      address:
        patient.address

    });

    setOpen(true);

  };


  const savePatient = async values => {

    try {

      if (editing) {

        await API.put(
          `/patients/${editing.id}`,
          values
        );

        message.success(
          'Patient updated successfully'
        );

      } else {

        const response =
          await API.post(
            '/patients',
            values
          );

        message.success(
          `Registered ${response.data.patient_no}`
        );

      }


      setOpen(false);

      setEditing(null);

      form.resetFields();

      await load();

    } catch (error) {

      message.error(
        error.response?.data?.message ||
        'Could not save patient'
      );

    }

  };


  const deletePatient = async id => {

    try {

      await API.delete(
        `/patients/${id}`
      );

      message.success(
        'Patient deleted successfully'
      );

      await load();

    } catch (error) {

      message.error(
        error.response?.data?.message ||
        'Could not delete patient'
      );

    }

  };


  const showVisits = async patient => {

    try {

      const response =
        await API.get(
          `/patients/${patient.id}/visits`
        );


      setVisits({

        patient,

        rows:
          response.data

      });

    } catch (error) {

      message.error(
        error.response?.data?.message ||
        'Could not load visits'
      );

    }

  };


  const columns = [

    {
      title: 'Patient No',
      dataIndex: 'patient_no',
      width: 150
    },

    {
      title: 'Name',
      dataIndex: 'name',
      width: 180
    },

    {
      title: 'Father / Husband',
      dataIndex:
        'father_husband_name',
      width: 170
    },

    {
      title: 'Mobile',
      dataIndex: 'mobile',
      width: 130
    },

    {
      title: 'CNIC',
      dataIndex: 'cnic',
      width: 150
    },

    {
      title: 'Gender',
      dataIndex: 'gender',
      width: 90
    },

    {
      title: 'Visits',
      dataIndex: 'visit_count',
      width: 80
    },

    {
      title: 'Action',
      fixed: 'right',
      width: 300,

      render: (_, patient) => (

        <Space wrap>

          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              openEdit(patient)
            }
          >
            Edit
          </Button>


          <Popconfirm

            title="Delete patient?"

            description="The patient will be deactivated and historical records will remain safe."

            okText="Delete"

            cancelText="Cancel"

            onConfirm={() =>
              deletePatient(
                patient.id
              )
            }

          >

            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>

          </Popconfirm>


          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              showVisits(patient)
            }
          >
            Visits
          </Button>


          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() =>
              printPatient(patient)
            }
          >
            Print
          </Button>

        </Space>

      )

    }

  ];


  return (

    <>

      <div className="page-head">

        <div>

          <Typography.Title>
            Patients
          </Typography.Title>

          <Input.Search

            placeholder="Search name, patient no, mobile or CNIC"

            allowClear

            onSearch={setQ}

            style={{
              width: 360,
              maxWidth: '100%'
            }}

          />

        </div>


        <Space>

          <Button
            icon={<ReloadOutlined />}
            onClick={load}
            loading={loading}
          >
            Refresh
          </Button>


          <Button
            type="primary"
            onClick={openAdd}
          >
            + Register Patient
          </Button>

        </Space>

      </div>


      <Table

        rowKey="id"

        loading={loading}

        dataSource={data}

        columns={columns}

        scroll={{
          x: 1400
        }}

      />


      <Modal

        title={
          editing
            ? 'Edit Patient'
            : 'Patient Registration'
        }

        open={open}

        onCancel={() => {

          setOpen(false);

          setEditing(null);

          form.resetFields();

        }}

        footer={null}

        width={800}

      >

        <Form
          form={form}
          layout="vertical"
          onFinish={savePatient}
        >

          <Row gutter={12}>

            <Col span={12}>

              <Form.Item
                name="name"
                label="Patient Name"
                rules={[
                  {
                    required: true,
                    message:
                      'Patient name is required'
                  }
                ]}
              >

                <Input />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item
                name="father_husband_name"
                label="Father / Husband"
              >

                <Input />

              </Form.Item>

            </Col>


            <Col span={8}>

              <Form.Item
                name="cnic"
                label="CNIC"
              >

                <Input
                  placeholder="xxxxx-xxxxxxx-x"
                />

              </Form.Item>

            </Col>


            <Col span={8}>

              <Form.Item
                name="gender"
                label="Gender"
              >

                <Select
                  options={[
                    {
                      label: 'Male',
                      value: 'Male'
                    },
                    {
                      label: 'Female',
                      value: 'Female'
                    },
                    {
                      label: 'Other',
                      value: 'Other'
                    }
                  ]}
                />

              </Form.Item>

            </Col>


            <Col span={8}>

              <Form.Item
                name="dob"
                label="DOB"
              >

                <Input type="date" />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item
                name="mobile"
                label="Mobile"
              >

                <Input />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item
                name="blood_group"
                label="Blood Group"
              >

                <Input
                  placeholder="e.g. B+"
                />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item
                name="department_id"
                label="Department"
              >

                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={
                    deps.map(
                      item => ({
                        label: item.name,
                        value: item.id
                      })
                    )
                  }
                />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item
                name="doctor_id"
                label="Doctor"
              >

                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={
                    doctors.map(
                      item => ({
                        label: item.name,
                        value: item.id
                      })
                    )
                  }
                />

              </Form.Item>

            </Col>


            {!editing && (

              <>

                <Col span={8}>

                  <Form.Item
                    name="registration_fee"
                    label="Registration Fee"
                  >

                    <InputNumber
                      min={0}
                      style={{
                        width: '100%'
                      }}
                    />

                  </Form.Item>

                </Col>


                <Col span={8}>

                  <Form.Item
                    name="discount"
                    label="Discount"
                  >

                    <InputNumber
                      min={0}
                      style={{
                        width: '100%'
                      }}
                    />

                  </Form.Item>

                </Col>


                <Col span={8}>

                  <Form.Item
                    name="paid"
                    label="Paid"
                  >

                    <InputNumber
                      min={0}
                      style={{
                        width: '100%'
                      }}
                    />

                  </Form.Item>

                </Col>

              </>

            )}


            <Col span={24}>

              <Form.Item
                name="emergency_contact"
                label="Emergency Contact"
              >

                <Input />

              </Form.Item>

            </Col>


            <Col span={24}>

              <Form.Item
                name="address"
                label="Address"
              >

                <Input.TextArea rows={3} />

              </Form.Item>

            </Col>

          </Row>


          <Space>

            <Button
              type="primary"
              htmlType="submit"
            >
              {
                editing
                  ? 'Update Patient'
                  : 'Save & Register Visit'
              }
            </Button>


            <Button
              onClick={() => {

                setOpen(false);

                setEditing(null);

                form.resetFields();

              }}
            >
              Cancel
            </Button>

          </Space>

        </Form>

      </Modal>


      <Modal

        title={
          visits
            ? `Visits — ${visits.patient.name}`
            : 'Visits'
        }

        open={!!visits}

        onCancel={() =>
          setVisits(null)
        }

        footer={null}

        width={850}

      >

        <Table

          size="small"

          rowKey="id"

          dataSource={
            visits?.rows || []
          }

          columns={[

            {
              title: 'Date',
              dataIndex: 'visit_date'
            },

            {
              title: 'Doctor',
              dataIndex: 'doctor_name'
            },

            {
              title: 'Department',
              dataIndex:
                'department_name'
            },

            {
              title: 'Fee',
              dataIndex:
                'registration_fee',
              render: money
            },

            {
              title: 'Discount',
              dataIndex:
                'discount',
              render: money
            },

            {
              title: 'Paid',
              dataIndex: 'paid',
              render: money
            }

          ]}

        />

      </Modal>

    </>

  );

}


/* =========================================================
   PRINT PATIENT
========================================================= */

function printPatient(patient) {

  const windowObject =
    window.open(
      '',
      '_blank',
      'width=800,height=700'
    );


  if (!windowObject) {

    message.error(
      'Please allow popups to print'
    );

    return;

  }


  windowObject.document.write(`

    <html>

      <head>

        <title>
          Patient Registration Slip
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 30px;
          }

          h1 {
            margin-bottom: 5px;
          }

          .subtitle {
            margin-bottom: 20px;
          }

          .box {
            border: 1px solid #333;
            padding: 20px;
          }

          .row {
            display: flex;
            margin-bottom: 10px;
          }

          .label {
            width: 180px;
            font-weight: bold;
          }

          .footer {
            margin-top: 30px;
            font-size: 12px;
          }

        </style>

      </head>

      <body>

        <h1>
          Punjab Hospital
        </h1>

        <div class="subtitle">
          Patient Registration Slip
        </div>

        <div class="box">

          <div class="row">
            <div class="label">
              Patient No:
            </div>
            <div>
              ${patient.patient_no || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              Patient Name:
            </div>
            <div>
              ${patient.name || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              Father / Husband:
            </div>
            <div>
              ${patient.father_husband_name || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              CNIC:
            </div>
            <div>
              ${patient.cnic || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              Mobile:
            </div>
            <div>
              ${patient.mobile || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              Gender:
            </div>
            <div>
              ${patient.gender || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              Blood Group:
            </div>
            <div>
              ${patient.blood_group || ''}
            </div>
          </div>

          <div class="row">
            <div class="label">
              Address:
            </div>
            <div>
              ${patient.address || ''}
            </div>
          </div>

        </div>

        <div class="footer">
          Punjab Hospital
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>

      </body>

    </html>

  `);


  windowObject.document.close();

}


/* =========================================================
   DOCTORS
========================================================= */

function Doctors() {
  const [data,setData]=useState([]); const [open,setOpen]=useState(false); const [view,setView]=useState(null); const [editing,setEditing]=useState(null); const [form]=Form.useForm(); const [departments,setDepartments]=useState([]);
  const load=async()=>{const [d,dep]=await Promise.all([API.get('/doctors'),API.get('/lookups/departments')]);setData(normalizeList(d.data));setDepartments(normalizeList(dep.data));};
  useEffect(()=>{load().catch(e=>message.error(getErrorMessage(e)))},[]);
  const edit=async row=>{const r=await API.get(`/doctors/${row.id}`);setEditing(r.data);form.setFieldsValue(r.data);setOpen(true)};
  const save=async v=>{try{if(editing)await API.put(`/doctors/${editing.id}`,v);else await API.post('/doctors',v);message.success(editing?'Doctor updated successfully':'Doctor added successfully');setOpen(false);setEditing(null);form.resetFields();load()}catch(e){message.error(getErrorMessage(e))}};
  const remove=async id=>{try{await API.delete(`/doctors/${id}`);message.success('Doctor deleted/deactivated');load()}catch(e){message.error(getErrorMessage(e))}};
  return <><div className="page-head"><Typography.Title>Doctors</Typography.Title><Button type="primary" icon={<PlusOutlined/>} onClick={()=>{setEditing(null);form.resetFields();setOpen(true)}}>Add Doctor</Button></div>
    <Table rowKey="id" dataSource={data} columns={[{title:'Code',dataIndex:'doctor_code'},{title:'Doctor',dataIndex:'name'},{title:'Qualification',dataIndex:'qualification'},{title:'Speciality',dataIndex:'speciality'},{title:'Department',dataIndex:'department_name'},{title:'Fee',dataIndex:'consultation_fee',render:money},{title:'Status',render:(_,r)=><Tag color={r.is_active?'green':'red'}>{r.is_active?'Active':'Inactive'}</Tag>},{title:'Actions',render:(_,r)=><Space><Button size="small" icon={<EyeOutlined/>} onClick={()=>setView(r)}>View</Button><Button size="small" icon={<EditOutlined/>} onClick={()=>edit(r)}>Edit</Button><Popconfirm title="Delete/deactivate this doctor?" onConfirm={()=>remove(r.id)}><Button size="small" danger icon={<DeleteOutlined/>}>Delete</Button></Popconfirm></Space>}]} pagination={{pageSize:10,showSizeChanger:true}} />
    <Modal title={editing?'Edit Doctor':'Add Doctor'} open={open} onCancel={()=>setOpen(false)} footer={null} destroyOnClose><Form form={form} layout="vertical" onFinish={save}><Row gutter={16}><Col span={12}><Form.Item name="doctor_code" label="Doctor Code" rules={[{required:true}]}><Input/></Form.Item></Col><Col span={12}><Form.Item name="name" label="Doctor Name" rules={[{required:true}]}><Input/></Form.Item></Col><Col span={12}><Form.Item name="qualification" label="Qualification"><Input/></Form.Item></Col><Col span={12}><Form.Item name="speciality" label="Speciality"><Input/></Form.Item></Col><Col span={12}><Form.Item name="department_id" label="Department"><Select allowClear options={departments.map(x=>({label:x.name,value:x.id}))}/></Form.Item></Col><Col span={12}><Form.Item name="phone" label="Phone"><Input/></Form.Item></Col><Col span={12}><Form.Item name="consultation_fee" label="Consultation Fee"><InputNumber style={{width:'100%'}} min={0}/></Form.Item></Col><Col span={12}><Form.Item name="is_active" label="Status" initialValue={1}><Select options={[{label:'Active',value:1},{label:'Inactive',value:0}]}/></Form.Item></Col></Row><Space><Button onClick={()=>setOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editing?'Update Doctor':'Save Doctor'}</Button></Space></Form></Modal>
    <Modal title="Doctor Details" open={!!view} onCancel={()=>setView(null)} footer={null}>{view&&<Descriptions bordered column={2} items={Object.entries({Code:view.doctor_code,Name:view.name,Qualification:view.qualification,Speciality:view.speciality,Department:view.department_name,Phone:view.phone,Fee:money(view.consultation_fee),Status:view.is_active?'Active':'Inactive'}).map(([label,children])=>({key:label,label,children:children||'-'}))}/>}</Modal>
  </>;
}


/* =========================================================
   MEDICINES & BATCHES
========================================================= */

function Medicines() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medicineModal, setMedicineModal] = useState(false);
  const [viewMedicineModal, setViewMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [batchDetailsOpen, setBatchDetailsOpen] = useState(true);
  const [viewMedicine, setViewMedicine] = useState(null);
  const [search, setSearch] = useState('');
  const [medicineForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      // Do not make batch loading a dependency of the Items screen.
      // Sales/Purchases can load batches independently. This keeps Items
      // usable even when historical batch data has an issue.
      const results = await Promise.allSettled([
        API.get('/medicines'),
        API.get('/lookups/categories'),
        API.get('/lookups/units')
      ]);

      const [medResult, catResult, unitResult] = results;
      if (medResult.status !== 'fulfilled') throw medResult.reason;

      setData(normalizeList(medResult.value.data));
      setCategories(catResult.status === 'fulfilled' ? normalizeList(catResult.value.data) : []);
      setUnits(unitResult.status === 'fulfilled' ? normalizeList(unitResult.value.data) : []);

      if (catResult.status !== 'fulfilled') {
        message.warning('Items loaded, but categories could not be loaded. Please check category data/API.');
      }
      if (unitResult.status !== 'fulfilled') {
        message.warning('Items loaded, but units could not be loaded. Unit is optional.');
      }
    } catch (error) {
      console.error('Medicine load error:', error?.response || error);
      message.error(getErrorMessage(error) || 'Could not load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredMedicines = data.filter(item =>
    `${item.name || ''} ${item.generic_name || ''} ${item.item_code || ''} ${item.category_name || ''} ${item.barcode || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openAddMedicine = () => {
    setEditingMedicine(null);
    setBatchDetailsOpen(true);
    medicineForm.resetFields();
    medicineForm.setFieldsValue({
      name: '',
      item_code: '',
      generic_name: '',
      pack_size: '',
      barcode: '',
      category_id: undefined,
      unit_id: undefined,
      reorder_level: 0,
      sale_price: 0,
      purchase_price: 0,
      mrp: 0,
      discount_on_sale_price: 0,
      batch_no: '',
      manufacture_date: '',
      expiry_date: '',
      opening_quantity: 0,
      location: '',
      opening_date: new Date().toISOString().substring(0, 10)
    });
    setMedicineModal(true);
  };

  const assignItemCode = async () => {
    try {
      const response = await API.get('/medicines/next-code');
      medicineForm.setFieldsValue({ item_code: response.data?.code || '' });
    } catch (error) {
      message.error(getErrorMessage(error) || 'Could not generate item code');
    }
  };

  const openEditMedicine = async medicine => {
    try {
      const response = await API.get(`/medicines/${medicine.id}`);
      const m = response.data?.data || response.data || medicine;
      setEditingMedicine(m);
      setBatchDetailsOpen(Boolean(m.batch_no));
      medicineForm.setFieldsValue({
        name: m.name || '',
        item_code: m.item_code || '',
        generic_name: m.generic_name || '',
        pack_size: m.pack_size || '',
        barcode: m.barcode || '',
        category_id: m.category_id ?? undefined,
        unit_id: m.unit_id ?? undefined,
        reorder_level: Number(m.reorder_level || 0),
        sale_price: Number(m.sale_price || 0),
        purchase_price: Number(m.purchase_price || 0),
        mrp: Number(m.mrp || 0),
        discount_on_sale_price: Number(m.discount_on_sale_price || 0),
        batch_no: m.batch_no || '',
        manufacture_date: m.manufacture_date ? String(m.manufacture_date).substring(0, 10) : '',
        expiry_date: m.expiry_date ? String(m.expiry_date).substring(0, 10) : '',
        opening_quantity: Number(m.opening_quantity || 0),
        location: m.location || '',
        opening_date: m.opening_date ? String(m.opening_date).substring(0, 10) : new Date().toISOString().substring(0, 10)
      });
      setMedicineModal(true);
    } catch (error) {
      console.error('Edit item load error:', error?.response || error);
      message.error(getErrorMessage(error) || 'Could not load item');
    }
  };

  const saveMedicine = async values => {
    try {
      const payload = {
        name: values.name?.trim(),
        item_code: values.item_code?.trim() || null,
        generic_name: values.generic_name?.trim() || null,
        pack_size: values.pack_size?.trim() || null,
        barcode: values.barcode?.trim() || null,
        category_id: values.category_id || null,
        unit_id: values.unit_id || null,
        reorder_level: Number(values.reorder_level || 0),
        sale_price: Number(values.sale_price || 0),
        purchase_price: Number(values.purchase_price || 0),
        mrp: Number(values.mrp || 0),
        discount_on_sale_price: Number(values.discount_on_sale_price || 0),
        batch_no: values.batch_no?.trim() || null,
        manufacture_date: values.manufacture_date || null,
        expiry_date: values.expiry_date || null,
        location: values.location?.trim() || null,
        opening_quantity: Number(values.opening_quantity || 0),
        warehouse_id: null,
        opening_date: values.opening_date || null
      };

      if (!payload.name) {
        message.warning('Item name is required');
        return;
      }

      if (editingMedicine) {
        await API.put(`/medicines/${editingMedicine.id}`, payload);
        message.success('Item updated successfully');
      } else {
        await API.post('/medicines', payload);
        message.success('Item added successfully');
      }

      setMedicineModal(false);
      setEditingMedicine(null);
      medicineForm.resetFields();
      await load();
    } catch (error) {
      console.error('Save item error:', error?.response || error);
      message.error(getErrorMessage(error) || 'Could not save item');
    }
  };

  const openViewMedicine = async medicine => {
    try {
      const response = await API.get(`/medicines/${medicine.id}`);
      setViewMedicine(response.data?.data || response.data);
      setViewMedicineModal(true);
    } catch (error) {
      message.error(getErrorMessage(error) || 'Could not load item');
    }
  };

  const deleteMedicine = async medicine => {
    try {
      await API.delete(`/medicines/${medicine.id}`);
      message.success('Item deleted successfully');
      await load();
    } catch (error) {
      message.error(getErrorMessage(error) || 'Could not delete item');
    }
  };

  const medicineColumns = [
    { title: 'Item Name', dataIndex: 'name', sorter: (a, b) => (a.name || '').localeCompare(b.name || ''), render: value => <Typography.Text strong>{value}</Typography.Text> },
    { title: 'Generic Name', dataIndex: 'generic_name', render: value => value || '-' },
    { title: 'Category', dataIndex: 'category_name', render: value => value || '-' },
    { title: 'Item Code', dataIndex: 'item_code', render: value => value || '-' },
    { title: 'Stock', dataIndex: 'stock', render: value => Number(value || 0) },
    {
      title: 'Actions',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openViewMedicine(row)}>View</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditMedicine(row)}>Edit</Button>
          <Popconfirm title="Delete this item?" okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }} onConfirm={() => deleteMedicine(row)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <Typography.Title>Items</Typography.Title>
          <Input.Search
            placeholder="Search item name, barcode or category"
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 420, maxWidth: '100%' }}
          />
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddMedicine}>Add Item</Button>
        </Space>
      </div>

      <Card title={`Items (${filteredMedicines.length})`}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredMedicines}
          columns={medicineColumns}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `Total ${total} items` }}
        />
      </Card>

      <Modal
        title={editingMedicine ? 'Edit Item' : 'Add Item'}
        open={medicineModal}
        onCancel={() => { setMedicineModal(false); setEditingMedicine(null); medicineForm.resetFields(); }}
        footer={null}
        width={980}
        destroyOnClose
      >
        <Form form={medicineForm} layout="vertical" onFinish={saveMedicine}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="Item Name" rules={[{ required: true, message: 'Item name is required' }]}><Input autoFocus placeholder="e.g. Acemit (Tab) 250mg" /></Form.Item></Col>
            <Col span={12}><Form.Item name="generic_name" label="Generic Name"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="item_code" label="Item Code"><Space.Compact style={{width:'100%'}}><Input /><Button onClick={assignItemCode}>Assign Code</Button></Space.Compact></Form.Item></Col>
            <Col span={12}><Form.Item name="pack_size" label="Pack Size"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="barcode" label="Barcode"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category_id" label="Category"><Select allowClear showSearch optionFilterProp="label" placeholder="Select category" options={categories.map(item => ({ label: item.name, value: Number(item.id) }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="unit_id" label="Unit"><Select allowClear showSearch optionFilterProp="label" placeholder="Select unit (optional)" options={units.map(item => ({ label: item.name, value: Number(item.id) }))} /></Form.Item></Col>
          </Row>

          <Tabs defaultActiveKey="pricing" items={[
            {
              key: 'pricing',
              label: 'Pricing',
              children: (
                <Row gutter={12}>
                  <Col span={8}><Form.Item name="sale_price" label="Sale Price"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={8}><Form.Item name="purchase_price" label="Purchase Price"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={8}><Form.Item name="mrp" label="MRP"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="discount_on_sale_price" label="Discount on Sale Price"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="expiry_date" label="Expiry Date"><Input type="date" /></Form.Item></Col>
                  <Col span={12}><Form.Item name="location" label="Location"><Input placeholder="Enter location / shelf / store" /></Form.Item></Col>
                </Row>
              )
            },
            {
              key: 'stock',
              label: 'Stock',
              children: (
                <div>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="opening_quantity" label="Opening Quantity">
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber min={0} precision={3} style={{ width: '100%' }} />
                          <Button type={batchDetailsOpen ? 'primary' : 'default'} onClick={() => setBatchDetailsOpen(v => !v)}>Batch</Button>
                        </Space.Compact>
                      </Form.Item>
                    </Col>
                    <Col span={12}><Form.Item name="opening_date" label="As of Date"><Input type="date" /></Form.Item></Col>
                    <Col span={12}><Form.Item name="reorder_level" label="Min Stock to Maintain"><InputNumber min={0} precision={3} style={{ width: '100%' }} /></Form.Item></Col>
                  </Row>
                  {batchDetailsOpen && (
                    <Card size="small" title="Batch Information" style={{ marginTop: 4 }}>
                      <Row gutter={12}>
                        <Col span={12}><Form.Item name="batch_no" label="Batch Number"><Input placeholder="e.g. BATCH-001" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="manufacture_date" label="Manufacture Date"><Input type="date" /></Form.Item></Col>
                      </Row>
                    </Card>
                  )}
                </div>
              )
            }
          ]} />

          <Space>
            <Button type="primary" htmlType="submit">{editingMedicine ? 'Update Item' : 'Save Item'}</Button>
            <Button onClick={() => { setMedicineModal(false); setEditingMedicine(null); medicineForm.resetFields(); }}>Cancel</Button>
          </Space>
        </Form>
      </Modal>

      <Modal title="Item Details" open={viewMedicineModal} onCancel={() => { setViewMedicineModal(false); setViewMedicine(null); }} footer={null} width={700}>
        {viewMedicine && (
          <Descriptions bordered column={2} items={[
            { key: 'name', label: 'Item Name', children: viewMedicine.name || '-' },
            { key: 'generic', label: 'Generic Name', children: viewMedicine.generic_name || '-' },
            { key: 'code', label: 'Item Code', children: viewMedicine.item_code || '-' },
            { key: 'category', label: 'Category', children: viewMedicine.category_name || '-' },
            { key: 'pack', label: 'Pack Size', children: viewMedicine.pack_size || '-' },
            { key: 'barcode', label: 'Barcode', children: viewMedicine.barcode || '-' },
            { key: 'batch', label: 'Batch Number', children: viewMedicine.batch_no || '-' },
            { key: 'manufacture', label: 'Manufacture Date', children: viewMedicine.manufacture_date ? String(viewMedicine.manufacture_date).substring(0, 10) : '-' },
            { key: 'expiry', label: 'Expiry Date', children: viewMedicine.expiry_date ? String(viewMedicine.expiry_date).substring(0, 10) : '-' },
            { key: 'purchase', label: 'Purchase Price', children: money(viewMedicine.purchase_price) },
            { key: 'sale', label: 'Sale Price', children: money(viewMedicine.sale_price) },
            { key: 'mrp', label: 'MRP', children: money(viewMedicine.mrp) },
            { key: 'location', label: 'Location', children: viewMedicine.location || '-' },
            { key: 'opening', label: 'Opening Quantity', children: Number(viewMedicine.opening_quantity || 0) },
            { key: 'stock', label: 'Current Stock', children: Number(viewMedicine.stock || 0) },
            { key: 'reorder', label: 'Min Stock to Maintain', children: Number(viewMedicine.reorder_level || 0) }
          ]} />
        )}
      </Modal>
    </>
  );
}


/* =========================================================
   CART EDITOR
========================================================= */

/* =========================================================
   NEW SALE / NEW PURCHASE — MULTI-TAB LINE-ITEM ENTRY
   Replaces the old single-line "add one item at a time" modal.
   Layout: # | Category | Item | (Batch) | Exp Date | Qty |
           Price/Unit (Without Tax) | Discount %/Amount |
           Tax %/Amount | Amount
   Discount % and Discount Amount are linked both ways — enter
   either one and the other is calculated automatically. There
   is also a Round Off option on the invoice total, and payment
   can be settled in Cash, a specific Bank account, or (for
   sales) left on Credit.
   Multiple invoices can be worked on at once via tabs. Every
   tab has its own Save and Save & Print buttons.
========================================================= */

let __rowSeq = 1;
const makeInvoiceNo = type => `${type === 'sale' ? 'INV' : 'PUR'}-${new Date().getTime()}`;

const emptyRow = () => ({
  id: __rowSeq++,
  category_id: null,
  medicine_id: null,
  medicine_name: '',
  batch_id: null,
  batch_no: '',
  exp_date: '',
  qty: 1,
  bonus_qty: 0,
  price: 0,
  discount_percent: 0,
  discount_amount: 0,
  tax_profile_id: null,
  tax_percent: 0
});

function calcRow(r) {
  const base = Number(r.qty || 0) * Number(r.price || 0);
  const discount_amount = Math.min(Number(r.discount_amount || 0), base > 0 ? base : Number(r.discount_amount || 0));
  const taxable = base - discount_amount;
  const tax_amount = Math.round(taxable * Number(r.tax_percent || 0) * 100) / 10000;
  const amount = Math.round((taxable + tax_amount) * 100) / 100;
  return { base, discount_amount, tax_amount, amount };
}

/* re-derive discount_amount from discount_percent whenever qty/price/percent change */
const syncDiscountFromPercent = row => {
  const base = Number(row.qty || 0) * Number(row.price || 0);
  return { ...row, discount_amount: Math.round(base * Number(row.discount_percent || 0)) / 100 };
};
/* re-derive discount_percent from discount_amount whenever the amount is typed directly */
const syncDiscountFromAmount = row => {
  const base = Number(row.qty || 0) * Number(row.price || 0);
  return { ...row, discount_percent: base > 0 ? Math.round((Number(row.discount_amount || 0) / base) * 10000) / 100 : row.discount_percent };
};

function InvoiceForm({ type, onSaved, existingId = null }) {
  const isSale = type === 'sale';
  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [taxProfiles, setTaxProfiles] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [header, setHeader] = useState({
    patient_id: null,
    patient_name: '',
    patient_phone: '',
    supplier_id: null,
    supplier_name: '',
    supplier_phone: '',
    invoice_no: type === 'purchase' ? '' : makeInvoiceNo(type),
    invoice_date: localYmd(),
    invoice_time: new Date().toTimeString().slice(0, 5),
    billing_address: '',
    payment_method: 'Cash',
    bank_account_id: null,
    paid: null,
    round_off: true
  });
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [patientModal, setPatientModal] = useState(false);
  const [patientEditing, setPatientEditing] = useState(null);
  const [patientForm] = Form.useForm();

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      // All lookups are independent. In particular, a failure in Tax/Cash-Bank
      // must never leave the Sale/Purchase item selector empty.
      const requests = {
        categories: API.get('/lookups/categories'),
        taxProfiles: API.get('/lookups/tax-profiles'),
        bankAccounts: API.get('/cash-bank/accounts'),
        medicines: API.get('/medicines')
      };

      if (isSale) {
        Object.assign(requests, {
          batches: API.get('/sales/batches'),
          patients: API.get('/patients'),
          doctors: API.get('/lookups/doctors')
        });
      } else {
        requests.suppliers = API.get('/suppliers');
      }

      const entries = await Promise.all(
        Object.entries(requests).map(async ([key, promise]) => {
          try {
            return [key, { ok: true, data: (await promise).data }];
          } catch (error) {
            return [key, { ok: false, error }];
          }
        })
      );

      if (cancelled) return;
      const loaded = Object.fromEntries(entries);

      if (loaded.categories?.ok) setCategories(normalizeList(loaded.categories.data));
      else message.warning(getErrorMessage(loaded.categories?.error) || 'Could not load categories');

      if (loaded.taxProfiles?.ok) setTaxProfiles(normalizeList(loaded.taxProfiles.data).map(t => ({ ...t, id: Number(t.id) })));
      if (loaded.bankAccounts?.ok) {
        setBankAccounts(
          (loaded.bankAccounts.data?.banks || normalizeList(loaded.bankAccounts.data)).map(b => ({ ...b, id: Number(b.id) }))
        );
      }

      if (loaded.medicines?.ok) {
        // Keep IDs numeric so Ant Design Select values remain stable even when
        // MariaDB returns BIGINT values as strings.
        setMedicines(normalizeList(loaded.medicines.data).map(m => ({
          ...m,
          id: Number(m.id),
          category_id: m.category_id == null ? null : Number(m.category_id)
        })));
      } else {
        message.error(getErrorMessage(loaded.medicines?.error) || 'Could not load items');
      }

      if (isSale) {
        if (loaded.batches?.ok) {
          setBatches(normalizeList(loaded.batches.data).map(b => ({
            ...b,
            id: Number(b.id),
            medicine_id: Number(b.medicine_id),
            stock: Number(b.stock || 0)
          })));
        } else {
          message.warning(getErrorMessage(loaded.batches?.error) || 'Could not load medicine batches');
        }
        if (loaded.patients?.ok) setPatients(normalizeList(loaded.patients.data).map(p => ({ ...p, id: Number(p.id) })));
        if (loaded.doctors?.ok) setDoctors(normalizeList(loaded.doctors.data).map(d => ({ ...d, id: Number(d.id), department_id: d.department_id == null ? null : Number(d.department_id) })));
      } else if (loaded.suppliers?.ok) {
        setSuppliers(normalizeList(loaded.suppliers.data).map(s => ({ ...s, id: Number(s.id) })));
      } else {
        message.error(getErrorMessage(loaded.suppliers?.error) || 'Could not load suppliers');
      }
    };

    loadLookups();
    return () => { cancelled = true; };
  }, [isSale]);

  useEffect(() => {
    if (!existingId) return;
    (async () => {
      try {
        const res = await API.get(`/${isSale ? 'sales' : 'purchases'}/${existingId}`);
        const d = res.data;
        const dt = d.invoice_date ? new Date(String(d.invoice_date).replace(' ', 'T')) : null;
        setHeader(h => ({ ...h,
          patient_id: d.patient_id || null, patient_name: d.patient_name || '', patient_phone: d.patient_mobile || d.patient_phone || '',
          doctor_id: d.doctor_id || null, supplier_id: d.supplier_id || null, supplier_name: d.supplier_name || '', supplier_phone: d.supplier_phone || '',
          invoice_no: d.invoice_no || h.invoice_no, invoice_date: dt && !Number.isNaN(dt.getTime()) ? dt.toISOString().slice(0,10) : (d.invoice_date ? String(d.invoice_date).slice(0,10) : h.invoice_date),
          invoice_time: d.invoice_time ? String(d.invoice_time).slice(0,5) : (dt && !Number.isNaN(dt.getTime()) ? dt.toTimeString().slice(0,5) : h.invoice_time),
          billing_address: d.billing_address || d.patient_address || d.supplier_address || '',
          payment_method: d.payment_method || 'Cash', bank_account_id: d.bank_account_id || null, paid: Number(d.paid || 0), round_off: Boolean(Number(d.round_off || 0))
        }));
        const returnedBySaleItem = new Map();
        (d.returnItems || []).forEach(ri => {
          const key = String(ri.sale_item_id);
          returnedBySaleItem.set(key, (returnedBySaleItem.get(key) || 0) + Number(ri.qty || 0));
        });
        setRows((d.items || []).map(i => ({
          ...emptyRow(), id: __rowSeq++, source_item_id: i.id, returned_qty: returnedBySaleItem.get(String(i.id)) || 0, category_id: i.category_id || null, medicine_id: i.medicine_id, medicine_name: i.medicine_name || '',
          batch_id: i.batch_id || null, batch_no: i.batch_no || '', exp_date: i.expiry_date ? String(i.expiry_date).slice(0,10) : '',
          qty: Number(i.qty || 0), bonus_qty: Number(i.bonus_qty || 0), price: Number(isSale ? i.unit_price : i.unit_cost) || 0,
          discount_percent: Number(i.discount_percent || 0), discount_amount: Number(i.discount || 0), tax_profile_id: i.tax_profile_id || null,
          tax_percent: Number(i.tax_percent || 0)
        })));
      } catch (e) {
        message.error(getErrorMessage(e) || 'Could not load invoice for editing');
      }
    })();
  }, [existingId, isSale]);

  const selectPatient = p => {
    setHeader(h => ({ ...h, patient_id: p?.id || null, patient_name: p?.name || '', patient_phone: p?.mobile || '', billing_address: p?.address || h.billing_address }));
  };

  const resolvePatientForSale = async () => {
    if (!isSale) return null;
    const name = String(header.patient_name || '').trim();
    if (!name) return null;
    if (header.patient_id) {
      if (header.patient_phone || header.billing_address) {
        try {
          await API.put(`/patients/${header.patient_id}`, { name, mobile: header.patient_phone || null, address: header.billing_address || null });
        } catch (e) { /* keep sale save independent of optional patient profile update */ }
      }
      return header.patient_id;
    }
    const r = await API.post('/patients', { name, mobile: header.patient_phone || null, address: header.billing_address || null });
    return r.data?.id || r.data?.patient?.id || null;
  };

  const refreshPatients = async (q='') => {
    try { const r = await API.get('/patients', { params: { q } }); setPatients(normalizeList(r.data)); return normalizeList(r.data); }
    catch (e) { message.error(getErrorMessage(e)); return []; }
  };

  const openNewPatient = () => { setPatientEditing(null); patientForm.resetFields(); setPatientModal(true); };
  const openEditPatient = async () => {
    if (!header.patient_id) return message.warning('Select a patient first');
    try { const r = await API.get(`/patients/${header.patient_id}`); patientForm.setFieldsValue(r.data); setPatientEditing(r.data); setPatientModal(true); }
    catch (e) { message.error(getErrorMessage(e)); }
  };
  const deletePatient = async () => {
    if (!header.patient_id) return message.warning('Select a patient first');
    try { await API.delete(`/patients/${header.patient_id}`); message.success('Patient deleted'); setHeader(h => ({ ...h, patient_id: null })); await refreshPatients(); }
    catch (e) { message.error(getErrorMessage(e)); }
  };

  const savePatient = async values => {
    try {
      if (patientEditing) { await API.put(`/patients/${patientEditing.id}`, values); message.success('Patient updated'); setHeader(h => ({ ...h, patient_id: patientEditing.id, patient_name: values.name || '', patient_phone: values.mobile || '', billing_address: values.address || h.billing_address })); }
      else { const r = await API.post('/patients', values); message.success('Patient created'); setHeader(h => ({ ...h, patient_id: r.data.id, patient_name: values.name || '', patient_phone: values.mobile || '', billing_address: values.address || h.billing_address })); }
      await refreshPatients(); setPatientModal(false); patientForm.resetFields();
    } catch (e) { message.error(getErrorMessage(e)); }
  };

  const addRow = () => setRows(r => [...r, emptyRow()]);
  const removeRow = id => setRows(r => (r.length > 1 ? r.filter(x => x.id !== id) : r));
  const updateRow = (id, patch) => setRows(r => r.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const onQtyOrPrice = (id, patch) => setRows(r => r.map(x => (x.id === id ? syncDiscountFromPercent({ ...x, ...patch }) : x)));
  const onSaleQtyChange = (row, value) => {
    const minQty = Number(row.returned_qty || 0);
    const nextQty = Math.max(minQty, Number(value || 0));
    onQtyOrPrice(row.id, { qty: nextQty });
  };
  const onDiscountPercent = (id, val) => setRows(r => r.map(x => (x.id === id ? syncDiscountFromPercent({ ...x, discount_percent: val || 0 }) : x)));
  const onDiscountAmount = (id, val) => setRows(r => r.map(x => (x.id === id ? syncDiscountFromAmount({ ...x, discount_amount: val || 0 }) : x)));

  const findMedicine = medicineId =>
    medicines.find(m => Number(m.id) === Number(medicineId));

  const resolveCategoryId = medicine => {
    if (!medicine) return null;
    if (medicine.category_id != null && medicine.category_id !== '') {
      return Number(medicine.category_id);
    }
    // Some older records contain category_name instead of category_id.
    const name = String(medicine.category_name || '').trim().toLowerCase();
    if (!name) return null;
    const category = categories.find(c => String(c.name || '').trim().toLowerCase() === name);
    return category ? Number(category.id) : null;
  };

  const onItemSelect = (id, medicineId) => {
    const m = findMedicine(medicineId);
    if (!m) return;

    const categoryId = resolveCategoryId(m);

    if (isSale) {
      const opts = batches
        .filter(b => Number(b.medicine_id) === Number(medicineId))
        .sort((a, b) => {
          const stockDiff = Number(b.stock || 0) > 0 ? 0 : 1;
          const aExpiry = String(a.expiry_date || '9999-12-31');
          const bExpiry = String(b.expiry_date || '9999-12-31');
          return stockDiff - (Number(a.stock || 0) > 0 ? 0 : 1) ||
            aExpiry.localeCompare(bExpiry) || Number(a.id) - Number(b.id);
        });

      const b = opts.find(x => Number(x.stock) > 0) || opts[0];

      onQtyOrPrice(id, {
        medicine_id: Number(medicineId),
        category_id: categoryId,
        medicine_name: m.name || b?.medicine_name || '',
        batch_id: b?.id != null ? Number(b.id) : null,
        batch_no: b?.batch_no || m.batch_no || '',
        exp_date: b?.expiry_date
          ? String(b.expiry_date).slice(0, 10)
          : (m.expiry_date ? String(m.expiry_date).slice(0, 10) : ''),
        // Batch sale price has priority; fall back to the medicine master price
        // when a batch is missing so selecting an item never leaves Rate at 0.
        price: b?.sale_price != null
          ? Number(b.sale_price)
          : Number(m.sale_price || 0)
      });
    } else {
      updateRow(id, {
        medicine_id: Number(medicineId),
        medicine_name: m.name || '',
        category_id: categoryId,
        price: Number(m.purchase_price || m.sale_price || 0),
        exp_date: m.expiry_date ? String(m.expiry_date).slice(0, 10) : ''
      });
    }
  };

  const onBatchSelect = (id, batchId) => {
    const b = batches.find(x => Number(x.id) === Number(batchId));
    if (!b) return;
    onQtyOrPrice(id, {
      batch_id: Number(b.id),
      batch_no: b.batch_no || '',
      exp_date: b.expiry_date ? String(b.expiry_date).slice(0, 10) : '',
      price: Number(b.sale_price || 0)
    });
  };

  const onTaxSelect = (id, taxProfileId) => {
    const tp = taxProfiles.find(x => String(x.id) === String(taxProfileId));
    updateRow(id, { tax_profile_id: taxProfileId || null, tax_percent: tp ? Number(tp.rate) : 0 });
  };

  const rawTotals = rows.reduce(
    (acc, r) => {
      const c = calcRow(r);
      acc.qty += Number(r.qty || 0);
      acc.discount += c.discount_amount;
      acc.tax += c.tax_amount;
      acc.amount += c.amount;
      return acc;
    },
    { qty: 0, discount: 0, tax: 0, amount: 0 }
  );
  const roundOffValue = header.round_off ? Math.round(rawTotals.amount) - rawTotals.amount : 0;
  const grandTotal = Math.round((rawTotals.amount + roundOffValue) * 100) / 100;

  // When editing an existing invoice, reducing item quantities can make the
  // new total lower than the old paid amount. Keep the invoice internally
  // valid by lowering Paid to the new total; the backend intentionally rejects
  // paid > net_total. This only runs after the edited rows have a real total.
  useEffect(() => {
    if (!existingId || grandTotal <= 0 || header.paid == null) return;
    if (Number(header.paid) > grandTotal) {
      setHeader(h => ({ ...h, paid: grandTotal }));
    }
  }, [grandTotal, existingId]);

  const buildItems = () =>
    rows
      .filter(r => r.medicine_id && Number(r.qty) > 0)
      .map(r => {
        const c = calcRow(r);
        return isSale
          ? {
              medicine_id: r.medicine_id,
              batch_id: r.batch_id,
              qty: r.qty,
              unit_price: r.price,
              discount: c.discount_amount,
              discount_percent: r.discount_percent,
              tax: c.tax_amount,
              tax_percent: r.tax_percent,
              tax_profile_id: r.tax_profile_id
            }
          : {
              medicine_id: r.medicine_id,
              batch_id: r.batch_id || null,
              batch_no: r.batch_no || undefined,
              expiry_date: r.exp_date || null,
              qty: r.qty,
              bonus_qty: r.bonus_qty || 0,
              unit_cost: r.price,
              discount: c.discount_amount,
              discount_percent: r.discount_percent,
              tax: c.tax_amount,
              tax_percent: r.tax_percent,
              tax_profile_id: r.tax_profile_id
            };
      });

  const save = async print => {
    const items = buildItems();
    if (!items.length) {
      message.warning('Add at least one item row');
      return;
    }
    if (header.payment_method === 'Bank' && !header.bank_account_id) {
      message.warning('Select which bank account this payment is settled through');
      return;
    }
    for (const r of rows) {
      if (r.medicine_id && !isSale && !r.exp_date) {
        message.warning(`Enter expiry date for ${r.medicine_name}`);
        return;
      }
    }
    setSaving(true);
    try {
      let res;
      const paidValue = header.paid != null ? header.paid : header.payment_method === 'Credit' ? 0 : grandTotal;
      if (isSale) {
        const resolvedPatientId = await resolvePatientForSale();
        const body = { invoice_no: header.invoice_no || makeInvoiceNo('sale'), patient_id: resolvedPatientId, doctor_id: header.doctor_id || null, invoice_date: header.invoice_date, invoice_time: header.invoice_time, billing_address: header.billing_address || null, items, discount: rawTotals.discount, round_off: roundOffValue, paid: paidValue, payment_method: header.payment_method, bank_account_id: header.bank_account_id || null };
        res = existingId ? await API.post(`/sales/${existingId}`, body) : await API.post('/sales', body);
      } else {
        if (!header.supplier_id) {
          message.warning('Supplier Name is required. Please select a supplier from the list.');
          setSaving(false);
          return;
        }
        const body = { invoice_no: String(header.invoice_no || ''), supplier_id: header.supplier_id, invoice_date: header.invoice_date, invoice_time: header.invoice_time, billing_address: header.billing_address || null, items, discount: rawTotals.discount, round_off: roundOffValue, paid: paidValue, payment_method: header.payment_method, bank_account_id: header.bank_account_id || null };
        res = existingId ? await API.post(`/purchases/${existingId}`, body) : await API.post('/purchases', body);
      }
      message.success(existingId ? (isSale ? 'Sale updated and stock recalculated' : 'Purchase updated and stock recalculated') : (isSale ? 'Sale saved and stock deducted' : 'Purchase saved and stock updated'));
      if (print) {
        try {
          const full = await API.get(`/${isSale ? 'sales' : 'purchases'}/${res.data.id}`);
          printDocument(full.data, isSale ? 'sale' : 'purchase');
        } catch (e) {}
      }
      onSaved();
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return <>
    <Modal title={patientEditing ? 'Edit Patient' : 'Create New Patient'} open={patientModal} onCancel={() => setPatientModal(false)} footer={null}>
      <Form form={patientForm} layout="vertical" onFinish={savePatient}>
        <Form.Item name="name" label="Patient Name" rules={[{required:true,message:'Patient name is required'}]}><Input /></Form.Item>
        <Row gutter={12}><Col span={12}><Form.Item name="mobile" label="Mobile"><Input /></Form.Item></Col><Col span={12}><Form.Item name="cnic" label="CNIC"><Input /></Form.Item></Col></Row>
        <Form.Item name="father_husband_name" label="Father / Husband Name"><Input /></Form.Item>
        <Form.Item name="address" label="Billing Address"><Input.TextArea rows={2} /></Form.Item>
        <Space><Button type="primary" htmlType="submit">Save Patient</Button><Button onClick={() => setPatientModal(false)}>Cancel</Button></Space>
      </Form>
    </Modal>
    <Card className="invoice-form" bodyStyle={{ padding: 16 }}>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {isSale ? (
          <>
            <Col xs={24} md={7}>
              <div className="field-label">Patient Name</div>
              <AutoComplete
                value={header.patient_name}
                options={patients.map(p => ({ value: p.name, label: `${p.name}${p.mobile ? ` — ${p.mobile}` : ''}${p.cnic ? ` — ${p.cnic}` : ''}`, patient: p }))}
                onSearch={refreshPatients}
                onSelect={(value, option) => selectPatient(option.patient)}
                onChange={value => {
                  const match = patients.find(p => String(p.name).toLowerCase() === String(value).toLowerCase());
                  if (match) selectPatient(match);
                  else setHeader(h => ({ ...h, patient_id: null, patient_name: value }));
                }}
                placeholder="Patient Name"
                style={{ width: '100%' }}
                filterOption={(input, option) => String(option?.value || '').toLowerCase().includes(String(input || '').toLowerCase())}
              />
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>Type a new name or choose an existing patient</div>
              <Space size={4} style={{marginTop:4}}>
                <Button size="small" onClick={openNewPatient}>New Patient</Button>
                <Button size="small" disabled={!header.patient_id} onClick={openEditPatient}>Edit</Button>
                <Button size="small" danger disabled={!header.patient_id} onClick={deletePatient}>Delete</Button>
              </Space>
            </Col>
            <Col xs={24} md={5}>
              <div className="field-label">Phone No.</div>
              <Input value={header.patient_phone} placeholder="Phone No." onChange={e=>setHeader(h=>({...h,patient_phone:e.target.value}))} />
            </Col>
            <Col xs={24} md={5}>
              <div className="field-label">Invoice Number</div>
              <Input value={header.invoice_no} onChange={e=>setHeader(h=>({...h,invoice_no:e.target.value}))} />
            </Col>
            <Col xs={24} md={4}>
              <div className="field-label">Invoice Date</div>
              <Input type="date" value={header.invoice_date} onChange={e=>setHeader(h=>({...h,invoice_date:e.target.value}))} />
            </Col>
            <Col xs={24} md={3}>
              <div className="field-label">Time</div>
              <Input type="time" value={header.invoice_time} onChange={e=>setHeader(h=>({...h,invoice_time:e.target.value}))} />
            </Col>
            <Col xs={24} md={12}>
              <div className="field-label">Billing Address <span style={{fontWeight:400}}>(Optional)</span></div>
              <Input.TextArea rows={2} value={header.billing_address} placeholder="Billing Address" onChange={e=>setHeader(h=>({...h,billing_address:e.target.value}))} />
            </Col>
            <Col xs={24} md={6}>
              <div className="field-label">Doctor</div>
              <Select allowClear showSearch optionFilterProp="label" placeholder="Doctor (optional)" style={{width:'100%'}} options={doctors.map(d=>({label:d.name,value:d.id}))} value={header.doctor_id} onChange={v=>setHeader(h=>({...h,doctor_id:v}))} />
            </Col>
            <Col xs={24} md={6}>
              <div className="field-label">Payment</div>
              <Select style={{width:'100%'}} value={header.payment_method} options={[{label:'Cash',value:'Cash'},{label:'Bank',value:'Bank'},{label:'Credit',value:'Credit'}]} onChange={v=>setHeader(h=>({...h,payment_method:v,bank_account_id:v==='Bank'?h.bank_account_id:null}))} />
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} lg={9}>
              <div className="field-label">Supplier Name <span style={{color:'#d4380d'}}>*</span></div>
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                value={header.supplier_id || undefined}
                placeholder="Select Supplier"
                style={{width:'100%'}}
                getPopupContainer={() => document.body}
                options={suppliers.map(s=>({
                  value: Number(s.id),
                  label: `${s.name || ''}${s.phone ? ` — ${s.phone}` : ''}`,
                  supplier: s
                }))}
                onChange={(v) => {
                  const supplier = suppliers.find(s => String(s.id) === String(v));
                  if (!supplier) {
                    setHeader(h => ({...h, supplier_id:null, supplier_name:'', supplier_phone:''}));
                    return;
                  }
                  setHeader(h => ({...h, supplier_id:supplier.id, supplier_name:supplier.name || '', supplier_phone:supplier.phone || '', billing_address:supplier.address || h.billing_address}));
                }}
              />
            </Col>
            <Col xs={24} lg={5}>
              <div className="field-label">Phone No.</div>
              <Input value={header.supplier_phone} placeholder="Phone No." onChange={e=>setHeader(h=>({...h,supplier_phone:e.target.value}))}/>
            </Col>
            <Col xs={24} lg={5}>
              <div className="field-label">Bill Number</div>
              <Input value={header.invoice_no} placeholder="Bill Number" onChange={e=>setHeader(h=>({...h,invoice_no:e.target.value}))}/>
            </Col>
            <Col xs={24} lg={3}>
              <div className="field-label">Bill Date</div>
              <Input type="date" value={header.invoice_date} onChange={e=>setHeader(h=>({...h,invoice_date:e.target.value}))}/>
            </Col>
            <Col xs={24} lg={2}>
              <div className="field-label">Time</div>
              <Input type="time" value={header.invoice_time} onChange={e=>setHeader(h=>({...h,invoice_time:e.target.value}))}/>
            </Col>
            <Col xs={24} lg={14}>
              <div className="field-label">Billing Address <span style={{fontWeight:400}}>(Optional)</span></div>
              <Input.TextArea rows={2} value={header.billing_address} placeholder="Billing Address" onChange={e=>setHeader(h=>({...h,billing_address:e.target.value}))}/>
            </Col>
            <Col xs={24} lg={5}>
              <div className="field-label">Payment</div>
              <Select style={{width:'100%'}} value={header.payment_method} options={[{label:'Cash',value:'Cash'},{label:'Bank',value:'Bank'}]} onChange={v=>setHeader(h=>({...h,payment_method:v,bank_account_id:v==='Bank'?h.bank_account_id:null}))}/>
            </Col>
            <Col xs={24} lg={5}>
              <div className="field-label">Paid</div>
              <InputNumber min={0} style={{width:'100%'}} placeholder="Paid Amount" value={header.paid} onChange={v=>setHeader(h=>({...h,paid:v}))}/>
            </Col>
            {header.payment_method === 'Bank' && <Col xs={24} lg={5}><div className="field-label">Bank Account</div><Select placeholder="Select bank account" style={{width:'100%'}} value={header.bank_account_id} options={bankAccounts.map(b=>({label:`${b.name}${b.bank_name?' — '+b.bank_name:''}`,value:b.id}))} onChange={v=>setHeader(h=>({...h,bank_account_id:v}))}/></Col>}
          </>
        )}
      </Row>

      {isSale && existingId && (rows.some(r => Number(r.returned_qty || 0) > 0) || false) && (
        <div style={{ marginBottom: 10, padding: '8px 10px', border: '1px solid #ffd591', background: '#fffbe6', borderRadius: 6, fontSize: 12 }}>
          This sale has existing Sale Returns. Returned quantities are protected; you can edit the remaining quantity, but not below the quantity already returned.
        </div>
      )}

      <div className="invoice-grid">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Category</th>
              <th>Item</th>
              {isSale && <th>Batch</th>}
              {isSale && existingId && <th>Returned</th>}
              <th>Exp. Date</th>
              <th>Qty</th>
              {!isSale && <th>Bonus / Free</th>}
              <th>
                Price/Unit
                <br />
                <small>Without Tax</small>
              </th>
              <th>Disc %</th>
              <th>Disc Amt</th>
              <th>Tax</th>
              <th>Tax Amt</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const c = calcRow(r);
              const itemOptions = medicines
                .filter(m => {
                  if (r.category_id == null || r.category_id === '') return true;
                  return Number(m.category_id) === Number(r.category_id);
                })
                .map(m => ({
                  label: `${m.name || ''}${m.item_code ? ` — ${m.item_code}` : ''}`,
                  value: Number(m.id)
                }));
              const batchOptions = isSale
                ? batches
                    .filter(b => String(b.medicine_id) === String(r.medicine_id))
                    .map(b => ({ label: `${b.batch_no} (Stock ${b.stock})`, value: b.id, disabled: Number(b.stock) <= 0 }))
                : [];
              return (
                <tr key={r.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <Select
                      size="small"
                      style={{ width: 110 }}
                      value={r.category_id}
                      allowClear
                      placeholder="ALL"
                      options={categories.map(c2 => ({ label: c2.name, value: Number(c2.id) }))}
                      onChange={v => updateRow(r.id, { category_id: v, medicine_id: null, batch_id: null, medicine_name: '' })}
                    />
                  </td>
                  <td>
                    <Select
                      size="small"
                      showSearch
                      optionFilterProp="label"
                      style={{ width: 170 }}
                      placeholder="Select item"
                      value={r.medicine_id || undefined}
                      options={itemOptions}
                      getPopupContainer={() => document.body}
                      onChange={v => onItemSelect(r.id, v)}
                    />
                  </td>
                  {isSale && (
                    <td>
                      <Select
                        size="small"
                        style={{ width: 140 }}
                        placeholder="Batch"
                        value={r.batch_id}
                        options={batchOptions}
                        onChange={v => onBatchSelect(r.id, v)}
                      />
                    </td>
                  )}
                  {isSale && existingId && <td className="ro"><b>{Number(r.returned_qty || 0)}</b></td>}
                  <td>
                    <Input
                      size="small"
                      type="date"
                      style={{ width: 130 }}
                      value={r.exp_date}
                      readOnly={isSale}
                      onChange={e => updateRow(r.id, { exp_date: e.target.value })}
                    />
                  </td>
                  <td>
                    <InputNumber size="small" min={isSale && existingId ? Number(r.returned_qty || 0) : 0} style={{ width: 65 }} value={r.qty} onChange={v => isSale && existingId ? onSaleQtyChange(r, v) : onQtyOrPrice(r.id, { qty: v || 0 })} />
                  </td>
                  {!isSale && <td><InputNumber size="small" min={0} style={{ width: 75 }} value={r.bonus_qty} onChange={v => updateRow(r.id, { bonus_qty: v || 0 })} /></td>}
                  <td>
                    <InputNumber size="small" min={0} style={{ width: 90 }} value={r.price} onChange={v => onQtyOrPrice(r.id, { price: v || 0 })} />
                  </td>
                  <td>
                    <InputNumber size="small" min={0} max={100} style={{ width: 60 }} value={r.discount_percent} onChange={v => onDiscountPercent(r.id, v)} />
                  </td>
                  <td>
                    <InputNumber size="small" min={0} style={{ width: 75 }} value={c.discount_amount} onChange={v => onDiscountAmount(r.id, v)} />
                  </td>
                  <td>
                    <Select
                      size="small"
                      style={{ width: 110 }}
                      placeholder="NONE"
                      allowClear
                      value={r.tax_profile_id}
                      options={taxProfiles.map(t => ({ label: t.name, value: t.id }))}
                      onChange={v => onTaxSelect(r.id, v)}
                    />
                  </td>
                  <td className="ro">{money(c.tax_amount)}</td>
                  <td className="ro amount">{money(c.amount)}</td>
                  <td>
                    <Button danger size="small" onClick={() => removeRow(r.id)}>
                      ✕
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              {/* Span every column up to (but not including) Qty, so the totals below
                  line up under their own headers regardless of which optional columns
                  (Batch / Returned / Bonus) are showing. */}
              <td colSpan={3 /* #, Category, Item */ + (isSale ? 1 : 0) /* Batch */ + (isSale && existingId ? 1 : 0) /* Returned */ + 1 /* Exp. Date */}>
                <Button size="small" type="dashed" onClick={addRow}>
                  + Add Row
                </Button>
              </td>
              <td><b>{rawTotals.qty}</b></td>
              {!isSale && <td><b>{rows.reduce((a,r)=>a+Number(r.bonus_qty||0),0)}</b></td>}
              <td />
              <td className="ro">{money(rawTotals.discount)}</td>
              <td />
              <td className="ro">{money(rawTotals.tax)}</td>
              <td className="ro amount">
                <b>{money(rawTotals.amount)}</b>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <Row justify="space-between" align="middle" style={{ marginTop: 12 }} wrap>
        <Col>
          <Space wrap>
            <span>{isSale ? 'Received' : 'Paid'}:</span>
            <InputNumber min={0} placeholder={money(grandTotal)} value={header.paid} onChange={v => setHeader(h => ({ ...h, paid: v }))} />
            <Checkbox checked={header.round_off} onChange={e => setHeader(h => ({ ...h, round_off: e.target.checked }))}>
              Round Off {header.round_off ? `(${roundOffValue >= 0 ? '+' : ''}${roundOffValue.toFixed(2)})` : ''}
            </Checkbox>
            <b style={{ fontSize: 16 }}>Grand Total: {money(grandTotal)}</b>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button loading={saving} onClick={() => save(false)}>
              Save
            </Button>
            <Button type="primary" loading={saving} onClick={() => save(true)}>
              Save &amp; Print
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  </>
}


function InlineReturnForm({ type, onSaved }) {
  const isSale = type === 'sale';
  const [invoices,setInvoices]=useState([]),[q,setQ]=useState(''),[invoiceId,setInvoiceId]=useState(null),[detail,setDetail]=useState(null),[rows,setRows]=useState([]),[reason,setReason]=useState(''),[saving,setSaving]=useState(false);
  const [searching,setSearching]=useState(false),[patientId,setPatientId]=useState(null);

  // Search the original transaction by invoice/bill number, item name, or party mobile/name.
  const load=async(search='')=>{
    try {
      const r=await API.get(`/${isSale?'sales':'purchases'}`,{params:{q:String(search||'').trim()}});
      setInvoices(r.data||[]);
      return r.data||[];
    } catch(e) { message.error(getErrorMessage(e)); return []; }
  };
  const searchInvoices=async(search='')=>{ setQ(search); setSearching(true); try { await load(search); } finally { setSearching(false); } };
  useEffect(()=>{load('')},[]);

  const pick=async id=>{
    setInvoiceId(id||null);
    if(!id){setDetail(null);setRows([]);if(isSale)setPatientId(null);return;}
    try{
      const d=(await API.get(`/${isSale?'sales':'purchases'}/${id}`)).data;
      setDetail(d);
      setRows((d.items||[]).map(i=>({key:i.id,medicine_id:i.medicine_id,batch_id:i.batch_id,medicine_name:i.medicine_name,batch_no:i.batch_no,sold_qty:Number(i.qty||0),qty:0,unit_price:Number(i.unit_price||0),cost_price:Number(i.cost_price||0),unit_cost:Number(i.unit_cost||0)})));
      if(isSale) setPatientId(d.patient_id || null);
    }catch(e){message.error(getErrorMessage(e));}
  };

  const save=async()=>{
    const items=rows.filter(r=>Number(r.qty)>0).map(r=>({medicine_id:r.medicine_id,batch_id:r.batch_id,qty:r.qty,...(isSale?{unit_price:r.unit_price,cost_price:r.cost_price}:{unit_cost:r.unit_cost})}));
    if(!invoiceId) return message.warning(`Search and select a ${isSale?'sale':'purchase'} first`);
    if(!items.length)return message.warning('Enter return quantity for at least one item');
    setSaving(true);
    try{
      await API.post(`/${isSale?'sale-returns':'purchase-returns'}`,{[isSale?'sale_id':'purchase_id']:invoiceId,[isSale?'patient_id':'supplier_id']:isSale?(patientId||null):(detail?.supplier_id||null),return_date:localYmd(),reason,items});
      message.success(isSale?'Sale return saved — stock and balance updated':'Purchase return saved — stock and supplier balance updated');
      onSaved?.();
      setInvoiceId(null);setDetail(null);setRows([]);setReason('');setQ('');setInvoices([]);if(isSale)setPatientId(null);
    }catch(e){message.error(getErrorMessage(e));}finally{setSaving(false)}
  };

  const invoiceOptions=invoices.map(inv=>(
    <Select.Option key={inv.id} value={inv.id}>
      {`${inv.invoice_no||'Bill #'+inv.id}${inv.patient_name?` — ${inv.patient_name}`:''}${inv.patient_mobile?` — ${inv.patient_mobile}`:''}`}
    </Select.Option>
  ));
  const searchPlaceholder=isSale?'Search by Item / Invoice No / Mobile Number':'Search by Item / Bill No / Supplier';

  return <Card title={isSale?'Return Sale / Credit Note':'Return Purchase / Debit Note'} style={{marginTop:12}}>
    <Row gutter={10} style={{marginBottom:12}}>
      <Col span={isSale?14:14}>
        <Select
          showSearch
          allowClear
          value={invoiceId}
          placeholder={searchPlaceholder}
          loading={searching}
          filterOption={false}
          onSearch={searchInvoices}
          onFocus={()=>{if(!invoices.length) searchInvoices('')}}
          onChange={v=>pick(v||null)}
          style={{width:'100%'}}
          notFoundContent={searching?'Searching...':`No matching ${isSale?'sale':'purchase'} found`}
        >
          {invoiceOptions}
        </Select>
      </Col>
      <Col span={isSale?6:6}><Input placeholder="Reason (optional)" value={reason} onChange={e=>setReason(e.target.value)}/></Col>
      <Col span={isSale?4:4}><Button block type="primary" loading={saving} onClick={save}>Save {isSale?'Credit':'Debit'} Note</Button></Col>
    </Row>
    {isSale && <div style={{fontSize:12,color:'var(--text-muted)',marginTop:-6,marginBottom:10}}>Patient selection is not required. Search by item, invoice number, or mobile number, then select the original sale. The patient is taken automatically from the invoice; walk-in sales remain supported.</div>}
    <div className="invoice-grid"><table><thead><tr><th>Item</th><th>Batch</th><th>Original Qty</th><th>Return Qty</th><th>Rate/Cost</th><th>Amount</th></tr></thead><tbody>{rows.map(r=><tr key={r.key}><td>{r.medicine_name}</td><td>{r.batch_no}</td><td>{r.sold_qty}</td><td><InputNumber size="small" min={0} max={r.sold_qty} value={r.qty} onChange={v=>setRows(a=>a.map(x=>x.key===r.key?{...x,qty:v||0}:x))}/></td><td>{money(isSale?r.unit_price:r.unit_cost)}</td><td className="ro amount">{money(Number(r.qty||0)*Number(isSale?r.unit_price:r.unit_cost||0))}</td></tr>)}{!rows.length&&<tr><td colSpan={6} style={{textAlign:'center',padding:16,color:'var(--text-muted)'}}>Search by item, invoice number, or mobile number and select a sale to load its items.</td></tr>}</tbody></table></div>
  </Card>;
}

let __tabSeq = 1;
function InvoiceWorkspace({ type, onReload, onCloseAll, editId = null }) {
  const label = type === 'sale' ? 'Sale' : 'Purchase';
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onCloseAll?.(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCloseAll]);
  const screenLabel = editId ? `Edit ${label}` : `New ${label}`;
  const [tabs, setTabs] = useState([{ key: __tabSeq++, editId }]);
  const [activeKey, setActiveKey] = useState(tabs[0].key);
  const [mode,setMode]=useState('invoice');

  const addTab = () => {
    const key = __tabSeq++;
    setTabs(t => [...t, { key, editId: null }]);
    setActiveKey(key);
  };

  const closeTab = key => {
    setTabs(t => {
      const filtered = t.filter(x => x.key !== key);
      if (!filtered.length) {
        onCloseAll();
        return t;
      }
      if (activeKey === key) setActiveKey(filtered[filtered.length - 1].key);
      return filtered;
    });
  };

  return (
    <div className="invoice-workspace">
      <div style={{display:'flex',gap:8,marginBottom:10}}><Button type={mode==='invoice'?'primary':'default'} onClick={()=>setMode('invoice')}>{screenLabel}</Button><Button type={mode==='return'?'primary':'default'} onClick={()=>setMode('return')}>Return {label}</Button></div><div className="invoice-tabbar">
        {tabs.map((t, i) => (
          <div key={t.key} className={`invoice-tab${activeKey === t.key ? ' active' : ''}`} onClick={() => setActiveKey(t.key)}>
            {t.editId ? `Edit ${label}` : `New ${label}`} #{i + 1}
            <span
              className="invoice-tab-close"
              onClick={e => {
                e.stopPropagation();
                closeTab(t.key);
              }}
            >
              ✕
            </span>
          </div>
        ))}
        <div className="invoice-tab invoice-tab-add" onClick={addTab}>
          +
        </div>
        <Button style={{ marginLeft: 'auto' }} onClick={onCloseAll}>
          Close
        </Button>
      </div>
      {mode==='return' ? <InlineReturnForm type={type} onSaved={onReload} /> : tabs.map(t => (
        <div key={t.key} style={{ display: activeKey === t.key ? 'block' : 'none' }}>
          <InvoiceForm
            type={type}
            existingId={t.editId}
            onSaved={() => {
              onReload();
              closeTab(t.key);
            }}
          />
        </div>
      ))}
    </div>
  );
}



/* =========================================================
   SALES
========================================================= */

function Sales({ onWorkspaceChange, onOpenTransaction }) {
 const [data,setData]=useState([]),[open,setOpen]=useState(false),[editId,setEditId]=useState(null),[view,setView]=useState(null),[search,setSearch]=useState('');
 const load=async(q='')=>setData(normalizeList((await API.get('/sales',{params:{q}})).data)); useEffect(()=>{load().catch(e=>message.error(getErrorMessage(e)))},[]);
 const openView=async row=>{try{setView((await API.get(`/sales/${row.id}`)).data)}catch(e){message.error(getErrorMessage(e))}};
 const openAdd=()=>{ if(onOpenTransaction){ onOpenTransaction('sale', null); return; } setEditId(null);setOpen(true);onWorkspaceChange?.(true)};
 const openEdit=row=>{ if(onOpenTransaction){ onOpenTransaction('sale', row.id); return; } setEditId(row.id);setOpen(true);onWorkspaceChange?.(true)};
 if(open) return <InvoiceWorkspace type="sale" editId={editId} onReload={load} onCloseAll={()=>{setOpen(false);setEditId(null);onWorkspaceChange?.(false);load()}}/>;
 return <><div className="page-head"><div><Typography.Title>Pharmacy Sales</Typography.Title><Input.Search allowClear style={{width:440}} placeholder="Search Invoice No / Mobile / Patient Name / CNIC / Item" value={search} onChange={e=>setSearch(e.target.value)} onSearch={v=>load(v)} onPressEnter={()=>load(search)} /></div><Button type="primary" icon={<PlusOutlined/>} onClick={openAdd}> Add Sale</Button></div>
 <Table rowKey="id" dataSource={data} columns={[{title:'Invoice',dataIndex:'invoice_no'},{title:'Patient',dataIndex:'patient_name',render:(x,r)=>x||r.patient_mobile||'Walk-in'},{title:'Total',dataIndex:'net_total',render:money},{title:'Paid',dataIndex:'paid',render:money},{title:'Due',render:(_,r)=>money(Number(r.net_total)-Number(r.paid))},{title:'Payment',dataIndex:'payment_method'},{title:'Date',dataIndex:'invoice_date'},{title:'Actions',render:(_,r)=><Space><Button size="small" icon={<EyeOutlined/>} onClick={()=>openView(r)}>View</Button><Button size="small" icon={<EditOutlined/>} onClick={()=>openEdit(r)}>Edit</Button><Button size="small" icon={<PrinterOutlined/>} onClick={()=>printDocument(r,'sale')}>Print</Button></Space>}]} pagination={{pageSize:10,showSizeChanger:true}}/>
 <Modal title="Sale Details" open={!!view} onCancel={()=>setView(null)} footer={<Button icon={<PrinterOutlined/>} onClick={()=>printDocument(view,'sale')}>Print Invoice</Button>} width={900}>{view&&<><Descriptions bordered column={3} items={[{key:'1',label:'Invoice',children:view.invoice_no},{key:'2',label:'Patient',children:view.patient_name||'Walk-in'},{key:'3',label:'Doctor',children:view.doctor_name||'-'},{key:'4',label:'Date',children:view.invoice_date},{key:'5',label:'Payment',children:view.payment_method},{key:'6',label:'Total',children:money(view.net_total)}]}/><Table rowKey="id" size="small" pagination={false} dataSource={view.items||[]} columns={[{title:'Item',dataIndex:'medicine_name'},{title:'Batch',dataIndex:'batch_no'},{title:'Expiry',dataIndex:'expiry_date'},{title:'Qty',dataIndex:'qty'},{title:'Rate',dataIndex:'unit_price',render:money},{title:'Discount',dataIndex:'discount',render:money},{title:'Tax',dataIndex:'tax',render:money},{title:'Total',dataIndex:'total',render:money}]}/></>}</Modal>
 </>;
}

async function printDocument(row, type) {
  if (!row) return;
  // List/report rows often do not contain invoice items. Always hydrate the
  // document before printing so Medicine / Qty / Price / Amount can never
  // disappear from the printed invoice.
  try {
    const endpoint = type === 'sale' ? '/sales' : type === 'purchase' ? '/purchases' : null;
    if (endpoint && row.id && (!Array.isArray(row.items) || !row.items.length)) {
      row = (await API.get(`${endpoint}/${row.id}`)).data || row;
    }
  } catch (e) {
    message.error(getErrorMessage(e));
    return;
  }
  let cfg = {};
  try { cfg = (await API.get('/settings')).data || {}; } catch {}
  const esc = v => String(v ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  if (type === 'statement') {
    const win = window.open('', '_blank');
    if (!win) { message.error('Please allow popups'); return; }
    const party = row.party || {};
    const invoices = row.invoices || [];
    const title = row.partyType === 'SUPPLIER' ? 'Payable Statement' : 'Tax Invoice \u2014 Statement of Account';
    win.document.write(`<html><head><title>${title}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;font-size:12px;color:#111}h1,h2{text-align:center;margin:4px}.meta{text-align:center;margin-bottom:14px;color:#444}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#f3f4f6}.num{text-align:right}.total-row td{font-weight:700;background:#f9fafb}.foot{text-align:center;margin-top:26px;font-size:10px;color:#555}.party{margin-top:10px}</style></head><body>
      <h1>Punjab Hospital</h1>
      <h2>${title}</h2>
      <div class="meta">Generated ${dateTime(new Date())}</div>
      <div class="party"><b>${esc(party.name || 'Party')}</b>${party.phone ? '<br>Phone: ' + esc(party.phone) : ''}${party.address ? '<br>' + esc(party.address) : ''}</div>
      <table><thead><tr><th>Invoice #</th><th>Date</th><th class="num">Total</th><th class="num">Paid</th><th class="num">Due</th></tr></thead><tbody>
        ${invoices.map(i => `<tr><td>${esc(i.invoice_no)}</td><td>${esc(i.invoice_date)}</td><td class="num">Rs. ${Number(i.net_total || 0).toFixed(2)}</td><td class="num">Rs. ${Number(i.paid || 0).toFixed(2)}</td><td class="num">Rs. ${Number(i.due || 0).toFixed(2)}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="4">Total Due</td><td class="num">Rs. ${Number(row.totalDue || 0).toFixed(2)}</td></tr>
      </tbody></table>
      <div class="foot">Please settle the above balance at your earliest convenience.<br>Xmart Solution \u00b7 0332-8327729</div>
      <script>window.onload=()=>window.print();</script>
    </body></html>`);
    win.document.close();
    return;
  }

  const win = window.open('', '_blank', 'width=420,height=700');
  if (!win) { message.error('Please allow popups'); return; }
  const title = row._documentTitle || (type === 'sale' ? 'Tax Invoice' : 'Purchase Invoice');
  const hospitalName = cfg.hospital_name || 'Punjab Hospital';
  const logo = cfg.logo_url || '';
  const phone = cfg.phone || '';
  const address = cfg.address || '';
  const licenseNo = cfg.license_no || '';
  const items = row.items || [];
  const itemRows = items.map(i => {
    const qty = Number(i.qty ?? i.quantity ?? i.sale_qty ?? i.purchase_qty ?? 0);
    const rate = Number(type === 'sale' ? (i.unit_price ?? i.price ?? 0) : (i.unit_cost ?? i.cost_price ?? i.price ?? 0));
    // Printed line Amount is always the gross line value (Qty × Rate).
    // Discounts are shown separately below the items, so a discounted line
    // must not display the discounted/net amount here.
    const amount = qty * rate;
    return `<tr><td class="item-name"><div class="medicine">${esc(i.medicine_name || i.name || '-')}</div>${i.batch_no ? `<div class="batch">Batch: ${esc(i.batch_no)}${type === 'purchase' && Number(i.bonus_qty||0) ? ` | Bonus: ${esc(i.bonus_qty)}` : ''}</div>` : (type === 'purchase' && Number(i.bonus_qty||0) ? `<div class="batch">Bonus: ${esc(i.bonus_qty)}</div>` : '')}</td><td class="num qty">${qty}</td><td class="num rate">${rate.toFixed(2)}</td><td class="num amt">${amount.toFixed(2)}</td></tr>`;
  }).join('');
  // Printed Sub Total is the gross item value BEFORE discount. The stored
  // invoice subtotal may already be net of line discounts, so calculate the
  // customer-facing gross subtotal from Qty x Price.
  const grossSubtotal = items.reduce((sum, i) => {
    const qty = Number(i.qty ?? i.quantity ?? i.sale_qty ?? i.purchase_qty ?? 0);
    const rate = Number(type === 'sale' ? (i.unit_price ?? i.price ?? 0) : (i.unit_cost ?? i.cost_price ?? i.price ?? 0));
    return sum + qty * rate;
  }, 0);
  const subtotal = grossSubtotal || Number(row.subtotal || 0) + Number(row.discount || 0);
  const discount = Number(row.discount || 0);
  const tax = Number(row.tax || 0);
  const roundOff = Number(row.round_off || 0);
  const total = Number(row.net_total || 0);
  const paid = Number(row.paid || 0);
  // Per requested receipt logic: Balance = Received - Total. A negative
  // balance means the customer still owes that amount; a positive balance
  // means the customer paid extra.
  const balance = paid - total;
  const saved = discount;
  const companyFooter = 'Xmart Solution LLC.';

  win.document.write(`<html><head><title>${title}</title><style>
@page{size:80mm auto;margin:3mm}
*{box-sizing:border-box}
body{font-family:Arial,sans-serif;width:74mm;max-width:74mm;margin:0 auto;font-size:10.5px;line-height:1.25;color:#111;overflow-wrap:anywhere}
.center{text-align:center}.header{padding-bottom:2px}.logo{display:block;margin:0 auto 3px;width:38mm;height:20mm;object-fit:contain}.hospital{font-size:17px;font-weight:800;text-transform:uppercase}.address,.contact{font-size:9px;line-height:1.2}.tax-title{font-size:12px;font-weight:800;margin-top:5px}.line{border-top:1px dashed #000;margin:6px 0}
.row{display:flex;justify-content:space-between;align-items:flex-start;gap:5px;margin:2px 0}.row span:last-child,.row b:last-child{max-width:62%;text-align:right;overflow-wrap:anywhere}
.items{width:100%;table-layout:fixed;border-collapse:collapse;margin:2px 0}
.items col.item{width:43%}.items col.qty{width:13%}.items col.rate{width:21%}.items col.amt{width:23%}
.items th,.items td{padding:3px 1px;border-bottom:1px dotted #aaa;vertical-align:top;overflow:hidden}
.items th{font-weight:700;white-space:nowrap}.items th:first-child,.items td:first-child{text-align:left;padding-left:0}.items .num{text-align:right;white-space:nowrap;padding-right:0}
.item-name{word-break:break-word}.medicine{font-weight:600;line-height:1.2}.batch{font-size:8.5px;font-weight:400;line-height:1.2;margin-top:1px;word-break:break-all;color:#333}
.total{font-size:14px;font-weight:700;margin-top:3px}.saved{display:flex;justify-content:space-between;border-top:1px dashed #000;border-bottom:1px dashed #000;padding:5px 0;margin-top:8px;font-weight:700}.foot{text-align:center;margin-top:10px;font-size:9px;font-weight:700}
</style></head><body><div class="center header">${logo ? `<img class="logo" src="${esc(logo)}" alt="Logo">` : ''}<div class="hospital">${esc(hospitalName)}</div>${address ? `<div class="address">${esc(address).replace(/\n/g,'<br>')}</div>` : ''}${phone ? `<div class="contact">Ph: ${esc(phone)}</div>` : ''}${licenseNo ? `<div class="contact">License No: ${esc(licenseNo)}</div>` : ''}<div class="tax-title">${esc(title)}</div></div><div class="line"></div><div class="row"><span>Invoice No</span><b>${esc(row.invoice_no)}</b></div><div class="row"><span>Date</span><span>${esc(row.invoice_date)}</span></div>${type === 'sale' ? `<div class="row"><span>Patient</span><span>${esc(row.patient_name || 'Walk-in')}</span></div>${row.patient_mobile ? `<div class="row"><span>Phone</span><span>${esc(row.patient_mobile)}</span></div>` : ''}` : `<div class="row"><span>Supplier</span><span>${esc(row.supplier_name || '-')}</span></div>${row.supplier_phone ? `<div class="row"><span>Phone</span><span>${esc(row.supplier_phone)}</span></div>` : ''}`}<div class="line"></div><table class="items"><colgroup><col class="item"><col class="qty"><col class="rate"><col class="amt"></colgroup><thead><tr><th>Medicine</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${itemRows}</tbody></table><div class="line"></div><div class="row"><span>Sub Total</span><span>Rs. ${subtotal.toFixed(2)}</span></div><div class="row"><span>Disc.</span><span>Rs. ${discount.toFixed(2)}</span></div>${type === 'sale' ? `<div class="row"><span>Round Off</span><span>Rs. ${roundOff.toFixed(2)}</span></div>` : ''}${type === 'sale' && tax ? `<div class="row"><span>Tax</span><span>Rs. ${tax.toFixed(2)}</span></div>` : ''}<div class="row total"><span>Total</span><span>Rs. ${total.toFixed(2)}</span></div><div class="line"></div><div class="row"><span>${type === 'sale' ? 'Received' : 'Paid'}</span><span>Rs. ${paid.toFixed(2)}</span></div><div class="row"><span>Balance</span><span>Rs. ${balance.toFixed(2)}</span></div>${type === 'sale' ? `<div class="saved"><span>You Saved</span><span>Rs. ${saved.toFixed(2)}</span></div>` : ''}<div class="center">Thank you</div><div class="foot">Terms & Conditions apply<br>${companyFooter}</div><script>window.onload=()=>{const imgs=[...document.images]; Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r}))).then(()=>setTimeout(()=>window.print(),150));};</script></body></html>`);
  win.document.close();
}


/* =========================================================
   PURCHASES
========================================================= */

function Purchases({ onWorkspaceChange, onOpenTransaction }) {
 const [data,setData]=useState([]),[open,setOpen]=useState(false),[editId,setEditId]=useState(null),[view,setView]=useState(null),[search,setSearch]=useState('');
 const load=async(q='')=>setData(normalizeList((await API.get('/purchases',{params:{q}})).data));useEffect(()=>{load().catch(e=>message.error(getErrorMessage(e)))},[]);
 const openView=async row=>{try{setView((await API.get(`/purchases/${row.id}`)).data)}catch(e){message.error(getErrorMessage(e))}};
 const openAdd=()=>{ if(onOpenTransaction){ onOpenTransaction('purchase', null); return; } setEditId(null);setOpen(true);onWorkspaceChange?.(true)}; const openEdit=row=>{ if(onOpenTransaction){ onOpenTransaction('purchase', row.id); return; } setEditId(row.id);setOpen(true);onWorkspaceChange?.(true)};
 if(open) return <InvoiceWorkspace type="purchase" editId={editId} onReload={load} onCloseAll={()=>{setOpen(false);setEditId(null);onWorkspaceChange?.(false);load()}}/>;
 return <><div className="page-head"><div><Typography.Title>Purchases</Typography.Title><Input.Search allowClear style={{width:440}} placeholder="Search Bill No / Supplier Name / Mobile / Tax No / Item" value={search} onChange={e=>setSearch(e.target.value)} onSearch={v=>load(v)} onPressEnter={()=>load(search)} /></div><Button type="primary" icon={<PlusOutlined/>} onClick={openAdd}> Add Purchase</Button></div><Table rowKey="id" dataSource={data} columns={[{title:'Bill Number',dataIndex:'invoice_no'},{title:'Party',dataIndex:'supplier_name'},{title:'Subtotal',dataIndex:'subtotal',render:money},{title:'Tax',dataIndex:'tax',render:money},{title:'Net',dataIndex:'net_total',render:money},{title:'Paid',dataIndex:'paid',render:money},{title:'Date',dataIndex:'invoice_date'},{title:'Actions',render:(_,r)=><Space><Button size="small" icon={<EyeOutlined/>} onClick={()=>openView(r)}>View</Button><Button size="small" icon={<EditOutlined/>} onClick={()=>openEdit(r)}>Edit</Button><Button size="small" icon={<PrinterOutlined/>} onClick={()=>printDocument(r,'purchase')}>Print</Button></Space>}]} pagination={{pageSize:10,showSizeChanger:true}}/><Modal title="Purchase Details" open={!!view} onCancel={()=>setView(null)} footer={<Button icon={<PrinterOutlined/>} onClick={()=>printDocument(view,'purchase')}>Print Purchase</Button>} width={900}>{view&&<><Descriptions bordered column={3} items={[{key:'1',label:'Bill Number',children:view.invoice_no},{key:'2',label:'Supplier',children:view.supplier_name||'-'},{key:'3',label:'Date',children:view.invoice_date},{key:'4',label:'Total',children:money(view.net_total)},{key:'5',label:'Paid',children:money(view.paid)}]}/><Table rowKey="id" size="small" pagination={false} dataSource={view.items||[]} columns={[{title:'Item',dataIndex:'medicine_name'},{title:'Batch',dataIndex:'batch_no'},{title:'Expiry',dataIndex:'expiry_date'},{title:'Qty',dataIndex:'qty'},{title:'Bonus',dataIndex:'bonus_qty',render:v=>Number(v||0)},{title:'Cost',dataIndex:'unit_cost',render:money},{title:'Total',dataIndex:'total',render:money}]}/></>}</Modal></>;
}

/* =========================================================
   SUPPLIERS
========================================================= */

function Suppliers() {

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [q, setQ] =
    useState('');

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [viewSupplier, setViewSupplier] =
    useState(null);

  const [viewModal, setViewModal] =
    useState(false);

  const [form] =
    Form.useForm();


  const load = async () => {

    setLoading(true);

    try {

      const response =
        await API.get(
          '/suppliers',
          {
            params: { q }
          }
        );


      setData(
        normalizeList(
          response.data
        )
      );

    } catch (error) {

      message.error(
        getErrorMessage(error) ||
        'Could not load suppliers'
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    load();

  }, [q]);


  const openAdd = () => {

    setEditing(null);

    form.resetFields();

    form.setFieldsValue({

      opening_balance: 0

    });

    setOpen(true);

  };


  const openEdit = supplier => {

    setEditing(supplier);

    form.setFieldsValue({

      name:
        supplier.name,

      phone:
        supplier.phone,

      address:
        supplier.address,

      tax_number:
        supplier.tax_number,

      opening_balance:
        Number(
          supplier.opening_balance || 0
        )

    });

    setOpen(true);

  };


  const saveSupplier = async values => {

    try {

      const payload = {

        name:
          values.name?.trim(),

        phone:
          values.phone?.trim() ||
          null,

        address:
          values.address?.trim() ||
          null,

        tax_number:
          values.tax_number?.trim() ||
          null,

        opening_balance:
          Number(
            values.opening_balance || 0
          )

      };


      if (!payload.name) {

        message.warning(
          'Supplier name is required'
        );

        return;

      }


      if (editing) {

        await API.put(

          `/suppliers/${editing.id}`,

          payload

        );


        message.success(
          'Supplier updated successfully'
        );

      } else {

        await API.post(

          '/suppliers',

          payload

        );


        message.success(
          'Supplier added successfully'
        );

      }


      setOpen(false);

      setEditing(null);

      form.resetFields();

      await load();

    } catch (error) {

      message.error(
        getErrorMessage(error) ||
        'Could not save supplier'
      );

    }

  };


  const deleteSupplier = async supplier => {

    try {

      await API.delete(
        `/suppliers/${supplier.id}`
      );

      message.success(
        'Supplier deleted successfully'
      );

      await load();

    } catch (error) {

      message.error(
        getErrorMessage(error) ||
        'Could not delete supplier'
      );

    }

  };


  const openView = async supplier => {

    try {

      const response =
        await API.get(
          `/suppliers/${supplier.id}`
        );


      setViewSupplier(
        response.data?.data ||
        response.data
      );


      setViewModal(true);

    } catch (error) {

      message.error(
        getErrorMessage(error) ||
        'Could not load supplier'
      );

    }

  };


  const columns = [

    {
      title: 'Name',
      dataIndex: 'name',
      width: 200
    },

    {
      title: 'Phone',
      dataIndex: 'phone',
      width: 140,

      render: value =>
        value || '-'

    },

    {
      title: 'Tax Number',
      dataIndex: 'tax_number',
      width: 140,

      render: value =>
        value || '-'

    },

    {
      title: 'Opening Balance',
      dataIndex: 'opening_balance',
      width: 150,
      render: money
    },

    {
      title: 'Purchases',
      dataIndex: 'purchase_count',
      width: 110,

      render: value =>
        Number(value || 0)

    },

    {
      title: 'Total Purchased',
      dataIndex: 'total_purchases',
      width: 150,
      render: money
    },

    {
      title: 'Action',
      fixed: 'right',
      width: 260,

      render: (_, supplier) => (

        <Space wrap>

          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              openView(supplier)
            }
          >
            View
          </Button>


          <Button
            size="small"
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() =>
              openEdit(supplier)
            }
          >
            Edit
          </Button>


          <Popconfirm

            title="Delete supplier?"

            description={
              Number(
                supplier.purchase_count || 0
              ) > 0
                ? 'This supplier has purchase history. Are you sure?'
                : 'The supplier will be deleted.'
            }

            okText="Delete"

            cancelText="Cancel"

            okButtonProps={{
              danger: true
            }}

            onConfirm={() =>
              deleteSupplier(
                supplier
              )
            }

          >

            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>

          </Popconfirm>

        </Space>

      )

    }

  ];


  return (

    <>

      <div className="page-head">

        <div>

          <Typography.Title>
            Suppliers
          </Typography.Title>

          <Input.Search

            placeholder="Search name, phone or tax number"

            allowClear

            onSearch={setQ}

            style={{
              width: 360,
              maxWidth: '100%'
            }}

          />

        </div>


        <Space>

          <Button
            icon={<ReloadOutlined />}
            onClick={load}
            loading={loading}
          >
            Refresh
          </Button>


          <Button
            type="primary"
            onClick={openAdd}
          >
            + Add Party
          </Button>

        </Space>

      </div>


      <Table

        rowKey="id"

        loading={loading}

        dataSource={data}

        columns={columns}

        scroll={{
          x: 1200
        }}

        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total =>
            `Total ${total} suppliers`
        }}

      />


      <Modal

        title={
          editing
            ? 'Edit Party'
            : 'Add Party'
        }

        open={open}

        onCancel={() => {

          setOpen(false);

          setEditing(null);

          form.resetFields();

        }}

        footer={null}

        width={650}

        destroyOnClose

      >

        <Form

          form={form}

          layout="vertical"

          onFinish={saveSupplier}

        >

          <Row gutter={12}>

            <Col span={24}>

              <Form.Item

                name="name"

                label="Party Name"

                rules={[
                  {
                    required: true,
                    message:
                      'Supplier name is required'
                  }
                ]}

              >

                <Input
                  placeholder="e.g. Getz Pharma"
                />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item

                name="phone"

                label="Phone"

              >

                <Input
                  placeholder="e.g. 0300-1234567"
                />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item

                name="tax_number"

                label="Tax Number"

              >

                <Input
                  placeholder="NTN / STRN"
                />

              </Form.Item>

            </Col>


            <Col span={12}>

              <Form.Item

                name="opening_balance"

                label="Opening Balance"

              >

                <InputNumber

                  min={0}

                  precision={2}

                  style={{
                    width: '100%'
                  }}

                />

              </Form.Item>

            </Col>


            <Col span={24}>

              <Form.Item

                name="address"

                label="Address"

              >

                <Input.TextArea rows={3} />

              </Form.Item>

            </Col>

          </Row>


          <Space>

            <Button
              type="primary"
              htmlType="submit"
            >
              {
                editing
                  ? 'Update Supplier'
                  : 'Save Supplier'
              }
            </Button>


            <Button
              onClick={() => {

                setOpen(false);

                setEditing(null);

                form.resetFields();

              }}
            >
              Cancel
            </Button>

          </Space>

        </Form>

      </Modal>


      <Modal

        title="Party Details"

        open={viewModal}

        onCancel={() => {

          setViewModal(false);

          setViewSupplier(null);

        }}

        footer={null}

        width={600}

      >

        {viewSupplier && (

          <Card>

            <Row gutter={[16, 16]}>

              <Col span={12}>
                <b>Name</b>
                <div>
                  {viewSupplier.name || '-'}
                </div>
              </Col>


              <Col span={12}>
                <b>Phone</b>
                <div>
                  {viewSupplier.phone || '-'}
                </div>
              </Col>


              <Col span={12}>
                <b>Tax Number</b>
                <div>
                  {viewSupplier.tax_number || '-'}
                </div>
              </Col>


              <Col span={12}>
                <b>Opening Balance</b>
                <div>
                  {money(viewSupplier.opening_balance)}
                </div>
              </Col>


              <Col span={12}>
                <b>Purchases</b>
                <div>
                  {Number(viewSupplier.purchase_count || 0)}
                </div>
              </Col>


              <Col span={12}>
                <b>Total Purchased</b>
                <div>
                  {money(viewSupplier.total_purchases)}
                </div>
              </Col>


              <Col span={24}>
                <b>Address</b>
                <div>
                  {viewSupplier.address || '-'}
                </div>
              </Col>

            </Row>

          </Card>

        )}

      </Modal>

    </>

  );

}


/* =========================================================
   SIMPLE NAME-ONLY CRUD (used by Categories & Units)
========================================================= */

function SimpleLookupCrud({ title, endpoint, itemLabel }) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/${endpoint}`, { params: { q } });
      setData(normalizeList(response.data));
    } catch (error) {
      message.error(getErrorMessage(error) || `Could not load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [q]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = row => {
    setEditing(row);
    form.setFieldsValue({ name: row.name });
    setOpen(true);
  };

  const save = async values => {
    try {
      const name = values.name?.trim();

      if (!name) {
        message.warning(`${itemLabel} name is required`);
        return;
      }

      if (editing) {
        await API.put(`/${endpoint}/${editing.id}`, { name });
        message.success(`${itemLabel} updated successfully`);
      } else {
        await API.post(`/${endpoint}`, { name });
        message.success(`${itemLabel} added successfully`);
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
      await load();
    } catch (error) {
      message.error(getErrorMessage(error) || `Could not save ${itemLabel.toLowerCase()}`);
    }
  };

  const remove = async row => {
    try {
      await API.delete(`/${endpoint}/${row.id}`);
      message.success(`${itemLabel} deleted successfully`);
      await load();
    } catch (error) {
      message.error(getErrorMessage(error) || `Could not delete ${itemLabel.toLowerCase()}`);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Items Using This', dataIndex: 'item_count', width: 160, render: v => v || 0 },
    {
      title: 'Actions',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>Edit</Button>
          <Popconfirm
            title={`Delete this ${itemLabel.toLowerCase()}?`}
            onConfirm={() => remove(row)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div className="page-head">
        <Typography.Title>{title}</Typography.Title>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={`Search ${title.toLowerCase()}`}
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            + Add {itemLabel}
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editing ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Save'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item
            name="name"
            label={`${itemLabel} Name`}
            rules={[{ required: true, message: `${itemLabel} name is required` }]}
          >
            <Input placeholder={`${itemLabel} name`} autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function Categories() {
  return <SimpleLookupCrud title="Categories" endpoint="categories" itemLabel="Category" />;
}

function Units() {
  return <SimpleLookupCrud title="Units" endpoint="units" itemLabel="Unit" />;
}


/* =========================================================
   STOCK LEDGER
========================================================= */

function stockStatus(stock, reorderLevel) {

  const s = Number(stock || 0);
  const r = Number(reorderLevel || 0);

  if (s <= 0) {
    return { label: 'Out of Stock', color: 'red' };
  }

  if (r > 0 && s <= r) {
    return { label: 'Low Stock', color: 'orange' };
  }

  return { label: 'In Stock', color: 'green' };

}


function Stock() {

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [expiryFilter, setExpiryFilter] =
    useState(false);

  const [viewItem, setViewItem] =
    useState(null);

  const [viewBatches, setViewBatches] =
    useState([]);

  const [viewLoading, setViewLoading] =
    useState(false);

  const [viewModal, setViewModal] =
    useState(false);


  const load = async () => {

    setLoading(true);

    try {

      const response =
        await API.get(
          '/inventory/stock'
        );


      setData(
        normalizeList(
          response.data
        )
      );

    } catch (error) {

      message.error(
        getErrorMessage(error) ||
        'Could not load stock'
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    load();

  }, []);


  const filtered =
    data.filter(item => {

      const text =
        `${item.name || ''} ${
          item.generic_name || ''
        }`.toLowerCase();


      if (
        !text.includes(
          search.toLowerCase()
        )
      ) {

        return false;

      }


      if (statusFilter === 'all') {

        return true;

      }


      const status =
        stockStatus(
          item.stock,
          item.reorder_level
        );


      if (statusFilter === 'low') {

        return status.label === 'Low Stock';

      }


      if (statusFilter === 'out') {

        return status.label === 'Out of Stock';

      }


      if (statusFilter === 'in') {

        return status.label === 'In Stock';

      }

      if (statusFilter === 'expiry90') {
        if (!item.nearest_expiry_date) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const exp = new Date(String(item.nearest_expiry_date).slice(0,10));
        const days = Math.ceil((exp - today) / 86400000);
        return days >= 0 && days <= 90;
      }

      return true;

    });


  const totals = {

    items:
      data.length,

    totalStock:
      data.reduce(
        (sum, item) =>
          sum + Number(item.stock || 0),
        0
      ),

    low:
      data.filter(
        item =>
          stockStatus(
            item.stock,
            item.reorder_level
          ).label === 'Low Stock'
      ).length,

    out:
      data.filter(
        item =>
          stockStatus(
            item.stock,
            item.reorder_level
          ).label === 'Out of Stock'
      ).length

  };


  const openView = async medicine => {

    setViewItem(medicine);

    setViewModal(true);

    setViewLoading(true);

    setViewBatches([]);

    try {

      const response =
        await API.get(
          '/sales/batches'
        );


      const rows =
        normalizeList(
          response.data
        );


      setViewBatches(

        rows.filter(
          batch =>
            String(batch.medicine_id) ===
            String(medicine.id)
        )

      );

    } catch (error) {

      message.error(
        getErrorMessage(error) ||
        'Could not load batch details'
      );

    } finally {

      setViewLoading(false);

    }

  };


  const columns = [

    {
      title: 'Item',
      dataIndex: 'name',

      sorter: (a, b) =>
        (a.name || '').localeCompare(
          b.name || ''
        )

    },

    {
      title: 'Generic',
      dataIndex: 'generic_name',

      render: value =>
        value || '-'

    },

    {
      title: 'Current Stock',
      dataIndex: 'stock',
      width: 140,

      sorter: (a, b) =>
        Number(a.stock || 0) -
        Number(b.stock || 0),

      render: (value, row) => {

        const status =
          stockStatus(
            value,
            row.reorder_level
          );


        return (

          <Tag color={status.color}>
            {Number(value || 0)}
          </Tag>

        );

      }

    },

    {
      title: 'Reorder Level',
      dataIndex: 'reorder_level',
      width: 130,

      render: value =>
        Number(value || 0)

    },

    {
      title: 'Status',
      width: 130,

      render: (_, row) => {

        const status =
          stockStatus(
            row.stock,
            row.reorder_level
          );


        return (
          <Tag color={status.color}>
            {status.label}
          </Tag>
        );

      }

    },

    {
      title: 'Action',
      width: 110,

      render: (_, row) => (

        <Button

          size="small"

          icon={<EyeOutlined />}

          onClick={() =>
            openView(row)
          }

        >
          View
        </Button>

      )

    }

  ];


  return (

    <>

      <Typography.Title>
        Stock Ledger
      </Typography.Title>


      <Row
        gutter={[16, 16]}
        style={{
          marginBottom: 16
        }}
      >

        <Col xs={24} sm={12} lg={6}>

          <Card>

            <Statistic
              title="Total Medicines"
              value={totals.items}
            />

          </Card>

        </Col>


        <Col xs={24} sm={12} lg={6}>

          <Card>

            <Statistic
              title="Total Units in Stock"
              value={totals.totalStock}
            />

          </Card>

        </Col>


        <Col xs={24} sm={12} lg={6}>

          <Card>

            <Statistic

              title="Low Stock Items"

              value={totals.low}

              valueStyle={{
                color: '#d46b08'
              }}

            />

          </Card>

        </Col>


        <Col xs={24} sm={12} lg={6}>

          <Card>

            <Statistic

              title="Out of Stock Items"

              value={totals.out}

              valueStyle={{
                color: '#cf1322'
              }}

            />

          </Card>

        </Col>

      </Row>


      <div className="page-head">

        <Input.Search

          placeholder="Search by medicine or generic name"

          allowClear

          value={search}

          onChange={e =>
            setSearch(
              e.target.value
            )
          }

          style={{
            width: 320,
            maxWidth: '100%'
          }}

        />

        <Space wrap>

          <Select

            value={statusFilter}

            onChange={setStatusFilter}

            style={{
              width: 160
            }}

            options={[

              {
                label: 'All Statuses',
                value: 'all'
              },

              {
                label: 'In Stock',
                value: 'in'
              },

              {
                label: 'Low Stock',
                value: 'low'
              },

              {
                label: 'Out of Stock',
                value: 'out'
              },
              {
                label: 'Expiry < 90 Days',
                value: 'expiry90'
              }

            ]}

          />

          <Button
            icon={<ReloadOutlined />}
            onClick={load}
            loading={loading}
          >
            Refresh
          </Button>

        </Space>

      </div>


      <Table

        rowKey="id"

        loading={loading}

        dataSource={filtered}

        columns={columns}

        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total =>
            `Total ${total} medicines`
        }}

      />


      <Modal

        title={
          viewItem
            ? `Stock Detail — ${viewItem.name}`
            : 'Stock Detail'
        }

        open={viewModal}

        onCancel={() => {

          setViewModal(false);

          setViewItem(null);

          setViewBatches([]);

        }}

        footer={null}

        width={800}

      >

        {viewItem && (

          <>

            <Row
              gutter={[16, 16]}
              style={{
                marginBottom: 16
              }}
            >

              <Col span={8}>
                <b>Generic Name</b>
                <div>
                  {
                    viewItem.generic_name ||
                    '-'
                  }
                </div>
              </Col>


              <Col span={8}>
                <b>Current Stock</b>
                <div>

                  <Tag
                    color={
                      stockStatus(
                        viewItem.stock,
                        viewItem.reorder_level
                      ).color
                    }
                  >
                    {
                      Number(
                        viewItem.stock || 0
                      )
                    }
                  </Tag>

                </div>
              </Col>


              <Col span={8}>
                <b>Reorder Level</b>
                <div>
                  {
                    Number(
                      viewItem.reorder_level || 0
                    )
                  }
                </div>
              </Col>

            </Row>


            <Typography.Title level={5}>
              Batch Breakdown
            </Typography.Title>

            <Table

              size="small"

              rowKey="id"

              loading={viewLoading}

              dataSource={viewBatches}

              pagination={false}

              columns={[

                {
                  title: 'Batch No',
                  dataIndex: 'batch_no'
                },

                {
                  title: 'Expiry',
                  dataIndex: 'expiry_date',

                  render: value =>
                    value
                      ? String(value).substring(0, 10)
                      : '-'

                },

                {
                  title: 'Purchase Price',
                  dataIndex: 'purchase_price',
                  render: money
                },

                {
                  title: 'Sale Price',
                  dataIndex: 'sale_price',
                  render: money
                },

                {
                  title: 'MRP',
                  dataIndex: 'mrp',
                  render: money
                },

                {
                  title: 'Batch Stock',
                  dataIndex: 'stock',

                  render: value => (

                    <Tag
                      color={
                        Number(value || 0) <= 0
                          ? 'red'
                          : 'green'
                      }
                    >
                      {Number(value || 0)}
                    </Tag>

                  )

                }

              ]}

            />

          </>

        )}

      </Modal>

    </>

  );

}



function ExpenseWorkspace({ id, onReload, onClose }) {
  const [form] = Form.useForm();
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = (await API.get(`/expenses/${id}`)).data;
        form.setFieldsValue({ expense_date:String(r.expense_date || '').slice(0,10), category:r.category || '', description:r.description || '', amount:Number(r.amount || 0), payment_method:r.payment_method || 'Cash' });
      } catch (e) { message.error(getErrorMessage(e)); }
    })();
  }, [id]);
  const save = async values => {
    setSaving(true);
    try { await API.put(`/expenses/${id}`, values); message.success('Expense updated'); onReload?.(); onClose?.(); }
    catch (e) { message.error(getErrorMessage(e)); }
    finally { setSaving(false); }
  };
  return <div className="invoice-workspace">
    <div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <Typography.Title style={{margin:0}}>Edit Expense</Typography.Title><Button onClick={onClose}>Close</Button>
    </div>
    <Card><Form form={form} layout="vertical" onFinish={save}><Row gutter={12}>
      <Col xs={24} md={6}><Form.Item name="expense_date" label="Date" rules={[{required:true}]}><Input type="date" /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="category" label="Category" rules={[{required:true}]}><Input /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="amount" label="Amount" rules={[{required:true}]}><InputNumber min={0.01} style={{width:'100%'}} /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="payment_method" label="Payment Method" rules={[{required:true}]}><Select options={['Cash','Bank','Card','Online'].map(v=>({label:v,value:v}))} /></Form.Item></Col>
      <Col span={24}><Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item></Col>
    </Row><Space><Button onClick={onClose}>Close</Button><Button type="primary" htmlType="submit" loading={saving}>Update Expense</Button></Space></Form></Card>
  </div>;
}

/* =========================================================
   ACCOUNTING
========================================================= */

function Accounting(){const [tb,setTb]=useState({rows:[]}),[bs,setBs]=useState({Assets:[],Liabilities:[],Equity:[],totals:{}}),[from,setFrom]=useState('2000-01-01'),[to,setTo]=useState(localYmd());const load=async()=>{const [a,b]=await Promise.all([API.get('/accounting/trial-balance',{params:{from,to}}),API.get('/accounting/balance-sheet',{params:{from,to}})]);setTb(a.data);setBs(b.data)};useEffect(()=>{load().catch(e=>message.error(getErrorMessage(e)))},[]);const section=(title,rows,total)=>(<Card title={title} style={{marginBottom:12}}><Table size="small" pagination={false} rowKey="code" dataSource={rows} columns={[{title:'Code',dataIndex:'code'},{title:'Account',dataIndex:'name'},{title:'Balance',dataIndex:'balance',render:money}]} summary={()=> <Table.Summary.Row><Table.Summary.Cell index={0} colSpan={2}><b>Total {title}</b></Table.Summary.Cell><Table.Summary.Cell index={2}><b>{money(total)}</b></Table.Summary.Cell></Table.Summary.Row>}/></Card>);return <><div className="page-head"><Typography.Title>Accounting</Typography.Title><Space><Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><Input type="date" value={to} onChange={e=>setTo(e.target.value)}/><Button type="primary" onClick={load}>Generate</Button></Space></div><Row gutter={[16,16]}><Col xs={24} lg={8}><Card title="Trial Balance Control"><Statistic title="Total Debit" value={tb.totalDebit||0} precision={2} prefix="Rs. "/><Statistic title="Total Credit" value={tb.totalCredit||0} precision={2} prefix="Rs. "/><Tag color={Math.abs(Number(tb.totalDebit||0)-Number(tb.totalCredit||0))<0.01?'green':'red'}>{Math.abs(Number(tb.totalDebit||0)-Number(tb.totalCredit||0))<0.01?'Balanced':'Out of Balance'}</Tag></Card></Col><Col xs={24} lg={16}><Card title="Trial Balance"><Table rowKey="code" dataSource={tb.rows||[]} pagination={{pageSize:15}} columns={[{title:'Code',dataIndex:'code'},{title:'Account',dataIndex:'name'},{title:'Type',dataIndex:'account_type'},{title:'Debit',dataIndex:'debit',render:money},{title:'Credit',dataIndex:'credit',render:money}]}/></Card></Col></Row><Typography.Title level={4}>Balance Sheet</Typography.Title>{section('Assets',bs.Assets||[],bs.totals?.Assets||0)}{section('Liabilities',bs.Liabilities||[],bs.totals?.Liabilities||0)}{section('Equity',bs.Equity||[],bs.totals?.Equity||0)}<Card><Row><Col span={8}><Statistic title="Total Assets" value={bs.totals?.Assets||0} precision={2} prefix="Rs. "/></Col><Col span={8}><Statistic title="Total Liabilities" value={bs.totals?.Liabilities||0} precision={2} prefix="Rs. "/></Col><Col span={8}><Statistic title="Total Equity" value={bs.totals?.Equity||0} precision={2} prefix="Rs. "/></Col></Row></Card></>}


/* =========================================================
   EXPENSES
========================================================= */

function Expenses() {

  const [data, setData] =
    useState([]);

  const [form] =
    Form.useForm();


  const load = async () => {

    const response =
      await API.get(
        '/expenses'
      );


    setData(
      response.data
    );

  };


  useEffect(() => {

    load().catch(() =>
      message.error(
        'Could not load expenses'
      )
    );

  }, []);


  return (

    <>

      <Typography.Title>
        Expenses
      </Typography.Title>


      <Card
        style={{
          marginBottom: 16
        }}
      >

        <Form

          form={form}

          layout="inline"

          onFinish={async values => {

            try {

              await API.post(
                '/expenses',
                values
              );


              message.success(
                'Expense saved'
              );


              form.resetFields();

              await load();

            } catch (error) {

              message.error(
                error.response?.data?.message ||
                'Failed'
              );

            }

          }}

        >

          <Form.Item

            name="category"

            rules={[
              {
                required: true
              }
            ]}

          >

            <Input
              placeholder="Category"
            />

          </Form.Item>


          <Form.Item
            name="description"
          >

            <Input
              placeholder="Description"
            />

          </Form.Item>


          <Form.Item

            name="amount"

            rules={[
              {
                required: true
              }
            ]}

          >

            <InputNumber
              placeholder="Amount"
            />

          </Form.Item>


          <Form.Item

            name="payment_method"

            initialValue="Cash"

          >

            <Select

              style={{
                width: 130
              }}

              options={[

                'Cash',

                'Bank',

                'Card',

                'Online'

              ].map(
                value => ({
                  label: value,
                  value
                })
              )}

            />

          </Form.Item>


          <Button
            type="primary"
            htmlType="submit"
          >
            Add Expense
          </Button>

        </Form>

      </Card>


      <Table

        rowKey="id"

        dataSource={data}

        columns={[

          {
            title: 'Date',
            dataIndex:
              'expense_date'
          },

          {
            title: 'Category',
            dataIndex:
              'category'
          },

          {
            title: 'Description',
            dataIndex:
              'description'
          },

          {
            title: 'Amount',
            dataIndex:
              'amount',
            render: money
          },

          {
            title: 'Payment',
            dataIndex:
              'payment_method'
          }

        ]}

      />

    </>

  );

}


/* =========================================================
   USERS, ROLES & PERMISSIONS
========================================================= */

function UsersRolesPermissions({ active = false }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [userOpen, setUserOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, r, p] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/roles'),
        API.get('/admin/permissions')
      ]);
      setUsers(u.data || []);
      setRoles(r.data || []);
      setPermissions(p.data || []);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (active) loadAll(); }, [active]);

  const openUser = user => {
    setEditingUser(user || null);
    if (user) {
      const role = roles.find(r => (user.roles || '').split(', ').includes(r.name));
      userForm.setFieldsValue({ name:user.name, email:user.email, role_id:role?.id, is_active:!!user.is_active, password:'' });
    } else userForm.resetFields();
    setUserOpen(true);
  };

  const saveUser = async values => {
    try {
      if (editingUser) await API.put(`/admin/users/${editingUser.id}`, values);
      else await API.post('/admin/users', values);
      message.success(editingUser ? 'User updated successfully' : 'User created successfully');
      setUserOpen(false); await loadAll();
    } catch (e) { message.error(getErrorMessage(e)); }
  };

  const openRole = role => {
    setEditingRole(role || null);
    roleForm.setFieldsValue({ name:role?.name || '', permission_ids:(role?.permission_ids || []).map(Number) });
    setRoleOpen(true);
  };

  const saveRole = async values => {
    try {
      if (editingRole) await API.put(`/admin/roles/${editingRole.id}`, values);
      else await API.post('/admin/roles', values);
      message.success(editingRole ? 'Role and permissions updated' : 'Role created');
      setRoleOpen(false); await loadAll();
    } catch (e) { message.error(getErrorMessage(e)); }
  };

  const permissionLabel = code => code.replace(/\./g, ' › ').replace(/\b\w/g, c => c.toUpperCase());

  return <div>
    <div className="page-head"><Typography.Title>Users, Roles & Permissions</Typography.Title></div>
    <Card loading={loading}>
      <Space style={{marginBottom:16}}>
        <Button type={tab==='users'?'primary':'default'} onClick={()=>setTab('users')}>Users</Button>
        <Button type={tab==='roles'?'primary':'default'} onClick={()=>setTab('roles')}>Roles & Permissions</Button>
        {tab==='users' ? <Button type="primary" icon={<PlusOutlined/>} onClick={()=>openUser()}>New User</Button> : <Button type="primary" icon={<PlusOutlined/>} onClick={()=>openRole()}>New Role</Button>}
        <Button icon={<ReloadOutlined/>} onClick={loadAll}>Refresh</Button>
      </Space>

      {tab==='users' ? <Table rowKey="id" dataSource={users} pagination={{pageSize:10}} columns={[
        {title:'Name',dataIndex:'name'},
        {title:'Email',dataIndex:'email'},
        {title:'Role',dataIndex:'roles',render:v=>v||'-'},
        {title:'Status',dataIndex:'is_active',render:v=><Tag color={v?'green':'red'}>{v?'Active':'Inactive'}</Tag>},
        {title:'Created',dataIndex:'created_at',render:v=>v?dateTime(v):'-'},
        {title:'Action',render:(_,r)=><Button size="small" icon={<EditOutlined/>} onClick={()=>openUser(r)}>Edit</Button>}
      ]}/> : <Table rowKey="id" dataSource={roles} pagination={false} columns={[
        {title:'Role',dataIndex:'name'},
        {title:'Permissions',dataIndex:'permission_ids',render:ids=><Space wrap>{(ids||[]).map(id=>{const p=permissions.find(x=>x.id===Number(id)); return p?<Tag key={id}>{p.code}</Tag>:null})}</Space>},
        {title:'Action',render:(_,r)=><Button size="small" icon={<EditOutlined/>} onClick={()=>openRole(r)}>Edit Permissions</Button>}
      ]}/>} 
    </Card>

    <Modal title={editingUser ? 'Edit User' : 'Create New User'} open={userOpen} onCancel={()=>setUserOpen(false)} footer={null} destroyOnClose>
      <Form form={userForm} layout="vertical" onFinish={saveUser} initialValues={{is_active:true}}>
        <Form.Item name="name" label="Full Name" rules={[{required:true,message:'Enter name'}]}><Input placeholder="User name"/></Form.Item>
        <Form.Item name="email" label="Email / Login" rules={[{required:true,type:'email',message:'Enter a valid email'}]}><Input placeholder="user@example.com"/></Form.Item>
        <Form.Item name="password" label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'} rules={editingUser?[]:[{required:true,message:'Enter password'}]}><Input.Password placeholder="Minimum 6 characters"/></Form.Item>
        <Form.Item name="role_id" label="Role" rules={[{required:true,message:'Select a role'}]}><Select placeholder="Select role" options={roles.map(r=>({label:r.name,value:r.id}))}/></Form.Item>
        <Form.Item name="is_active" valuePropName="checked"><Checkbox>Active user</Checkbox></Form.Item>
        <Space><Button onClick={()=>setUserOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">Save User</Button></Space>
      </Form>
    </Modal>

    <Modal title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create Role & Set Permissions'} open={roleOpen} onCancel={()=>setRoleOpen(false)} footer={null} width={720} destroyOnClose>
      <Form form={roleForm} layout="vertical" onFinish={saveRole}>
        <Form.Item name="name" label="Role Name" rules={[{required:true,message:'Enter role name'}]}><Input placeholder="e.g. Pharmacist, Accountant, Receptionist"/></Form.Item>
        <Form.Item name="permission_ids" label="Permissions">
          <Checkbox.Group style={{width:'100%'}}>
            <Row gutter={[12,12]}>{permissions.map(p=><Col xs={24} sm={12} md={8} key={p.id}><Checkbox value={p.id}>{permissionLabel(p.code)}</Checkbox></Col>)}</Row>
          </Checkbox.Group>
        </Form.Item>
        <Typography.Text type="secondary">Tick only the areas this role should access. Admin can see and manage all users, roles and permissions.</Typography.Text>
        <div style={{marginTop:16}}><Space><Button onClick={()=>setRoleOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">Save Role & Permissions</Button></Space></div>
      </Form>
    </Modal>
  </div>;
}




/* =========================================================
   SETTINGS
========================================================= */

function Settings() {

  const [form] = Form.useForm();
  const [logoPreview, setLogoPreview] = useState('');
  const [logoLoading, setLogoLoading] = useState(false);

  const resizeLogo = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 700;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });


  useEffect(() => {

    const loadSettings =
      async () => {

        try {

          const response =
            await API.get(
              '/settings'
            );


          form.setFieldsValue(response.data);
          setLogoPreview(response.data.logo_url || '');

        } catch (error) {

          message.error(
            'Could not load settings'
          );

        }

      };


    loadSettings();

  }, [form]);


  return (

    <Card>

      <Typography.Title>
        Configuration
      </Typography.Title>


      <Typography.Paragraph>

        Configure the hospital identity used on invoices, receipts and reports.
        Logo, address, phone and license number are saved with the existing hospital settings.

      </Typography.Paragraph>


      <Form

        form={form}

        layout="vertical"

        onFinish={async values => {

          try {

            await API.post(
              '/settings',
              values
            );


            message.success(
              'Configuration saved'
            );

          } catch (error) {

            message.error(
              error.response?.data?.message ||
              'Could not save configuration'
            );

          }

        }}

      >

        <Row gutter={16}>

          <Col span={24}>
            <Form.Item label="Print Logo">
              <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                {logoPreview ? <img src={logoPreview} alt="Hospital logo preview" style={{width:110,height:80,objectFit:'contain',border:'1px solid #e5e7eb',borderRadius:8,padding:6,background:'#fff'}} /> : <div style={{width:110,height:80,border:'1px dashed #cbd5e1',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:12}}>No Logo</div>}
                <div>
                  <input id="hospital-logo-upload" type="file" accept="image/png,image/jpeg,image/webp" style={{display:'none'}} onChange={async e => { const file=e.target.files?.[0]; if(!file)return; try { setLogoLoading(true); const data=await resizeLogo(file); setLogoPreview(data); form.setFieldValue('logo_url', data); } catch { message.error('Could not read the logo image'); } finally { setLogoLoading(false); e.target.value=''; } }} />
                  <Button loading={logoLoading} onClick={()=>document.getElementById('hospital-logo-upload')?.click()}>Choose Logo Image</Button>
                  {logoPreview && <Button type="link" danger onClick={()=>{setLogoPreview('');form.setFieldValue('logo_url','')}}>Remove</Button>}
                  <div style={{fontSize:12,color:'#8a94a0',marginTop:6}}>PNG/JPG/WebP. The image is resized for receipt printing.</div>
                </div>
              </div>
            </Form.Item>
          </Col>

          <Form.Item name="logo_url" hidden><Input /></Form.Item>

          <Col span={12}>
            <Form.Item name="hospital_name" label="Hospital Name" rules={[{required:true,message:'Hospital name is required'}]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone No"><Input placeholder="0300 1234567" /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="license_no" label="License No"><Input placeholder="Hospital / Pharmacy License No" /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email"><Input /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address" label="Address for Print"><Input.TextArea rows={2} placeholder="Full address to show below hospital name on invoices" /></Form.Item>
          </Col>

          <Col span={12}>

            <Form.Item
              name="api_endpoint"
              label="API Endpoint"
            >

              <Input
              placeholder="https://api-h.raas-llc.com/api" //placeholder="http://192.168.10.8:5001/api"
              />
            </Form.Item>

          </Col>


          <Col span={12}>

            <Form.Item

              name="printer_type"

              label="Printer Type"

            >

              <Select

                options={[

                  'A4',

                  '80mm Thermal'

                ].map(
                  value => ({
                    label: value,
                    value
                  })
                )}

              />

            </Form.Item>

          </Col>


          <Col span={12}>

            <Form.Item

              name="tax_note"

              label="Tax Note"

            >

              <Input />

            </Form.Item>

          </Col>

        </Row>


        <Button
          type="primary"
          htmlType="submit"
        >
          Save Configuration
        </Button>

      </Form>

    </Card>

  );

}


/* =========================================================
   CASH & BANK
========================================================= */

function CashBank() {
  const [data, setData] = useState({ cash: {}, banks: [] });
  const [ledger, setLedger] = useState([]);
  const [activeAccount, setActiveAccount] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankEditing, setBankEditing] = useState(null);
  const [viewBank, setViewBank] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [form] = Form.useForm();
  const [tform] = Form.useForm();

  const load = async () => {
    const res = await API.get('/cash-bank/accounts');
    setData(res.data);
  };
  const loadLedger = async account => {
    setLoading(true);
    try { setLedger((await API.get('/cash-bank/ledger', { params: { account } })).data); }
    catch (e) { message.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load().catch(e => message.error(getErrorMessage(e))); }, []);
  useEffect(() => { loadLedger(activeAccount); }, [activeAccount]);

  const accounts = [{ key: 'cash', label: 'Cash In Hand', balance: data.cash?.balance, type: 'CASH' }].concat(
    (data.banks || []).map(b => ({ key: b.id, label: `${b.name}${b.bank_name ? ' — ' + b.bank_name : ''}`, balance: b.balance, type: 'BANK', ...b }))
  );
  const active = accounts.find(a => String(a.key) === String(activeAccount));

  const openAdd = () => { setBankEditing(null); form.resetFields(); form.setFieldsValue({ opening_balance: 0 }); setBankOpen(true); };
  const openEdit = b => { setBankEditing(b); form.setFieldsValue({ name:b.name, bank_name:b.bank_name, account_no:b.account_no }); setBankOpen(true); };
  const removeBank = async b => {
    try { await API.delete(`/cash-bank/accounts/${b.id}`); message.success('Bank account deleted'); if(String(activeAccount)===String(b.id)) setActiveAccount('cash'); await load(); }
    catch(e){ message.error(getErrorMessage(e)); }
  };

  return <>
    <div className="page-head">
      <div><Typography.Title style={{margin:0}}>Cash &amp; Bank</Typography.Title><div style={{color:'var(--text-muted)',fontSize:12}}>GL-linked cash and bank accounts</div></div>
      <Space><Button onClick={() => setTransferOpen(true)}>Deposit / Withdraw</Button><Button type="primary" icon={<PlusOutlined/>} onClick={openAdd}>Add Bank Account</Button></Space>
    </div>

    <Row gutter={[16,16]}>
      {accounts.map(a => <Col xs={24} sm={12} lg={6} key={a.key}>
        <Card hoverable onClick={() => setActiveAccount(a.key)} style={{borderColor:String(activeAccount)===String(a.key)?'var(--primary-red)':undefined}}>
          <Space direction="vertical" size={4} style={{width:'100%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{color:'var(--text-muted)',fontWeight:700,fontSize:12,textTransform:'uppercase'}}>{a.label}</span><Tag color={a.type==='CASH'?'green':'blue'}>{a.type}</Tag></div>
            <div style={{fontSize:24,fontWeight:900}}>{money(a.balance)}</div>
            <Space size={4}>
              <Button size="small" icon={<EyeOutlined/>} onClick={e=>{e.stopPropagation();setActiveAccount(a.key);setViewBank(a);}}>View</Button>
              {a.type==='BANK' && <><Button size="small" icon={<EditOutlined/>} onClick={e=>{e.stopPropagation();openEdit(a);}}>Edit</Button><Popconfirm title="Delete this bank account?" description="Only unused accounts can be deleted." onConfirm={()=>removeBank(a)}><Button size="small" danger icon={<DeleteOutlined/>} onClick={e=>e.stopPropagation()}>Delete</Button></Popconfirm></>}
            </Space>
          </Space>
        </Card>
      </Col>)}
    </Row>

    <Card title={<Space><BankOutlined/> Ledger — {active?.label || ''}</Space>} style={{marginTop:16}} extra={<Tag>{active?.type || ''}</Tag>}>
      <Table rowKey={(r,i)=>`${r.reference_type}-${r.reference_id}-${i}`} loading={loading} dataSource={ledger} pagination={{pageSize:15}} scroll={{x:900}} columns={[
        {title:'Date',dataIndex:'entry_date',width:160},{title:'Type',dataIndex:'reference_type'},{title:'Narration',dataIndex:'narration'},
        {title:'Debit (In)',dataIndex:'debit',align:'right',render:v=>Number(v)?money(v):''},{title:'Credit (Out)',dataIndex:'credit',align:'right',render:v=>Number(v)?money(v):''},{title:'Balance',dataIndex:'running_balance',align:'right',render:money}
      ]}/>
    </Card>

    <Modal title={bankEditing ? 'Edit Bank Account' : 'Add Bank Account'} open={bankOpen} onCancel={()=>setBankOpen(false)} onOk={()=>form.submit()}>
      <Form form={form} layout="vertical" onFinish={async values=>{try{if(bankEditing){await API.put(`/cash-bank/accounts/${bankEditing.id}`,values);message.success('Bank account updated');}else{await API.post('/cash-bank/accounts',values);message.success('Bank account added');}setBankOpen(false);form.resetFields();await load();}catch(e){message.error(getErrorMessage(e));}}}>
        <Form.Item name="name" label="Account Name" rules={[{required:true,message:'Account name is required'}]}><Input placeholder="e.g. HBL Main Account"/></Form.Item>
        <Form.Item name="bank_name" label="Bank Name"><Input/></Form.Item>
        <Form.Item name="account_no" label="Account Number"><Input/></Form.Item>
        {!bankEditing && <Form.Item name="opening_balance" label="Opening Balance"><InputNumber style={{width:'100%'}} min={0}/></Form.Item>}
      </Form>
    </Modal>

    <Modal title={viewBank?.type==='CASH' ? 'Cash In Hand' : 'Bank Account'} open={!!viewBank} onCancel={()=>setViewBank(null)} footer={null}>
      {viewBank && <Descriptions bordered column={1} items={[
        {key:'name',label:'Account',children:viewBank.label},{key:'balance',label:'Current Balance',children:money(viewBank.balance)},
        ...(viewBank.type==='BANK'?[{key:'bank',label:'Bank Name',children:viewBank.bank_name||'-'},{key:'no',label:'Account Number',children:viewBank.account_no||'-'},{key:'code',label:'GL Account',children:viewBank.account_code||'-'}]:[])
      ]}/>} 
    </Modal>

    <Modal title="Deposit / Withdraw / Transfer" open={transferOpen} onCancel={()=>setTransferOpen(false)} onOk={()=>tform.submit()}>
      <Form form={tform} layout="vertical" onFinish={async values=>{try{await API.post('/cash-bank/transfer',values);message.success('Transfer recorded');setTransferOpen(false);tform.resetFields();await load();await loadLedger(activeAccount);}catch(e){message.error(getErrorMessage(e));}}}>
        <Form.Item name="from" label="From" rules={[{required:true}]}><Select options={accounts.map(a=>({label:a.label,value:a.key}))}/></Form.Item>
        <Form.Item name="to" label="To" rules={[{required:true}]}><Select options={accounts.map(a=>({label:a.label,value:a.key}))}/></Form.Item>
        <Form.Item name="amount" label="Amount" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0.01}/></Form.Item>
        <Form.Item name="notes" label="Notes"><Input.TextArea rows={2}/></Form.Item>
      </Form>
    </Modal>
  </>;
}

/* =========================================================
   COLLECTIONS — collect dues from patients / pay suppliers,
   and print a Tax Invoice / statement to send to the party.
========================================================= */

function PaymentOut() {
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [filters, setFilters] = useState({ q:'', payment_method:'', date_from:'', date_to:'' });
  const [form] = Form.useForm();

  const loadPending = async (q=filters.q) => {
    const res = await API.get('/payments/pending', { params: { type: 'SUPPLIER', q } });
    setPending(res.data || []);
  };
  const loadRecent = async (f=filters) => {
    const res = await API.get('/payments', { params: { type:'SUPPLIER', ...f } });
    setRecent(res.data || []);
  };
  useEffect(() => { loadPending().catch(e => message.error(getErrorMessage(e))); loadRecent().catch(e => message.error(getErrorMessage(e))); }, []);
  useEffect(() => { API.get('/cash-bank/accounts').then(r => setBankAccounts(r.data.banks || [])).catch(() => {}); }, []);

  const openParty = async row => {
    setSelected(row);
    try {
      const res = await API.get('/payments/party-invoices', { params: { type:'SUPPLIER', party_id: row.id } });
      setDetail(res.data);
    } catch (e) { message.error(getErrorMessage(e)); }
  };
  const applySearch = () => { loadPending(filters.q).catch(e=>message.error(getErrorMessage(e))); return loadRecent(filters).catch(e => message.error(getErrorMessage(e))); };
  const clearSearch = () => { const f={q:'',payment_method:'',date_from:'',date_to:''}; setFilters(f); loadPending('').catch(e=>message.error(getErrorMessage(e))); loadRecent(f).catch(e=>message.error(getErrorMessage(e))); };
  const printStatement = () => { if (detail) printDocument({ party:detail.party, invoices:detail.invoices, totalDue:detail.totalDue, partyType:'SUPPLIER' }, 'statement'); };

  return <>
    <div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <Typography.Title style={{margin:0}}>Payment Out</Typography.Title>
      <Tag color="orange">Supplier Payments</Tag>
    </div>

    <Card title={<Space><SearchOutlined/> Search Payment Out</Space>} style={{marginBottom:16}}>
      <Row gutter={[10,10]}>
        <Col xs={24} md={9}><Input prefix={<SearchOutlined/>} value={filters.q} placeholder="Supplier, phone, reference, amount..." onChange={e=>setFilters({...filters,q:e.target.value})} onPressEnter={applySearch}/></Col>
        <Col xs={12} md={4}><Select allowClear style={{width:'100%'}} placeholder="Payment Method" value={filters.payment_method||undefined} onChange={v=>setFilters({...filters,payment_method:v||''})} options={[{label:'Cash',value:'Cash'},{label:'Bank',value:'Bank'}]}/></Col>
        <Col xs={12} md={3}><Input type="date" value={filters.date_from} onChange={e=>setFilters({...filters,date_from:e.target.value})}/></Col>
        <Col xs={12} md={3}><Input type="date" value={filters.date_to} onChange={e=>setFilters({...filters,date_to:e.target.value})}/></Col>
        <Col xs={12} md={5}><Space><Button type="primary" icon={<SearchOutlined/>} onClick={applySearch}>Search</Button><Button onClick={clearSearch}>Reset</Button></Space></Col>
      </Row>
    </Card>

    <Row gutter={16}>
      <Col xs={24} lg={10}>
        <Card title={<Space>Suppliers with balance due <Tag>{pending.length}</Tag></Space>}>
          <Table rowKey="id" dataSource={pending} size="small" pagination={{pageSize:10}} onRow={row=>({onClick:()=>openParty(row),style:{cursor:'pointer'}})} columns={[
            {title:'Supplier',dataIndex:'name'}, {title:'Phone',dataIndex:'phone'}, {title:'Invoices',dataIndex:'invoices'}, {title:'Due',dataIndex:'due',render:money}
          ]}/>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        {detail ? <Card title={`${detail.party?.name || ''} — ${money(detail.totalDue || 0)} due`} extra={<Space><Button icon={<PrinterOutlined/>} onClick={printStatement}>Print Statement</Button><Button type="primary" onClick={()=>setPayOpen(true)}>Payment Out</Button></Space>}>
          <Table rowKey="id" size="small" pagination={false} dataSource={detail.invoices} columns={[
            {title:'Bill',dataIndex:'invoice_no'}, {title:'Date',dataIndex:'invoice_date'}, {title:'Total',dataIndex:'net_total',render:money}, {title:'Paid',dataIndex:'paid',render:money}, {title:'Due',dataIndex:'due',render:money}
          ]}/>
        </Card> : <Card><span style={{color:'var(--text-muted)'}}>Select a supplier to view outstanding bills and record a payment.</span></Card>}
      </Col>
    </Row>

    <Card title={<Space>Recent Payment Out <Tag color="blue">{recent.length}</Tag></Space>} style={{marginTop:16}}>
      <Table rowKey="id" dataSource={recent} pagination={{pageSize:10}} scroll={{x:900}} columns={[
        {title:'Date',dataIndex:'created_at',render:v=>v?dateTime(v):'-'},
        {title:'Supplier',dataIndex:'party_name'}, {title:'Phone',dataIndex:'party_phone',render:v=>v||'-'},
        {title:'Amount',dataIndex:'amount',render:money}, {title:'Method',dataIndex:'payment_method',render:v=><Tag color={v==='Bank'?'blue':'green'}>{v}</Tag>},
        {title:'Reference',dataIndex:'reference_no',render:v=>v||'-'}, {title:'Notes',dataIndex:'notes',render:v=>v||'-'}
      ]}/>
    </Card>

    <Modal title="Payment Out" open={payOpen} onCancel={()=>setPayOpen(false)} onOk={()=>form.submit()}>
      <Form form={form} layout="vertical" initialValues={{payment_method:'Cash'}} onFinish={async values=>{
        try { await API.post('/payments',{party_type:'SUPPLIER',party_id:selected.id,...values}); message.success('Payment recorded'); setPayOpen(false); form.resetFields(); await loadPending(); await loadRecent(); await openParty(selected); }
        catch(e){message.error(getErrorMessage(e));}
      }}>
        <Form.Item name="amount" label="Amount" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} max={detail?.totalDue}/></Form.Item>
        <Form.Item name="payment_method" label="Method" rules={[{required:true}]}><Select options={[{label:'Cash',value:'Cash'},{label:'Bank',value:'Bank'}]}/></Form.Item>
        <Form.Item noStyle shouldUpdate={(a,b)=>a.payment_method!==b.payment_method}>{({getFieldValue})=>getFieldValue('payment_method')==='Bank'?<Form.Item name="bank_account_id" label="Bank Account" rules={[{required:true}]}><Select options={bankAccounts.map(b=>({label:b.name,value:b.id}))}/></Form.Item>:null}</Form.Item>
        <Form.Item name="reference_no" label="Reference No (optional)"><Input/></Form.Item><Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item>
      </Form>
    </Modal>
  </>;
}

/* =========================================================
   PURCHASE RETURN / DEBIT NOTE
========================================================= */

function PurchaseReturn({ editId=null, onReload=null, onClose=null }) {
  const [purchases, setPurchases] = useState([]);
  const [purchaseId, setPurchaseId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [returnDate, setReturnDate] = useState(localYmd());
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [list, setList] = useState([]); const [search,setSearch]=useState('');
  const [editingId,setEditingId] = useState(editId);
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape' && onClose) { e.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const loadList = async (q='') => setList((await API.get('/purchase-returns',{params:{q}})).data);
  const searchPurchases = async (q='') => {
    setSearching(true);
    try { setPurchases((await API.get('/purchases',{params:{q:String(q||'').trim()}})).data || []); }
    catch(e) { message.error(getErrorMessage(e)); }
    finally { setSearching(false); }
  };
  useEffect(() => { loadList().catch(e => message.error(getErrorMessage(e))); }, []);
  useEffect(() => { if (!editingId) return; (async()=>{ try { const r=(await API.get(`/purchase-returns/${editingId}`)).data; setPurchaseId(r.purchase_id||null); setReturnDate(String(r.return_date||'').slice(0,10)); setReason(r.reason||''); const purchase=r.purchase_id?(await API.get(`/purchases/${r.purchase_id}`)).data:null; setSelectedPurchase(purchase); const oldMap=new Map((r.items||[]).map(i=>[`${i.medicine_id}-${i.batch_id}`,i])); setRows((purchase?.items||r.items||[]).map(i=>{const o=oldMap.get(`${i.medicine_id}-${i.batch_id}`); return {key:i.id||`${i.medicine_id}-${i.batch_id}`,medicine_id:i.medicine_id,medicine_name:i.medicine_name,batch_id:i.batch_id,batch_no:i.batch_no,available_qty:Number(i.qty||0)+Number(i.bonus_qty||0),qty:Number(o?.qty||0),unit_cost:Number(o?.unit_cost||i.unit_cost||0)};})); } catch(e){message.error(getErrorMessage(e));} })(); }, [editingId]);

  const loadFromPurchase = async pid => {
    setPurchaseId(pid || null);
    if (!pid) { setSelectedPurchase(null); setRows([]); return; }
    try {
      const res = await API.get(`/purchases/${pid}`);
      setSelectedPurchase(res.data);
      setRows((res.data.items || []).map(i => ({
        key: i.id, medicine_id: i.medicine_id, medicine_name: i.medicine_name,
        batch_id: i.batch_id, batch_no: i.batch_no, available_qty: Number(i.qty || 0) + Number(i.bonus_qty || 0),
        qty: 0, unit_cost: Number(i.unit_cost || 0)
      })));
    } catch (e) { message.error(getErrorMessage(e)); }
  };

  const updateRow = (key, patch) => setRows(r => r.map(x => x.key === key ? { ...x, ...patch } : x));
  const total = rows.reduce((sum, r) => sum + Number(r.qty || 0) * Number(r.unit_cost || 0), 0);
  const save = async () => {
    const items = rows.filter(r => Number(r.qty) > 0).map(r => ({ medicine_id:r.medicine_id, batch_id:r.batch_id, qty:r.qty, unit_cost:r.unit_cost }));
    if (!purchaseId) { message.warning('Search by item, bill number, or supplier mobile and select a purchase first'); return; }
    if (!items.length) { message.warning('Enter return quantity for at least one item'); return; }
    setSaving(true);
    try {
      const payload={ purchase_id:purchaseId, supplier_id:selectedPurchase?.supplier_id || null, return_date:returnDate, reason, items };
      if(editingId) await API.put(`/purchase-returns/${editingId}`,payload); else await API.post('/purchase-returns',payload);
      message.success(editingId?'Debit Note updated — stock and payable recalculated':'Purchase return / debit note saved — stock and payable updated');
      setRows([]); setPurchaseId(null); setSelectedPurchase(null); setReason(''); setPurchases([]); setEditingId(null); loadList(); onReload?.(); onClose?.();
    } catch(e) { message.error(getErrorMessage(e)); } finally { setSaving(false); }
  };

  return <>
    <div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography.Title>{editingId ? `Edit Debit Note` : `Purchase Return / Debit Note`}</Typography.Title>{onClose&&<Button onClick={onClose}>Close</Button>}</div>
    <Card style={{marginBottom:16}}>
      <Row gutter={10} style={{marginBottom:12}}>
        <Col span={14}>
          <Select showSearch allowClear value={purchaseId} style={{width:'100%'}} placeholder="Search by Item / Bill No / Supplier Mobile Number"
            loading={searching} filterOption={false} onSearch={searchPurchases} onFocus={()=>{if(!purchases.length)searchPurchases('')}} onChange={loadFromPurchase}
            notFoundContent={searching?'Searching...':'No matching purchase found'}>
            {purchases.map(p=><Select.Option key={p.id} value={p.id}>{`${p.invoice_no || 'Bill #'+p.id}${p.supplier_name?` — ${p.supplier_name}`:''}${p.supplier_phone?` — ${p.supplier_phone}`:''}`}</Select.Option>)}
          </Select>
        </Col>
        <Col span={5}><Input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} /></Col>
        <Col span={5}><Input placeholder="Reason (expired, damaged, wrong item...)" value={reason} onChange={e=>setReason(e.target.value)} /></Col>
      </Row>
      <div style={{fontSize:12,color:'var(--text-muted)',marginTop:-4,marginBottom:10}}>Search the original purchase by item, bill number, supplier mobile number, or supplier name. Select the purchase to load its items.</div>
      <div className="invoice-grid"><table><thead><tr><th>#</th><th>Item</th><th>Batch</th><th>Purchased Qty</th><th>Return Qty</th><th>Unit Cost</th><th>Amount</th></tr></thead><tbody>
        {rows.map((r,idx)=><tr key={r.key}><td>{idx+1}</td><td>{r.medicine_name}</td><td>{r.batch_no}</td><td>{r.available_qty}</td><td><InputNumber size="small" min={0} max={r.available_qty} style={{width:80}} value={r.qty} onChange={v=>updateRow(r.key,{qty:v||0})}/></td><td><InputNumber size="small" min={0} style={{width:90}} value={r.unit_cost} onChange={v=>updateRow(r.key,{unit_cost:v||0})}/></td><td className="ro amount">{money(Number(r.qty||0)*Number(r.unit_cost||0))}</td></tr>)}
        {!rows.length&&<tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-muted)',padding:16}}>Search by item, bill number, or supplier mobile number and select a purchase to load its items.</td></tr>}
      </tbody></table></div>
      <Row justify="end" style={{marginTop:12}}><Space><b style={{fontSize:16}}>Total: {money(total)}</b><Button type="primary" loading={saving} onClick={save}>{editingId ? 'Update Debit Note' : 'Save Debit Note'}</Button></Space></Row>
    </Card>
    <Card title="Past Purchase Returns"><Input.Search allowClear style={{maxWidth:420,marginBottom:12}} placeholder="Search return no, bill number, item or supplier mobile" value={search} onChange={e=>setSearch(e.target.value)} onSearch={loadList}/>
      <Table rowKey="id" dataSource={list} pagination={{pageSize:10}} columns={[
        {title:'Debit Note #',dataIndex:'return_no'}, {title:'Supplier',dataIndex:'supplier_name',render:(v,r)=>v||r.supplier_phone||'-'}, {title:'Against Bill',dataIndex:'purchase_invoice_no',render:v=>v||'-'}, {title:'Date',dataIndex:'return_date'}, {title:'Reason',dataIndex:'reason'}, {title:'Amount',dataIndex:'net_total',render:money}, {title:'Actions',render:(_,r)=><Button size="small" icon={<EditOutlined/>} onClick={()=>setEditingId(r.id)}>Edit</Button>}
      ]}/>
    </Card>
  </>;
}

/* =========================================================
   PAYMENT IN — receive money from a patient against old dues
========================================================= */

function PaymentIn() {
  const [pending, setPending] = useState([]); const [selected,setSelected]=useState(null); const [detail,setDetail]=useState(null); const [payOpen,setPayOpen]=useState(false); const [bankAccounts,setBankAccounts]=useState([]); const [recent,setRecent]=useState([]);
  const [filters,setFilters]=useState({q:'',payment_method:'',date_from:'',date_to:''}); const [form]=Form.useForm();
  const loadPending=async(q=filters.q)=>{const r=await API.get('/payments/pending',{params:{type:'PATIENT',q}});setPending(r.data||[]);};
  const loadRecent=async(f=filters)=>{const r=await API.get('/payments',{params:{type:'PATIENT',...f}});setRecent(r.data||[]);};
  useEffect(()=>{loadPending().catch(e=>message.error(getErrorMessage(e)));loadRecent().catch(e=>message.error(getErrorMessage(e)));},[]);
  useEffect(()=>{API.get('/cash-bank/accounts').then(r=>setBankAccounts(r.data.banks||[])).catch(()=>{});},[]);
  const openParty=async row=>{setSelected(row);try{const r=await API.get('/payments/party-invoices',{params:{type:'PATIENT',party_id:row.id}});setDetail(r.data);}catch(e){message.error(getErrorMessage(e));}};
  const applySearch=()=>{loadPending(filters.q).catch(e=>message.error(getErrorMessage(e)));return loadRecent(filters).catch(e=>message.error(getErrorMessage(e)));}; const clearSearch=()=>{const f={q:'',payment_method:'',date_from:'',date_to:''};setFilters(f);loadPending('').catch(e=>message.error(getErrorMessage(e)));loadRecent(f).catch(e=>message.error(getErrorMessage(e)));};
  const printStatement=()=>{if(detail)printDocument({party:detail.party,invoices:detail.invoices,totalDue:detail.totalDue,partyType:'PATIENT'},'statement');};
  return <>
    <div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography.Title style={{margin:0}}>Payment In</Typography.Title><Tag color="green">Patient Collections</Tag></div>
    <Card title={<Space><SearchOutlined/> Search Payment In</Space>} style={{marginBottom:16}}><Row gutter={[10,10]}>
      <Col xs={24} md={9}><Input prefix={<SearchOutlined/>} value={filters.q} placeholder="Patient, phone, reference, amount..." onChange={e=>setFilters({...filters,q:e.target.value})} onPressEnter={applySearch}/></Col>
      <Col xs={12} md={4}><Select allowClear style={{width:'100%'}} placeholder="Payment Method" value={filters.payment_method||undefined} onChange={v=>setFilters({...filters,payment_method:v||''})} options={[{label:'Cash',value:'Cash'},{label:'Bank',value:'Bank'}]}/></Col>
      <Col xs={12} md={3}><Input type="date" value={filters.date_from} onChange={e=>setFilters({...filters,date_from:e.target.value})}/></Col><Col xs={12} md={3}><Input type="date" value={filters.date_to} onChange={e=>setFilters({...filters,date_to:e.target.value})}/></Col>
      <Col xs={12} md={5}><Space><Button type="primary" icon={<SearchOutlined/>} onClick={applySearch}>Search</Button><Button onClick={clearSearch}>Reset</Button></Space></Col>
    </Row></Card>
    <Row gutter={16}><Col xs={24} lg={10}><Card title={<Space>Patients with balance due <Tag>{pending.length}</Tag></Space>}><Table rowKey="id" dataSource={pending} size="small" pagination={{pageSize:10}} onRow={row=>({onClick:()=>openParty(row),style:{cursor:'pointer'}})} columns={[{title:'Patient',dataIndex:'name'},{title:'Phone',dataIndex:'mobile',render:v=>v||'-'},{title:'Invoices',dataIndex:'invoices'},{title:'Due',dataIndex:'due',render:money}]}/></Card></Col>
      <Col xs={24} lg={14}>{detail?<Card title={`${detail.party?.name||''} — ${money(detail.totalDue||0)} due`} extra={<Space><Button icon={<PrinterOutlined/>} onClick={printStatement}>Print Statement</Button><Button type="primary" onClick={()=>setPayOpen(true)}>Payment In</Button></Space>}><Table rowKey="id" size="small" pagination={false} dataSource={detail.invoices} columns={[{title:'Invoice',dataIndex:'invoice_no'},{title:'Date',dataIndex:'invoice_date'},{title:'Total',dataIndex:'net_total',render:money},{title:'Paid',dataIndex:'paid',render:money},{title:'Due',dataIndex:'due',render:money}]}/></Card>:<Card><span style={{color:'var(--text-muted)'}}>Select a patient to view outstanding invoices and record a collection.</span></Card>}</Col></Row>
    <Card title={<Space>Recent Payment In <Tag color="blue">{recent.length}</Tag></Space>} style={{marginTop:16}}><Table rowKey="id" dataSource={recent} pagination={{pageSize:10}} scroll={{x:900}} columns={[{title:'Date',dataIndex:'created_at',render:v=>v?dateTime(v):'-'},{title:'Patient',dataIndex:'party_name'},{title:'Phone',dataIndex:'party_phone',render:v=>v||'-'},{title:'Amount',dataIndex:'amount',render:money},{title:'Method',dataIndex:'payment_method',render:v=><Tag color={v==='Bank'?'blue':'green'}>{v}</Tag>},{title:'Reference',dataIndex:'reference_no',render:v=>v||'-'},{title:'Notes',dataIndex:'notes',render:v=>v||'-'}]}/></Card>
    <Modal title="Payment In" open={payOpen} onCancel={()=>setPayOpen(false)} onOk={()=>form.submit()}><Form form={form} layout="vertical" initialValues={{payment_method:'Cash'}} onFinish={async values=>{try{await API.post('/payments',{party_type:'PATIENT',party_id:selected.id,...values});message.success('Payment recorded');setPayOpen(false);form.resetFields();await loadPending();await loadRecent();await openParty(selected);}catch(e){message.error(getErrorMessage(e));}}}>
      <Form.Item name="amount" label="Amount" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} max={detail?.totalDue}/></Form.Item><Form.Item name="payment_method" label="Method" rules={[{required:true}]}><Select options={[{label:'Cash',value:'Cash'},{label:'Bank',value:'Bank'}]}/></Form.Item><Form.Item noStyle shouldUpdate={(a,b)=>a.payment_method!==b.payment_method}>{({getFieldValue})=>getFieldValue('payment_method')==='Bank'?<Form.Item name="bank_account_id" label="Bank Account" rules={[{required:true}]}><Select options={bankAccounts.map(b=>({label:b.name,value:b.id}))}/></Form.Item>:null}</Form.Item><Form.Item name="reference_no" label="Reference No (optional)"><Input/></Form.Item><Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item>
    </Form></Modal>
  </>;
}

/* =========================================================
   SALE RETURN / CREDIT NOTE
========================================================= */

function SaleReturn({ editId=null, onReload=null, onClose=null }) {
  const [sales, setSales] = useState([]);
  const [saleId, setSaleId] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnDate, setReturnDate] = useState(localYmd());
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [list, setList] = useState([]); const [search,setSearch]=useState('');
  const [editingId,setEditingId] = useState(editId);
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape' && onClose) { e.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const loadList = async (q='') => setList((await API.get('/sale-returns',{params:{q}})).data);
  const searchSales = async (q='') => {
    setSearching(true);
    try { setSales((await API.get('/sales',{params:{q:String(q||'').trim()}})).data || []); }
    catch(e) { message.error(getErrorMessage(e)); }
    finally { setSearching(false); }
  };
  useEffect(() => { loadList().catch(e => message.error(getErrorMessage(e))); }, []);
  useEffect(() => { if (!editingId) return; (async()=>{ try { const r=(await API.get(`/sale-returns/${editingId}`)).data; setSaleId(r.sale_id||null); setReturnDate(String(r.return_date||'').slice(0,10)); setReason(r.reason||''); const sale=r.sale_id?(await API.get(`/sales/${r.sale_id}`)).data:null; setSelectedSale(sale); const oldMap=new Map((r.items||[]).map(i=>[`${i.medicine_id}-${i.batch_id}`,i])); setRows((sale?.items||r.items||[]).map(i=>{const o=oldMap.get(`${i.medicine_id}-${i.batch_id}`); return {key:i.id||`${i.medicine_id}-${i.batch_id}`,medicine_id:i.medicine_id,medicine_name:i.medicine_name,batch_id:i.batch_id,batch_no:i.batch_no,available_qty:Number(i.qty||0),qty:Number(o?.qty||0),unit_price:Number(o?.unit_price||i.unit_price||0),cost_price:Number(o?.cost_price||i.cost_price||0)};})); } catch(e){message.error(getErrorMessage(e));} })(); }, [editingId]);

  const loadFromSale = async sid => {
    setSaleId(sid || null);
    if (!sid) { setSelectedSale(null); setRows([]); return; }
    try {
      const res = await API.get(`/sales/${sid}`);
      setSelectedSale(res.data);
      setRows((res.data.items || []).map(i => ({
        key:i.id, medicine_id:i.medicine_id, medicine_name:i.medicine_name, batch_id:i.batch_id, batch_no:i.batch_no,
        available_qty:Number(i.qty || 0), qty:0, unit_price:Number(i.unit_price || 0), cost_price:Number(i.cost_price || 0)
      })));
    } catch(e) { message.error(getErrorMessage(e)); }
  };

  const updateRow = (key,patch) => setRows(r=>r.map(x=>x.key===key?{...x,...patch}:x));
  const total = rows.reduce((sum,r)=>sum+Number(r.qty||0)*Number(r.unit_price||0),0);
  const save = async () => {
    const items=rows.filter(r=>Number(r.qty)>0).map(r=>({medicine_id:r.medicine_id,batch_id:r.batch_id,qty:r.qty,unit_price:r.unit_price,cost_price:r.cost_price}));
    if(!saleId){message.warning('Search by item, invoice number, or patient mobile and select a sale first');return;}
    if(!items.length){message.warning('Enter return quantity for at least one item');return;}
    setSaving(true);
    try{
      const payload={sale_id:saleId,patient_id:selectedSale?.patient_id||null,return_date:returnDate,reason,items};
      if(editingId) await API.put(`/sale-returns/${editingId}`,payload); else await API.post('/sale-returns',payload);
      message.success(editingId?'Credit Note updated — stock and balance recalculated':'Sale return / credit note saved — stock and balance due updated');
      setRows([]);setSaleId(null);setSelectedSale(null);setReason('');setSales([]);setEditingId(null);loadList(); onReload?.(); onClose?.();
    }catch(e){message.error(getErrorMessage(e));}finally{setSaving(false)}
  };

  return <>
    <div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography.Title>{editingId ? `Edit Credit Note` : `Sale Return / Credit Note`}</Typography.Title>{onClose&&<Button onClick={onClose}>Close</Button>}</div>
    <Card style={{marginBottom:16}}>
      <Row gutter={10} style={{marginBottom:12}}>
        <Col span={14}>
          <Select showSearch allowClear value={saleId} style={{width:'100%'}} placeholder="Search by Item / Invoice No / Mobile Number"
            loading={searching} filterOption={false} onSearch={searchSales} onFocus={()=>{if(!sales.length)searchSales('')}} onChange={loadFromSale}
            notFoundContent={searching?'Searching...':'No matching sale found'}>
            {sales.map(s=><Select.Option key={s.id} value={s.id}>{`${s.invoice_no || 'Invoice #'+s.id}${s.patient_name?` — ${s.patient_name}`:''}${s.patient_mobile?` — ${s.patient_mobile}`:''}`}</Select.Option>)}
          </Select>
        </Col>
        <Col span={5}><Input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} /></Col>
        <Col span={5}><Input placeholder="Reason (wrong item, side effects...)" value={reason} onChange={e=>setReason(e.target.value)} /></Col>
      </Row>
      <div style={{fontSize:12,color:'var(--text-muted)',marginTop:-4,marginBottom:10}}>Search the original sale by item, invoice number, patient mobile number, or patient name. Select the sale to load its items. Patient is taken automatically from the invoice; walk-in sales are supported.</div>
      <div className="invoice-grid"><table><thead><tr><th>#</th><th>Item</th><th>Batch</th><th>Sold Qty</th><th>Return Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>
        {rows.map((r,idx)=><tr key={r.key}><td>{idx+1}</td><td>{r.medicine_name}</td><td>{r.batch_no}</td><td>{r.available_qty}</td><td><InputNumber size="small" min={0} max={r.available_qty} style={{width:80}} value={r.qty} onChange={v=>updateRow(r.key,{qty:v||0})}/></td><td><InputNumber size="small" min={0} style={{width:90}} value={r.unit_price} onChange={v=>updateRow(r.key,{unit_price:v||0})}/></td><td className="ro amount">{money(Number(r.qty||0)*Number(r.unit_price||0))}</td></tr>)}
        {!rows.length&&<tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-muted)',padding:16}}>Search by item, invoice number, or mobile number and select a sale to load its items.</td></tr>}
      </tbody></table></div>
      <Row justify="end" style={{marginTop:12}}><Space><b style={{fontSize:16}}>Total: {money(total)}</b><Button type="primary" loading={saving} onClick={save}>{editingId ? 'Update Credit Note' : 'Save Credit Note'}</Button></Space></Row>
    </Card>
    <Card title="Past Sale Returns"><Input.Search allowClear style={{maxWidth:420,marginBottom:12}} placeholder="Search return no, invoice number, item or patient mobile" value={search} onChange={e=>setSearch(e.target.value)} onSearch={loadList}/>
      <Table rowKey="id" dataSource={list} pagination={{pageSize:10}} columns={[
        {title:'Credit Note #',dataIndex:'return_no'}, {title:'Patient',dataIndex:'patient_name',render:(v,r)=>v||r.patient_mobile||'-'}, {title:'Against Invoice',dataIndex:'sale_invoice_no',render:v=>v||'-'}, {title:'Date',dataIndex:'return_date'}, {title:'Reason',dataIndex:'reason'}, {title:'Amount',dataIndex:'net_total',render:money}, {title:'Actions',render:(_,r)=><Button size="small" icon={<EditOutlined/>} onClick={()=>setEditingId(r.id)}>Edit</Button>}
      ]}/>
    </Card>
  </>;
}

/* =========================================================
   APP
========================================================= */

function App() {

  const [user, setUser] =
    useState(null);

  const [key, setKey] = useState('dashboard');
  const [reportFocus, setReportFocus] = useState('sale');
  const [immersive, setImmersive] = useState(false);
  const [transactionWorkspace, setTransactionWorkspace] = useState(null); // 'sale' | 'purchase' | null
  const [transactionEditId, setTransactionEditId] = useState(null);
  const [transactionReturnKey, setTransactionReturnKey] = useState('dashboard');
  const closeTransactionWorkspace = () => {
    const returnKey = transactionReturnKey || 'dashboard';
    setTransactionWorkspace(null);
    setTransactionEditId(null);
    setImmersive(false);
    setKey(returnKey);
  };
  const openTransactionWorkspace = (type, editId = null, returnKey = 'dashboard') => {
    setTransactionReturnKey(returnKey || 'dashboard');
    setTransactionEditId(editId || null);
    setImmersive(true);
    setTransactionWorkspace(type === 'purchase' ? 'purchase' : 'sale');
  };
  const navigate = target => {
    const value = String(target || '');
    setTransactionWorkspace(null);
    if (value.startsWith('reports:')) { setReportFocus(value.slice(8) || 'sale'); setKey('reports'); setImmersive(false); }
    else if (value === 'reports') { setKey('reports'); setImmersive(false); }
    else { setKey(value); setImmersive(false); }
  };


  if (!user) {

    return (
      <Login
        onLogin={setUser}
      />
    );

  }


  const items = [

    { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },

    {
      key: 'grp-sale',
      label: 'Sale',
      icon: <ShoppingCartOutlined />,
      children: [
        { key: 'sales', label: 'Sale Invoice' },
        { key: 'paymentin', label: 'Payment In' },
        { key: 'salereturn', label: 'Sale Return (Credit Note)' }
        // Sale Order, Estimate/Quotation, Proforma Invoice and Delivery
        // Challan will appear here once built.
      ]
    },

    {
      key: 'grp-purchase',
      label: 'Purchase',
      icon: <ShoppingCartOutlined />,
      children: [
        { key: 'purchase', label: 'Purchase Bill' },
        { key: 'purchasereturn', label: 'Purchase Return (Debit Note)' },
        { key: 'paymentout', label: 'Payment Out' }
        // Purchase Order will appear here once built.
      ]
    },

    {
      key: 'grp-inventory',
      label: 'Inventory',
      icon: <MedicineBoxOutlined />,
      children: [
        { key: 'medicines', label: 'Items' },
        { key: 'categories', label: 'Categories' },
        { key: 'units', label: 'Units' },
        { key: 'stock', label: 'Stock' }
      ]
    },

    {
      key: 'grp-parties',
      label: 'Parties',
      icon: <TeamOutlined />,
      children: [
        { key: 'patients', label: 'Patients' },
        { key: 'doctors', label: 'Doctors' },
        { key: 'suppliers', label: 'Suppliers' }
      ]
    },

    {
      key: 'grp-accounts',
      label: 'Accounts',
      icon: <BookOutlined />,
      children: [
        { key: 'accounts', label: 'Accounting' },
        { key: 'cashbank', label: 'Cash & Bank' },
        { key: 'expenses', label: 'Expenses' }
      ]
    },

    { key: 'reports', label: 'Reports', icon: <FileTextOutlined /> },
    {
      key: 'grp-configuration',
      label: 'Configuration',
      icon: <SettingOutlined />,
      children: [
        { key: 'settings', label: 'General Configuration' },
        { key: 'users-roles', label: 'Users, Roles & Permissions' }
      ]
    }

  ];


  const pages = {

    dashboard:
      <Dashboard onNavigate={navigate} onWorkspaceChange={setImmersive} onAddTransaction={openTransactionWorkspace} />,

    patients:
      <Patients />,

    doctors:
      <Doctors />,

    medicines:
      <Medicines />,

    categories:
      <Categories />,

    units:
      <Units />,

    stock:
      <Stock />,

    sales:
      <Sales
        onWorkspaceChange={setImmersive}
        onOpenTransaction={(type, id) => openTransactionWorkspace(type, id, 'sales')}
      />,

    paymentin:
      <PaymentIn />,

    salereturn:
      <SaleReturn />,

    purchase:
      <Purchases
        onWorkspaceChange={setImmersive}
        onOpenTransaction={(type, id) => openTransactionWorkspace(type, id, 'purchase')}
      />,

    purchasereturn:
      <PurchaseReturn />,

    suppliers:
      <Suppliers />,

    accounts:
      <Accounting />,

    cashbank:
      <CashBank />,

    paymentout:
      <PaymentOut />,

    expenses:
      <Expenses />,

    reports:
      <Reports
        initialReport={reportFocus}
        renderAddSale={({ onReload, onClose }) => (
          <InvoiceWorkspace type="sale" onReload={onReload} onCloseAll={onClose} />
        )}
        renderEditSale={({ id, onReload, onClose }) => (
          <InvoiceWorkspace type="sale" editId={id} onReload={onReload} onCloseAll={onClose} />
        )}
        printSale={sale => printDocument(sale, 'sale')}
        renderAddPurchase={({ onReload, onClose }) => (
          <InvoiceWorkspace type="purchase" onReload={onReload} onCloseAll={onClose} />
        )}
        renderEditPurchase={({ id, onReload, onClose }) => (
          <InvoiceWorkspace type="purchase" editId={id} onReload={onReload} onCloseAll={onClose} />
        )}
        printPurchase={purchase => printDocument(purchase, 'purchase')}
        renderEditSaleReturn={({ id, onReload, onClose }) => <SaleReturn editId={id} onReload={onReload} onClose={onClose} />}
        renderEditPurchaseReturn={({ id, onReload, onClose }) => <PurchaseReturn editId={id} onReload={onReload} onClose={onClose} />}
        renderEditExpense={({ id, onReload, onClose }) => <ExpenseWorkspace id={id} onReload={onReload} onClose={onClose} />}
        onFullScreenChange={setImmersive}
        appImmersive={immersive}
      />,

    settings:
      <Settings />,

    'users-roles':
      <UsersRolesPermissions active={key === 'users-roles'} />

  };


  // Add Sale / Add Purchase must render BEFORE the normal Ant Design Layout.
  // This means the Sider is not mounted at all, so it cannot reserve any width
  // or remain visible. Report Edit continues to use the immersive layout below.
  if (transactionWorkspace) {
    return (
      <div className="transaction-fullscreen">
        <div className="transaction-fullscreen-header">
          <b>Punjab Hospital</b>
          <span className="transaction-fullscreen-title">{transactionEditId ? (transactionWorkspace === 'sale' ? 'Edit Sale' : 'Edit Purchase') : (transactionWorkspace === 'sale' ? 'New Sale' : 'New Purchase')}</span>
          <Space>
            <Button onClick={closeTransactionWorkspace}>Close Screen</Button>
            <Button type="text" onClick={() => {
              localStorage.removeItem('xmart_token');
              localStorage.removeItem('xmart_user');
              setUser(null);
            }}>Logout</Button>
          </Space>
        </div>
        <div className="transaction-fullscreen-content">
          <InvoiceWorkspace
            type={transactionWorkspace}
            editId={transactionEditId || undefined}
            onReload={() => window.dispatchEvent(new Event('xmart:data-changed'))}
            onCloseAll={closeTransactionWorkspace}
          />
        </div>
      </div>
    );
  }

  // Keep the same page component mounted while entering/leaving immersive mode.
  // This preserves Report/Edit state instead of remounting the report component.
  return (

    <Layout
      className={immersive ? 'app-standard app-immersive-shell' : 'app-standard'}
      style={{ minHeight: '100vh', width: '100vw' }}
    >

      {!immersive && <Layout.Sider
        breakpoint="lg"
        collapsedWidth="0"
      >

        <div className="sider-brand">

          XMART <span>ERP</span>

        </div>


        <Menu

          theme="dark"

          mode="inline"

          selectedKeys={[key]}

          defaultOpenKeys={[]}

          items={items}

          onClick={event =>
            navigate(event.key)
          }

        />

      </Layout.Sider>}

      <Layout className="app-standard-main">

        <Layout.Header className={immersive ? 'topbar app-immersive-topbar' : 'topbar'}>
          <b>Punjab Hospital</b>
          {immersive ? (
            <Space>
              <Button size="small" onClick={() => setImmersive(false)}>Close Screen</Button>
              <span>{user.name}{' · '}{user.role}</span>
            </Space>
          ) : (
            <span>
              {user.name}{' · '}{user.role}{' '}
              <Button type="text" onClick={() => {
                localStorage.removeItem('xmart_token');
                setUser(null);
                setKey('dashboard');
                setTransactionWorkspace(null);
                setTransactionEditId(null);
                setTransactionReturnKey('dashboard');
                setImmersive(false);
              }}>Logout</Button>
            </span>
          )}
        </Layout.Header>

        <Layout.Content
          className="content"
        >

          {Object.entries(pages).map(([pageKey, page]) => (
            <div key={pageKey} style={{ display: pageKey === key ? 'block' : 'none' }}>{page}</div>
          ))}

        </Layout.Content>


        {!immersive && <Layout.Footer>
          © {new Date().getFullYear()} Punjab Hospital
        </Layout.Footer>}

      </Layout>

    </Layout>

  );

}


/* =========================================================
   START REACT
========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
);

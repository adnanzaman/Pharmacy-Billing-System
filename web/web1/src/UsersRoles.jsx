import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button, Form, Input, Modal, Select, Checkbox, Tag, Space, Popconfirm, Typography, message, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { API, getErrorMessage } from './common';

const GROUPS = [
  { title: 'Dashboard', codes: ['dashboard.view'] },
  { title: 'Sales', codes: ['sales.view','sales.manage'] },
  { title: 'Purchase', codes: ['purchase.view','purchase.manage'] },
  { title: 'Returns / Credit & Debit Notes', codes: ['returns.view','returns.manage'] },
  { title: 'Inventory', codes: ['inventory.view','inventory.manage'] },
  { title: 'Parties', codes: ['parties.view','parties.manage'] },
  { title: 'Payments', codes: ['payments.view','payments.manage'] },
  { title: 'Cash & Bank', codes: ['cashbank.view','cashbank.manage'] },
  { title: 'Expenses', codes: ['expenses.view','expenses.manage'] },
  { title: 'Accounting / Finance', codes: ['accounting.view','accounting.manage'] },
  { title: 'Reports', codes: ['reports.view'] },
  { title: 'Users & Roles', codes: ['users.manage','roles.manage'] },
  { title: 'Configuration', codes: ['settings.view','settings.manage'] },
  { title: 'License', codes: ['license.view','license.manage'] }
];

const LABELS = {
  'dashboard.view':'View Dashboard',
  'sales.view':'View Sales', 'sales.manage':'Create / Post Sales',
  'purchase.view':'View Purchases', 'purchase.manage':'Create / Post Purchases',
  'returns.view':'View Returns', 'returns.manage':'Create Returns / Credit Notes',
  'inventory.view':'View Inventory', 'inventory.manage':'Manage Inventory',
  'parties.view':'View Parties', 'parties.manage':'Manage Parties',
  'payments.view':'View Payments', 'payments.manage':'Create Payments',
  'cashbank.view':'View Cash & Bank', 'cashbank.manage':'Manage Cash & Bank',
  'expenses.view':'View Expenses', 'expenses.manage':'Create Expenses',
  'accounting.view':'View Accounting / Finance', 'accounting.manage':'Manage Accounting',
  'reports.view':'View Reports',
  'users.manage':'Create / Edit / Disable Users', 'roles.manage':'Create / Edit Roles & Permissions',
  'settings.view':'View Configuration', 'settings.manage':'Change Configuration',
  'license.view':'View License', 'license.manage':'Manage License'
};

export default function UsersRoles({ can }) {
  const allowUsers = can('users.manage');
  const allowRoles = can('roles.manage');
  const [tab, setTab] = useState(allowUsers ? 'users' : 'roles');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const jobs = [];
      if (allowUsers) jobs.push(API.get('/users'));
      if (allowRoles) {
        jobs.push(API.get('/roles'));
        jobs.push(API.get('/roles/permissions'));
      }
      const result = await Promise.all(jobs);
      let i = 0;
      if (allowUsers) setUsers(result[i++].data || []);
      if (allowRoles) {
        setRoles(result[i++].data || []);
        setPermissions(result[i++].data || []);
      }
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const roleOptions = roles.map(r => ({ label: r.name, value: r.id }));

  const openUser = async user => {
    setEditingUser(user || null);
    if (user) {
      try {
        const { data } = await API.get(`/users/${user.id}`);
        userForm.setFieldsValue({ name:data.name, email:data.email, role_ids:(data.roles || []).map(r=>r.id), is_active:!!data.is_active, password:'' });
      } catch (e) { message.error(getErrorMessage(e)); return; }
    } else {
      userForm.resetFields();
      userForm.setFieldsValue({ is_active:true, role_ids: roleOptions.length ? [roleOptions[0].value] : [] });
    }
    setUserModal(true);
  };

  const saveUser = async values => {
    try {
      const payload = { ...values, role_ids: values.role_ids || [] };
      if (!payload.password) delete payload.password;
      if (editingUser) await API.put(`/users/${editingUser.id}`, payload);
      else await API.post('/users', payload);
      message.success(editingUser ? 'User updated' : 'User created');
      setUserModal(false);
      load();
    } catch (e) { message.error(getErrorMessage(e)); }
  };

  const openRole = async role => {
    setEditingRole(role || null);
    if (role) {
      try {
        const { data } = await API.get(`/roles/${role.id}`);
        roleForm.setFieldsValue({ name:data.name, permissions:data.permissions || [] });
      } catch (e) { message.error(getErrorMessage(e)); return; }
    } else {
      roleForm.resetFields();
      roleForm.setFieldsValue({ permissions:['dashboard.view'] });
    }
    setRoleModal(true);
  };

  const saveRole = async values => {
    try {
      if (editingRole) await API.put(`/roles/${editingRole.id}`, values);
      else await API.post('/roles', values);
      message.success(editingRole ? 'Role updated' : 'Role created');
      setRoleModal(false);
      load();
    } catch (e) { message.error(getErrorMessage(e)); }
  };

  const deleteRole = async id => {
    try { await API.delete(`/roles/${id}`); message.success('Role deleted'); load(); }
    catch (e) { message.error(getErrorMessage(e)); }
  };

  return <>
    <div className="page-head"><Typography.Title>User & Role Management</Typography.Title><Space><Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button></Space></div>
    <Card>
      <Space style={{ marginBottom:16 }}>
        {allowUsers && <Button type={tab==='users'?'primary':'default'} onClick={()=>setTab('users')}>Users</Button>}
        {allowRoles && <Button type={tab==='roles'?'primary':'default'} onClick={()=>setTab('roles')}>Roles & Permissions</Button>}
      </Space>

      {tab==='users' && allowUsers && <>
        <Row justify="end" style={{ marginBottom:12 }}><Button type="primary" icon={<PlusOutlined />} onClick={()=>openUser()}>Create User</Button></Row>
        <Table loading={loading} rowKey="id" dataSource={users} pagination={{pageSize:10}} columns={[
          { title:'Name', dataIndex:'name' }, { title:'Email', dataIndex:'email' },
          { title:'Roles', dataIndex:'roles', render:rs=><Space wrap>{(rs||[]).map(r=><Tag key={r}>{r}</Tag>)}</Space> },
          { title:'Status', dataIndex:'is_active', render:v=><Tag color={v?'green':'red'}>{v?'Active':'Disabled'}</Tag> },
          { title:'Actions', render:(_,r)=><Button icon={<EditOutlined />} onClick={()=>openUser(r)}>Edit</Button> }
        ]} />
      </>}

      {tab==='roles' && allowRoles && <>
        <Row justify="end" style={{ marginBottom:12 }}><Button type="primary" icon={<PlusOutlined />} onClick={()=>openRole()}>Create Role</Button></Row>
        <Table loading={loading} rowKey="id" dataSource={roles} pagination={{pageSize:10}} columns={[
          { title:'Role', dataIndex:'name' }, { title:'Users', dataIndex:'user_count' },
          { title:'Permissions', dataIndex:'permissions', render:ps=><span>{(ps||[]).length} enabled</span> },
          { title:'Actions', render:(_,r)=><Space><Button icon={<EditOutlined />} onClick={()=>openRole(r)}>Edit</Button><Popconfirm title="Delete this role?" onConfirm={()=>deleteRole(r.id)}><Button danger icon={<DeleteOutlined />} disabled={r.name==='Admin'}>Delete</Button></Popconfirm></Space> }
        ]} />
      </>}
    </Card>

    <Modal title={editingUser?'Edit User':'Create User'} open={userModal} onCancel={()=>setUserModal(false)} onOk={()=>userForm.submit()} destroyOnClose>
      <Form form={userForm} layout="vertical" onFinish={saveUser}>
        <Form.Item name="name" label="Full Name" rules={[{required:true}]}><Input /></Form.Item>
        <Form.Item name="email" label="Email / Login" rules={[{required:true,type:'email'}]}><Input /></Form.Item>
        <Form.Item name="password" label={editingUser?'New Password (leave blank to keep current)':'Password'} rules={editingUser?[]:[{required:true,min:6}]}><Input.Password /></Form.Item>
        <Form.Item name="role_ids" label="Roles" rules={[{required:true,message:'Select at least one role'}]}><Select mode="multiple" options={roleOptions} placeholder="Select role(s)" /></Form.Item>
        <Form.Item name="is_active" label="Account Active" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>

    <Modal title={editingRole?'Edit Role & Screen Access':'Create Role & Screen Access'} open={roleModal} onCancel={()=>setRoleModal(false)} onOk={()=>roleForm.submit()} width={760} destroyOnClose>
      <Form form={roleForm} layout="vertical" onFinish={saveRole}>
        <Form.Item name="name" label="Role Name" rules={[{required:true}]}><Input placeholder="e.g. Cashier, Store Manager, Accountant" /></Form.Item>
        <Typography.Text strong>Access Control — tick only what this role can use</Typography.Text>
        <Form.Item name="permissions" style={{marginTop:12}}>
          <Checkbox.Group style={{width:'100%'}}>
            <Row gutter={[12,12]}>
              {GROUPS.map(group => <Col xs={24} md={12} key={group.title}>
                <Card size="small" title={group.title}>
                  <Space direction="vertical">
                    {group.codes.map(code => <Checkbox key={code} value={code}>{LABELS[code] || code}</Checkbox>)}
                  </Space>
                </Card>
              </Col>)}
            </Row>
          </Checkbox.Group>
        </Form.Item>
        <Typography.Paragraph type="secondary" style={{marginTop:8}}>
          Permissions are enforced on the server as well as hidden from the menu, so removing a tick also blocks direct API access.
        </Typography.Paragraph>
      </Form>
    </Modal>
  </>;
}

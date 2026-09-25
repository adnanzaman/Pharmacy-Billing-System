USE xmart_hospital;

INSERT INTO hospitals (name, phone, address) VALUES
('Xmart Demo Hospital', '0300-0000000', 'Pakistan');

INSERT INTO branches (hospital_id, name, code) VALUES
(1, 'Main Branch', 'MAIN');

INSERT INTO departments (hospital_id, name) VALUES
(1, 'General Medicine'),
(1, 'Cardiology'),
(1, 'Gynaecology'),
(1, 'Emergency');

INSERT INTO roles (name) VALUES
('Admin'),('Doctor'),('Pharmacist'),('Receptionist'),('Accountant');

INSERT INTO permissions (code) VALUES
('dashboard.view'),('patients.view'),('patients.create'),('doctors.manage'),
('medicines.view'),('medicines.manage'),('purchase.manage'),('sales.manage'),
('inventory.view'),('accounts.view'),('reports.view'),('settings.manage');

INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

INSERT INTO doctors
(hospital_id, department_id, doctor_code, name, qualification, speciality, consultation_fee)
VALUES
(1,1,'DOC-001','Dr. Ahmed Khan','MBBS','General Medicine',500),
(1,2,'DOC-002','Dr. Sara Ali','MBBS, FCPS','Cardiology',1000);

INSERT INTO medicine_categories (hospital_id,name) VALUES
(1,'Tablet'),(1,'Syrup'),(1,'Injection'),(1,'Surgical');

INSERT INTO manufacturers (hospital_id,name) VALUES
(1,'Demo Pharma');

INSERT INTO medicine_units (hospital_id,name) VALUES
(1,'Piece'),(1,'Box'),(1,'Bottle');

INSERT INTO tax_profiles (hospital_id,name,tax_type,rate,is_tax_inclusive)
VALUES
(1,'Exempt','EXEMPT',0,0),
(1,'Taxable Configurable','TAXABLE',0,0);

INSERT INTO hs_codes (code,description) VALUES
('0000.0000','Configure applicable HS code');

INSERT INTO medicines
(hospital_id,category_id,manufacturer_id,unit_id,tax_profile_id,hs_code_id,name,generic_name,strength,pack_size,reorder_level)
VALUES
(1,1,1,1,1,1,'Panadol 500mg','Paracetamol','500mg','20 tablets',50),
(1,1,1,1,1,1,'Brufen 400mg','Ibuprofen','400mg','20 tablets',30),
(1,2,1,3,1,1,'Demo Syrup','Demo Generic','100mg/5ml','120ml',20);

INSERT INTO medicine_batches
(medicine_id,batch_no,manufacture_date,expiry_date,purchase_price,sale_price,mrp)
VALUES
(1,'PNL-001','2026-01-01','2028-01-01',180,210,210),
(2,'BRF-001','2026-01-01','2028-02-01',140,180,180),
(3,'SYR-001','2026-01-01','2027-12-01',120,160,160);

INSERT INTO warehouses (hospital_id,branch_id,name) VALUES
(1,1,'Main Pharmacy');

INSERT INTO accounts (hospital_id,code,name,account_type) VALUES
(1,'1000','Cash','ASSET'),
(1,'1100','Bank','ASSET'),
(1,'1200','Inventory','ASSET'),
(1,'2000','Accounts Payable','LIABILITY'),
(1,'3000','Capital','EQUITY'),
(1,'4000','Sales Revenue','REVENUE'),
(1,'5000','Cost of Goods Sold','EXPENSE'),
(1,'5100','Hospital Expenses','EXPENSE');

-- Demo administrator. Password: Admin@123
INSERT INTO users (hospital_id,branch_id,name,email,password_hash)
VALUES (1,1,'System Administrator','admin@gmail.com',
'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
INSERT INTO user_roles(user_id,role_id)
SELECT u.id,r.id FROM users u CROSS JOIN roles r
WHERE u.email='admin@gmail.com' AND r.name='Admin';

-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS UserManagement;

-- Sử dụng cơ sở dữ liệu
USE UserManagement;

-- Tạo bảng thông tin người dùng
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,         -- ID tự tăng
    full_name VARCHAR(100) NOT NULL,           -- Họ và tên
    student_id VARCHAR(20) NOT NULL UNIQUE,    -- Mã số sinh viên (duy nhất)
    position VARCHAR(50),                      -- Chức vụ
    email VARCHAR(100) NOT NULL UNIQUE,        -- Email (duy nhất)
    date_of_birth DATE,                        -- Ngày sinh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo bản ghi
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Ngày cập nhật cuối
);


-- Tạo bảng UserSecurity lưu thông tin bảo mật
CREATE TABLE UserSecurity (
    user_id INT PRIMARY KEY,                    -- Khóa chính, liên kết với bảng Users
    password VARCHAR(255) NOT NULL,            -- Mật khẩu (đã mã hóa)
    fingerprint BLOB,                          -- Dữ liệu vân tay (nhị phân)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian tạo bản ghi
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Thời gian cập nhật bản ghi
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE -- Liên kết với Users, xóa khi người dùng bị xóa
);


INSERT INTO Users(full_name, student_id, position, email, date_of_birth) VALUES
('Trần Quốc Toàn', '2014785', 'sinh viên', 'toan.tran3112@hcmut.edu.vn', '2002-12-31'),
('Nguyễn Tiến Nhật', '2014846', 'sinh viên', 'nhat.nguyen@hcmut.edu.vn', '2002-11-13'),
('Trịnh Tự Minh', '2014113', 'sinh viên', 'tu.minh3@hcmut.edu.vn', '2002-10-24'),
('Trần Anh Tú', '2014742', 'sinh viên', 'tu.anh@hcmut.edu.vn', '2002-7-12'),
('Đặng Phước Cường', '2014664', 'sinh viên', 'dang.cuong@hcmut.edu.vn', '2002-8-3')


INSERT INTO UserSecurity (user_id, password, fingerprint) VALUES
(1, '3112', NULL),
(2, '1311', NULL),
(3, '2412', NULL),
(4, '1207', NULL),
(5, '0308', NULL),

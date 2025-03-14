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

    password VARCHAR(255) NOT NULL,            -- Mật khẩu (đã mã hóa)
    fingerprint INT NOT NULL DEFAULT 0,                          -- Dữ liệu vân tay (nhị phân)

    pass_en BOOLEAN NOT NULL DEFAULT 0,    -- Cho phép sử dụng mật khẩu (0: Không, 1: Có)
    fing_en BOOLEAN NOT NULL DEFAULT 0,    -- Cho phép sử dụng vân tay (0: Không, 1: Có)
    allowed_days VARCHAR(50) NOT NULL, -- Ví dụ: "Monday,Tuesday,Friday"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo bản ghi
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Ngày cập nhật cuối
);


-- Tạo bảng UserSecurity lưu thông tin bảo mật
CREATE TABLE user_security (
    id INT AUTO_INCREMENT PRIMARY KEY,                    -- Khóa chính
    student_id VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,            -- Mật khẩu (đã mã hóa)
    fingerprint BLOB,                          -- Dữ liệu vân tay (nhị phân)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian tạo bản ghi
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Thời gian cập nhật bản ghi
    FOREIGN KEY (student_id) REFERENCES Users(student_id) ON DELETE CASCADE -- Liên kết với Users, xóa khi người dùng bị xóa
);



CREATE TABLE user_config (
    id INT AUTO_INCREMENT PRIMARY KEY,     -- ID của bảng
    student_id VARCHAR(20) NOT NULL,       -- Liên kết với student_id từ bảng users
    pass_en BOOLEAN NOT NULL DEFAULT 0,    -- Cho phép sử dụng mật khẩu (0: Không, 1: Có)
    fing_en BOOLEAN NOT NULL DEFAULT 0,    -- Cho phép sử dụng vân tay (0: Không, 1: Có)
    FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE
);



CREATE TABLE time_management (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    allowed_days VARCHAR(50) NOT NULL, -- Ví dụ: "Monday,Tuesday,Friday"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);



CREATE TABLE command (
    id INT AUTO_INCREMENT PRIMARY KEY,
    func VARCHAR(10) NOT NULL,
    fing_register BOOLEAN NOT NULL DEFAULT 0,
    control_lock BOOLEAN NOT NULL DEFAULT 0
)



CREATE TABLE active_users (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- Mã tự động tăng để định danh duy nhất mỗi dòng
    full_name VARCHAR(50) NOT NULL,             -- Tên đầy đủ của sinh viên
    student_id VARCHAR(20) NOT NULL,            -- Mã số sinh viên
    position VARCHAR(20),                       -- Vị trí (sinh viên, giảng viên, v.v.)
    login_date DATE NOT NULL,                   -- Ngày đăng nhập
    login_time TIME NOT NULL,                   -- Thời gian đăng nhập
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Thời điểm thêm vào bảng
)



INSERT INTO Users(full_name, student_id, position, email) VALUES
('Trần Quốc Toàn', '2014785', 'sinh viên', 'toan.tran3112@hcmut.edu.vn'),
('Nguyễn Tiến Nhật', '2014846', 'sinh viên', 'nhat.nguyen@hcmut.edu.vn'),
('Trịnh Tự Minh', '2014113', 'sinh viên', 'tu.minh3@hcmut.edu.vn'),
('Trần Anh Tú', '2014742', 'sinh viên', 'tu.anh@hcmut.edu.vn'),
('Đặng Phước Cường', '2014664', 'sinh viên', 'dang.cuong@hcmut.edu.vn')


INSERT INTO UserSecurity (user_id, password, fingerprint) VALUES
(1, '3112', NULL),
(2, '1311', NULL),
(3, '2412', NULL),
(4, '1207', NULL),
(5, '0308', NULL),

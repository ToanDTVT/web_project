
const express = require('express');
const ketnoi = require('./connect-mysql');
const app = express();
const util = require('node:util');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const moment = require('moment');

let dataHasChanged = false;
let dataESP = true;
let activeUsers = [];


// Kết nối MQTT broker
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883'); // Hoặc broker khác
const commandTopic = 'esp32/command';
const opendoorTopic = 'esp32/command/opendoor';
const registerfingerprintTopic = 'esp32/command/registerfingerprint';
const responseTopic = 'esp32/response';
const MQTT_TOPIC = 'esp32/data';
mqttClient.on('connect', () => {
  console.log('Kết nối MQTT thành công!');
  mqttClient.subscribe(responseTopic, (err) => {
    if (err) console.error('Failed to subscribe to response topic:', err);
  });
});



// Cấu hình middleware
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');    // Sử dụng EJS
app.use(express.static('public'));  // Chứa file tĩnh
app.use(bodyParser.json());    // Xử lý JSON


const PORT = process.env.PORT || 3000;
const query = util.promisify(ketnoi.query).bind(ketnoi);


//Trang hiển thị chính 
app.get('/', function(req, res) {
    res.render('home');
});


//API lấy dữ liệu từ database, gửi dữ liệu đến ESP32
app.get('/api/get-database', (req, res) => {
    
    //res.send(dataHasChanged ? 'true' : 'false');
    if(dataHasChanged == true) {
        ketnoi.query('SELECT * FROM users', (err, results) => {
            if (err) {
              res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
              return;
            }
            res.json(results); // Trả về JSON danh sách người dùng
        });
        // ketnoi.query('SELECT fing_register, control_lock FROM command', (err, results) => {
        //     if (err) {
        //       res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
        //       return;
        //     }
        //     res.json(results); // Trả về JSON danh sách người dùng
        // });
    }
    dataHasChanged = false; // Reset cờ sau khi ESP32 kiểm tra
});




// API nhận dữ liệu từ ESP32
app.post('/api/get-esp32', (req, res) => {
    const { full_name, student_id, position } = req.body;
    if (!full_name || !student_id || !position) {
        return res.status(400).send('Missing required fields');
    }

    const now = new Date();
    const login_date = now.toISOString().split('T')[0];
    const login_time = now.toTimeString().split(' ')[0];

    const sql = 'INSERT INTO active_users (full_name, student_id, position, login_date, login_time) VALUES (?, ?, ?, ?, ?)';
    const values = [full_name, student_id, position, login_date, login_time];

    ketnoi.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Database error');
        }
        res.send('Login recorded successfully');
    });
});





// API gửi thông tin người dùng cụ thể
app.get('/api/get-database/:id', (req, res) => {
    const userId = req.params.id;
    ketnoi.query('SELECT * FROM Users WHERE id = ?', [userId], (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
        return;
      }
      if (results.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy người dùng' });
        return;
      }
      res.json(results[0]); // Trả về JSON người dùng
    });
});





// API: Thay đổi cấu hình và gửi qua MQTT
app.post('/api/update-config', (req, res) => {
    const { student_id, pass_en, fing_en } = req.body;

    const sql = `UPDATE user_settings SET pass_en = ?, fing_en = ? WHERE student_id = ?`;
    ketnoi.query(sql, [pass_en, fing_en, student_id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            // Gửi dữ liệu thay đổi qua MQTT
            const mqttPayload = JSON.stringify({ student_id, pass_en, fing_en });
            mqttClient.publish(MQTT_TOPIC, mqttPayload);
            res.send({ message: 'Cập nhật thành công và gửi qua MQTT' });
        }
    });
});





app.get('/sign_in', function(req, res) {
    res.render('sign-in', { status: statusMessage });
});

app.post('/sign_in', (req, res) => {
    let sql = "INSERT INTO users SET ?";
    ketnoi.query(sql, req.body, (err, data) => {
        if(err) {

            let msg = '';

            if(err.errno == 1451) {
                msg = 'danh mục đang có, không thể xóa'
            } else if (err.errno == 2000) {
                msg = 'sinh viên đã tồn tại'
            }
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });

        } else {
            res.redirect('/infor_users');
        }
    })
    console.log(sql);

    dataHasChanged = true;
    //res.sendStatus(200);
});

app.get('/register_password', function(req, res) {
    res.render('sign-in-password');
});



app.get('/infor_users', async function(req, res) {
    let _name = req.query.name;
    //lấy trang hiện tại: 1, 2, 3
    let _page = req.query.page ? req.query.page : 1;
    // truy vấn tính tổng số dòng trong một bảng
    let _sql_total = "SELECT COUNT(*) as total FROM users";
    
    if (_name){
        _sql_total += " WHERE name LIKE '%" + _name + "%'";
    }

    let rowData = await query(_sql_total);
    let totalRow = rowData[0].total;
    
    let _limit = 20;
    let totalPage = Math.ceil(totalRow/_limit);
    _page = _page > 0 ? Math.floor(_page) : 1;
    _page = _page <= totalPage ? Math.floor(_page) : totalPage;

    let _start = (_page - 1) * _limit;
    let sql = "SELECT * FROM users";

    if(_name) {
        sql += " WHERE name LIKE '%" + _name + "%'";
    }
    sql += " order by id DESC LIMIT " + _start + "," + _limit;
    //số trang thực tế sẽ có
    ketnoi.query(sql, function(err, data) {
        res.render('information', {
            title: 'Quản lý thông tin',
            data: data,
            totalPage: totalPage,
            _page: parseInt(_page),
            _name: _name
        });
    });
    
});

app.get('/edit_infor_users/:id', (req, res) => {
    let id = req.params.id;
    ketnoi.query("SELECT * FROM users WHERE id = ?", [id], (err, data) => {
        
        if(data.length) {
            console.log(data);
            res.render('information-edit', {
                cat: data.length ? data[0] : {}
            });
        } else {
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });
        }
    })
})

app.post('/edit_infor_users/:id', async (req, res) => {
    let id = req.params.id;
    let checkExists = await query("SELECT COUNT(id) as count FROM users WHERE student_id = ? AND id != ?", [req.body.student_id, id]);
    console.log(checkExists);
    let sql = "UPDATE users SET ? WHERE id = ?"
    ketnoi.query(sql, [req.body, id], (err, data) => {
        if(err) {

            let msg = '';

            if(err.errno == 1451) {
                msg = 'danh mục đang có, không thể xóa'
            } else if (err.errno == 2000) {
                msg = 'sinh viên đã tồn tại'
            }
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });

        } else {
            res.redirect('/infor_users');
        }
    })
    console.log(sql);

    dataHasChanged = true;
    //res.sendStatus(200);
});

app.get('/delete_infor_users/:id', function(req, res) {
    let id = req.params.id;
    let sql_delte = "DELETE FROM users WHERE id = ?";
    ketnoi.query(sql_delte, [id], function(err, data) {
        if(err) {
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });
        } else {
            res.redirect('/infor_users');
        }
    });
});


app.get('/delete_time_login_users/:id', function(req, res) {
    let id = req.params.id;
    let sql_delte = "DELETE FROM active_users WHERE id = ?";
    ketnoi.query(sql_delte, [id], function(err, data) {
        if(err) {
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });
        } else {
            res.redirect('/infor_users');
        }
    });
});


app.get('/users_config', async function(req, res) {
    let _name = req.query.name;
    //lấy trang hiện tại: 1, 2, 3
    let _page = req.query.page ? req.query.page : 1;
    // truy vấn tính tổng số dòng trong một bảng
    let _sql_total = "SELECT COUNT(*) as total FROM users";
    
    if (_name){
        _sql_total += " WHERE name LIKE '%" + _name + "%'";
    }

    let rowData = await query(_sql_total);
    let totalRow = rowData[0].total;
    
    let _limit = 20;
    let totalPage = Math.ceil(totalRow/_limit);
    _page = _page > 0 ? Math.floor(_page) : 1;
    _page = _page <= totalPage ? Math.floor(_page) : totalPage;

    let _start = (_page - 1) * _limit;
    let sql = "SELECT * FROM users ";

    if(_name) {
        sql += " WHERE name LIKE '%" + _name + "%'";
    }
    sql += " order by id DESC LIMIT " + _start + "," + _limit;
    //số trang thực tế sẽ có
    ketnoi.query(sql, function(err, data) {
        res.render('users-config', {
            title: 'Cấu hình người dùng',
            data: data,
            totalPage: totalPage,
            _page: parseInt(_page),
            _name: _name
        });
    });
    
});

app.get('/config_users_secur/:id', function(req, res) {
    let id = req.params.id;
    ketnoi.query("SELECT * FROM users WHERE id = ?", [id], (err, data) => {
        
        if(data.length) {
            console.log(data);
            res.render('users-config-1', {
                cat: data.length ? data[0] : {}
            });
        } else {
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });
        }
    })
});


app.post('/config_users_secur/:id', async (req, res) => {
    let id = req.params.id;
    let checkExists = await query("SELECT COUNT(id) as count FROM users WHERE student_id = ? AND id != ?", [req.body.student_id, id]);
    console.log(checkExists);
    let sql = "UPDATE users SET ? WHERE id = ?"
    ketnoi.query(sql, [req.body, id], (err, data) => {
        if(err) {

            let msg = '';

            if(err.errno == 1451) {
                msg = 'danh mục đang có, không thể xóa'
            } else if (err.errno == 2000) {
                msg = 'sinh viên đã tồn tại'
            }
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });

        } else {
            res.redirect('/users_config');
        }
    })
    console.log(sql);

    dataHasChanged = true;
    //res.sendStatus(200);
});




app.get('/time_manage', async function(req, res) {
    let _name = req.query.name;
    //lấy trang hiện tại: 1, 2, 3
    let _page = req.query.page ? req.query.page : 1;
    // truy vấn tính tổng số dòng trong một bảng
    let _sql_total = "SELECT COUNT(*) as total FROM active_users";
    
    if (_name){
        _sql_total += " WHERE name LIKE '%" + _name + "%'";
    }

    let rowData = await query(_sql_total);
    let totalRow = rowData[0].total;
    
    let _limit = 25;
    let totalPage = Math.ceil(totalRow/_limit);
    _page = _page > 0 ? Math.floor(_page) : 1;
    _page = _page <= totalPage ? Math.floor(_page) : totalPage;

    let _start = (_page - 1) * _limit;
    let sql = "SELECT * FROM active_users";

    if(_name) {
        sql += " WHERE name LIKE '%" + _name + "%'";
    }
    sql += " order by id DESC LIMIT " + _start + "," + _limit;
    //số trang thực tế sẽ có
    ketnoi.query(sql, function(err, data) {
        res.render('time-manage', {
            title: 'Lịch sử đăng nhập',
            data: data,
            totalPage: totalPage,
            _page: parseInt(_page),
            _name: _name
        });
    });
});




//Lấy thông tin thời gian 
app.get('/api/getAccessTime', (req, res) => {
    const student_id = req.query.student_id;

    const query = 'SELECT * FROM users WHERE student_id = ?';
    ketnoi.query(query, [student_id], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else if (results.length > 0) {
            res.json({
                allowed_days: results[0].allowed_days,
                start_time: results[0].start_time,
                end_time: results[0].end_time,
            });
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    });
});





const cameraURL = 'http://192.168.2.21'; // IP của ESP32-CAM
app.get('/camera_stream', (req, res) => {
    res.render('stream-camera', { cameraURL });
});

app.post('/camera_stream', (req, res) => {
    res.render('stream-camera', { cameraURL });
    let sql = "UPDATE command SET ? WHERE id = 1"
    ketnoi.query(sql, [req.body, id], (err, data) => {
        if(err) {

            let msg = '';

            if(err.errno == 1451) {
                msg = 'danh mục đang có, không thể xóa'
            } else if (err.errno == 2000) {
                msg = 'sinh viên đã tồn tại'
            }
            res.render('error', {
                message: err.sqlMessage,
                code: err.errno
            });

        } else {
            res.redirect('/users_config');
        }
    })
});









//===========SỬ DỤNG MQTT ĐỂ ĐIỀU KHIỂN THIẾT BỊ========================================================================
// Nhận phản hồi từ ESP32
let statusMessage = '';
mqttClient.on('message', (topic, message) => {
  if (topic === responseTopic) {
    statusMessage = message.toString();
    console.log('ESP32 Response:', statusMessage);
  }
});

app.get('/mqtt', (req, res) => {
    res.render('mqtt', { status: statusMessage });
});

// Gửi lệnh MQTT tới ESP32
app.post('/send-command-open-door', (req, res) => {
    const command = JSON.stringify({ action: 'start_task' });
    mqttClient.publish(opendoorTopic, command, () => {
      console.log('Command sent to ESP32:', command);
    });
    res.render('mqtt', { status: 'Đã gửi lệnh, chờ ESP32 phản hồi...' });
});



app.post('/send-command-register-fingerprint', (req, res) => {
    const inputData = req.body.inputData; // Dữ liệu nhập từ form
    const command = JSON.stringify({ mssv: inputData });
    mqttClient.publish(registerfingerprintTopic, command, () => {
      console.log('Command sent to ESP32:', command);
    });
    res.render('mqtt', { status: 'Đã gửi lệnh, chờ ESP32 phản hồi...' });
});



app.listen(PORT, '0.0.0.0', function() {
    console.log('Serve run on http://localhost:'+ PORT)
})
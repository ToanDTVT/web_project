
const express = require('express');
const ketnoi = require('./connect-mysql');
const app = express();
const util = require('node:util');

const bodyParser = require('body-parser');


// Cấu hình middleware
app.use(bodyParser.urlencoded({
    extended:true
}));
app.set('view engine', 'ejs');    // Sử dụng EJS
app.use(express.static('public'));  // Chứa file tĩnh
app.use(bodyParser.json());    // Xử lý JSON


const PORT = process.env.PORT || 3000;
const query = util.promisify(ketnoi.query).bind(ketnoi);


//Trang hiển thị chính 
app.get('/', function(req, res) {
    res.render('home');
});


//API gửi dữ liệu đến ESP32
app.get('/api/users', (req, res) => {
    ketnoi.query('SELECT * FROM users', (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
        return;
      }
      res.json(results); // Trả về JSON danh sách người dùng
    });
});



// API gửi thông tin người dùng cụ thể
app.get('/api/users/:id', (req, res) => {
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









app.get('/sign_in', function(req, res) {
    res.render('sign-in');
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
    
    let _limit = 5;
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
    
    let _limit = 5;
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
});



app.listen(PORT, function() {
    console.log('Serve run on http://localhost:'+ PORT)
})
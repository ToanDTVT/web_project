const ketnoi = require('../connect-mysql');
const util = require('node:util');
const query = util.promisify(ketnoi.query).bind(ketnoi);
const Information = require('../models/information.model')

exports.index = async function(req, res) {
    var cat = new Information();
    cat.getAll(function(err, data) {
        console.log(data);
    })
    
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
    
}


exports.delete = function(req, res) {
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
}


exports.create = function(req, res) {
    res.render('sign-in');
}


exports.store = (req, res) => {
    let sql = "INSERT INTO users SET ?"
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
}


exports.edit = (req, res) => {
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
}


exports.update = async (req, res) => {
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
}
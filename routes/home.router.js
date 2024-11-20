const homeCtrl = require('../controllers/home.controller')

module.exports = function(app) {
    app.get('/', homeCtrl.home);
    app.get('/about', homeCtrl.about);
    app.get('/contact', homeCtrl.contact);
}
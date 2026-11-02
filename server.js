const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./database/db');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsers for form submissions and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration for authentication
app.use(session({
    secret: 'szt-restauracja-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Pass user session data and active route to all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.activeTab = '';
    next();
});

// 1. Static assets for client (CSS, images, JS, webfonts)
app.use(express.static(path.join(__dirname, 'client'), { index: false }));

// 2. Static assets for AdminLTE (CSS, JS, Assets) - without auto-serving index.html
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));

// 3. Mount Admin CMS router
app.use('/admin', adminRoutes);

// Helper to get restaurant info from DB
function getRestaurantInfo() {
    const rows = db.prepare('SELECT key, value FROM restaurant_info').all();
    const info = {};
    rows.forEach(r => { info[r.key] = r.value; });
    return info;
}

// ==========================================
// CLIENT ROUTES (Sarab Restaurant Website)
// ==========================================

// 1. Home page
app.get('/', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    const dishes = db.prepare(`
        SELECT m.*, c.name as category_name, c.slug as category_slug
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        WHERE m.is_active = 1
        ORDER BY m.is_dish_of_the_day DESC, m.id ASC
        LIMIT 6
    `).all();
    const reviews = db.prepare('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY id DESC LIMIT 4').all();
    const info = getRestaurantInfo();

    res.render('client/index', {
        title: 'Sarab - Fast Food & Restaurant',
        activePage: 'home',
        categories,
        dishes,
        reviews,
        info
    });
});

// 2. About Us page
app.get('/about', (req, res) => {
    const chefs = db.prepare('SELECT * FROM chefs').all();
    const info = getRestaurantInfo();

    res.render('client/about', {
        title: 'About Us - Sarab Restaurant',
        activePage: 'about',
        chefs,
        info
    });
});

// 3. Menu page (Full dynamic menu)
app.get('/menu', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    const dishes = db.prepare(`
        SELECT m.*, c.name as category_name, c.slug as category_slug
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        WHERE m.is_active = 1
        ORDER BY m.is_dish_of_the_day DESC, m.category_id ASC, m.id ASC
    `).all();

    res.render('client/menu', {
        title: 'Our Menu - Sarab Restaurant',
        activePage: 'menu',
        categories,
        dishes
    });
});

// 4. Chefs page
app.get('/chefs', (req, res) => {
    const chefs = db.prepare('SELECT * FROM chefs').all();

    res.render('client/chefs', {
        title: 'Our Chefs - Sarab Restaurant',
        activePage: 'chefs',
        chefs
    });
});

// 5. Reservation page (View & Form Submission)
app.get('/reservation', (req, res) => {
    const openingHours = db.prepare('SELECT * FROM opening_hours ORDER BY sort_order ASC').all();
    const info = getRestaurantInfo();

    res.render('client/reservation', {
        title: 'Table Reservation - Sarab Restaurant',
        activePage: 'reservation',
        openingHours,
        info,
        booked: req.query.booked === '1'
    });
});

app.post('/reservation', (req, res) => {
    const { full_name, phone, email, guests, reservation_date, reservation_time, special_requests } = req.body;
    
    if (full_name && phone && email && reservation_date && reservation_time) {
        db.prepare(`
            INSERT INTO reservations (full_name, phone, email, guests, reservation_date, reservation_time, special_requests, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `).run(full_name, phone, email, parseInt(guests) || 1, reservation_date, reservation_time, special_requests || '');
    }

    res.redirect('/reservation?booked=1');
});

// 6. Reviews page (View & New Review Submission)
app.get('/reviews', (req, res) => {
    const reviews = db.prepare('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY id DESC').all();

    res.render('client/reviews', {
        title: 'Customer Reviews - Sarab Restaurant',
        activePage: 'reviews',
        reviews,
        sent: req.query.sent === '1'
    });
});

app.post('/reviews', (req, res) => {
    const { author_name, rating, comment } = req.body;

    if (author_name && comment) {
        db.prepare(`
            INSERT INTO reviews (author_name, role_or_city, rating, comment, is_approved)
            VALUES (?, 'Verified Guest', ?, ?, 0)
        `).run(author_name, parseInt(rating) || 5, comment);
    }

    res.redirect('/reviews?sent=1');
});

// 7. Contact page (View & Message Submission)
app.get('/contact', (req, res) => {
    const openingHours = db.prepare('SELECT * FROM opening_hours ORDER BY sort_order ASC').all();
    const info = getRestaurantInfo();

    res.render('client/contact', {
        title: 'Contact Us - Sarab Restaurant',
        activePage: 'contact',
        openingHours,
        info,
        sent: req.query.sent === '1'
    });
});

app.post('/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (name && email && message) {
        db.prepare(`
            INSERT INTO contact_messages (name, email, phone, subject, message)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, email, phone || '', subject || 'General Inquiry', message);
    }

    res.redirect('/contact?sent=1');
});

// Start the server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Serwer dziala pod adresem: http://localhost:${PORT}`);
    console.log(` Strona restauracji (klient):`);
    console.log(`   - Home:        http://localhost:${PORT}/`);
    console.log(`   - Menu:        http://localhost:${PORT}/menu`);
    console.log(`   - Rezerwacje:  http://localhost:${PORT}/reservation`);
    console.log(` Panel administracyjny CMS (AdminLTE):`);
    console.log(`   - Logowanie:   http://localhost:${PORT}/admin/login`);
    console.log(`   - Pulpit CMS:  http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
});

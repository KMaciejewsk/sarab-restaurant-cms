const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Middleware: Sprawdzenie czy uzytkownik jest zalogowany
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/admin/login');
    }
    next();
}

// Middleware: Sprawdzenie czy uzytkownik ma role Wlasciciela (owner)
function requireOwner(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'owner') {
        return res.status(403).send('Brak uprawnień. Ta sekcja jest dostępna tylko dla Właściciela.');
    }
    next();
}

// Helper do danych restauracji
function getRestaurantInfo() {
    const rows = db.prepare('SELECT key, value FROM restaurant_info').all();
    const info = {};
    rows.forEach(r => { info[r.key] = r.value; });
    return info;
}

// ==========================================
// AUTORYZACJA (Logowanie i wylogowanie)
// ==========================================

// Strona logowania
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

// Obsluga logowania
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

    if (!user) {
        return res.render('admin/login', { error: 'Nieprawidłowy login lub hasło.' });
    }

    req.session.user = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
    };

    res.redirect('/admin');
});

// Wylogowanie
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

// Wszystkie trasy ponizej wymagaja zalogowania
router.use(requireAuth);

// ==========================================
// PULPIT GLOWNY (DASHBOARD)
// ==========================================

router.get('/', (req, res) => {
    const dishesCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get().c;
    const pendingReservations = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE status = 'pending'").get().c;
    const dailyDish = db.prepare('SELECT name FROM menu_items WHERE is_dish_of_the_day = 1 LIMIT 1').get();
    const unreadMessages = db.prepare('SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0').get().c;

    const recentReservations = db.prepare('SELECT * FROM reservations ORDER BY id DESC LIMIT 5').all();
    const pendingReviews = db.prepare('SELECT * FROM reviews WHERE is_approved = 0 ORDER BY id DESC LIMIT 5').all();

    res.render('admin/dashboard', {
        stats: {
            dishesCount,
            pendingReservations,
            dailyDish,
            unreadMessages
        },
        recentReservations,
        pendingReviews
    });
});

// ==========================================
// KARTA MENU (Dla Pracownika i Wlasciciela)
// ==========================================

// Lista dan
router.get('/menu', (req, res) => {
    const dishes = db.prepare(`
        SELECT m.*, c.name as category_name
        FROM menu_items m
        JOIN categories c ON m.category_id = c.id
        ORDER BY m.is_dish_of_the_day DESC, m.id DESC
    `).all();

    res.render('admin/menu/index', {
        dishes,
        success: req.query.success || null
    });
});

// Formularz dodawania dania
router.get('/menu/new', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.render('admin/menu/form', { dish: null, categories });
});

// Zapis nowego dania
router.post('/menu/new', (req, res) => {
    const {
        name, category_id, price, old_price, badge,
        image, tags, calories, prep_time, short_desc, description, is_dish_of_the_day
    } = req.body;

    const isDaily = is_dish_of_the_day === '1' ? 1 : 0;

    if (isDaily === 1) {
        db.prepare('UPDATE menu_items SET is_dish_of_the_day = 0').run();
    }

    db.prepare(`
        INSERT INTO menu_items (
            name, category_id, price, old_price, badge,
            image, tags, calories, prep_time, short_desc, description, is_dish_of_the_day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        name,
        parseInt(category_id),
        parseFloat(price) || 0,
        old_price ? parseFloat(old_price) : null,
        badge || null,
        image || '/img/menu/1.jpg',
        tags || '',
        parseInt(calories) || 500,
        parseInt(prep_time) || 15,
        short_desc || '',
        description || '',
        isDaily
    );

    res.redirect('/admin/menu');
});

// Formularz edycji dania
router.get('/menu/edit/:id', (req, res) => {
    const dish = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!dish) return res.redirect('/admin/menu');

    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.render('admin/menu/form', { dish, categories });
});

// Zapis edycji dania
router.post('/menu/edit/:id', (req, res) => {
    const {
        name, category_id, price, old_price, badge,
        image, tags, calories, prep_time, short_desc, description, is_dish_of_the_day
    } = req.body;

    const isDaily = is_dish_of_the_day === '1' ? 1 : 0;

    if (isDaily === 1) {
        db.prepare('UPDATE menu_items SET is_dish_of_the_day = 0').run();
    }

    db.prepare(`
        UPDATE menu_items SET
            name = ?, category_id = ?, price = ?, old_price = ?, badge = ?,
            image = ?, tags = ?, calories = ?, prep_time = ?, short_desc = ?, description = ?, is_dish_of_the_day = ?
        WHERE id = ?
    `).run(
        name,
        parseInt(category_id),
        parseFloat(price) || 0,
        old_price ? parseFloat(old_price) : null,
        badge || null,
        image || '/img/menu/1.jpg',
        tags || '',
        parseInt(calories) || 500,
        parseInt(prep_time) || 15,
        short_desc || '',
        description || '',
        isDaily,
        req.params.id
    );

    res.redirect('/admin/menu');
});

// Szybkie przelaczenie Dania Dnia
router.post('/menu/toggle-daily/:id', (req, res) => {
    const dish = db.prepare('SELECT is_dish_of_the_day FROM menu_items WHERE id = ?').get(req.params.id);
    if (dish) {
        if (dish.is_dish_of_the_day === 1) {
            db.prepare('UPDATE menu_items SET is_dish_of_the_day = 0 WHERE id = ?').run(req.params.id);
        } else {
            db.prepare('UPDATE menu_items SET is_dish_of_the_day = 0').run();
            db.prepare('UPDATE menu_items SET is_dish_of_the_day = 1 WHERE id = ?').run(req.params.id);
        }
    }
    res.redirect('/admin/menu');
});

// Usuniecie dania
router.post('/menu/delete/:id', (req, res) => {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
    res.redirect('/admin/menu');
});

// ==========================================
// REZERWACJE STOLIKOW
// ==========================================

router.get('/reservations', (req, res) => {
    const reservations = db.prepare('SELECT * FROM reservations ORDER BY reservation_date DESC, id DESC').all();
    res.render('admin/reservations', { reservations });
});

router.post('/reservations/status/:id', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, req.params.id);
    res.redirect('/admin/reservations');
});

// ==========================================
// GODZINY OTWARCIA
// ==========================================

router.get('/hours', (req, res) => {
    const openingHours = db.prepare('SELECT * FROM opening_hours ORDER BY sort_order ASC').all();
    res.render('admin/hours', { openingHours, success: req.query.success ? 'Zaktualizowano godziny otwarcia.' : null });
});

router.post('/hours/update', (req, res) => {
    const ids = req.body['id[]'] || [];
    const hours = req.body['hours[]'] || [];

    const idList = Array.isArray(ids) ? ids : [ids];
    const hourList = Array.isArray(hours) ? hours : [hours];

    const updateStmt = db.prepare('UPDATE opening_hours SET hours = ?, is_closed = ? WHERE id = ?');

    for (let i = 0; i < idList.length; i++) {
        const id = idList[i];
        const hVal = hourList[i];
        const isClosed = req.body[`is_closed_${id}`] ? 1 : 0;
        updateStmt.run(hVal, isClosed, id);
    }

    res.redirect('/admin/hours?success=1');
});

// ==========================================
// WIADOMOSCI OD KLIENTOW
// ==========================================

router.get('/messages', (req, res) => {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY is_read ASC, id DESC').all();
    res.render('admin/messages', { messages });
});

router.post('/messages/read/:id', (req, res) => {
    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.redirect('/admin/messages');
});

router.post('/messages/delete/:id', (req, res) => {
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    res.redirect('/admin/messages');
});

// ==========================================
// MODULY TYLKO DLA WLASCICIELA (OWNER)
// ==========================================

// Moderacja opinii
router.get('/reviews', requireOwner, (req, res) => {
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY is_approved ASC, id DESC').all();
    res.render('admin/reviews', { reviews });
});

router.post('/reviews/approve/:id', requireOwner, (req, res) => {
    db.prepare('UPDATE reviews SET is_approved = 1 WHERE id = ?').run(req.params.id);
    res.redirect('/admin/reviews');
});

router.post('/reviews/delete/:id', requireOwner, (req, res) => {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.redirect('/admin/reviews');
});

// Szefowie kuchni
router.get('/chefs', requireOwner, (req, res) => {
    const chefs = db.prepare('SELECT * FROM chefs ORDER BY id ASC').all();
    res.render('admin/chefs', { chefs });
});

router.post('/chefs/new', requireOwner, (req, res) => {
    const { name, role, experience, image, bio } = req.body;
    db.prepare('INSERT INTO chefs (name, role, experience, image, bio) VALUES (?, ?, ?, ?, ?)').run(
        name, role, experience, image || '/img/chefs/1.jpg', bio || ''
    );
    res.redirect('/admin/chefs');
});

router.post('/chefs/delete/:id', requireOwner, (req, res) => {
    db.prepare('DELETE FROM chefs WHERE id = ?').run(req.params.id);
    res.redirect('/admin/chefs');
});

// Dane lokalu
router.get('/settings', requireOwner, (req, res) => {
    const info = getRestaurantInfo();
    res.render('admin/settings', { info, success: req.query.success ? 'Zaktualizowano dane restauracji.' : null });
});

router.post('/settings', requireOwner, (req, res) => {
    const { restaurant_name, phone, email, address, delivery_tag } = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO restaurant_info (key, value) VALUES (?, ?)');
    if (restaurant_name) upsert.run('restaurant_name', restaurant_name);
    if (phone) upsert.run('phone', phone);
    if (email) upsert.run('email', email);
    if (address) upsert.run('address', address);
    if (delivery_tag) upsert.run('delivery_tag', delivery_tag);
    res.redirect('/admin/settings?success=1');
});

// Zarzadzanie uzytkownikami
router.get('/users', requireOwner, (req, res) => {
    const users = db.prepare('SELECT id, username, full_name, role, created_at FROM users ORDER BY id ASC').all();
    res.render('admin/users', { users, error: req.query.error || null });
});

router.post('/users/new', requireOwner, (req, res) => {
    const { username, password, full_name, role } = req.body;
    try {
        db.prepare('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)').run(
            username, password, full_name, role
        );
        res.redirect('/admin/users');
    } catch (e) {
        res.redirect('/admin/users?error=' + encodeURIComponent('Użytkownik o takim loginie już istnieje.'));
    }
});

router.post('/users/delete/:id', requireOwner, (req, res) => {
    if (parseInt(req.params.id) === req.session.user.id) {
        return res.redirect('/admin/users?error=' + encodeURIComponent('Nie możesz usunąć własnego konta.'));
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.redirect('/admin/users');
});

module.exports = router;

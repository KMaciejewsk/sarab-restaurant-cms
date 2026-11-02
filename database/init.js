const db = require('./db');

console.log('Inicjalizacja bazy danych SQLite...');

// 1. Tworzenie tabel
db.exec(`
    -- Tabela uzytkownikow systemu CMS (Role: owner, employee)
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('owner', 'employee')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela kategorii menu
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        item_count_label TEXT DEFAULT '0 items',
        image TEXT
    );

    -- Tabela dan w karcie menu
    CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        short_desc TEXT,
        price REAL NOT NULL,
        old_price REAL,
        image TEXT NOT NULL,
        badge TEXT,
        badge_type TEXT,
        rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 0,
        calories INTEGER,
        prep_time INTEGER,
        tags TEXT,
        is_dish_of_the_day INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- Tabela rezerwacji stolikow
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        guests INTEGER NOT NULL,
        reservation_date TEXT NOT NULL,
        reservation_time TEXT NOT NULL,
        special_requests TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela opinii i ocen klientow
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_name TEXT NOT NULL,
        role_or_city TEXT DEFAULT 'Verified Guest',
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        avatar TEXT DEFAULT '/img/testimonial/1.jpg',
        is_approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela zespolu szefow kuchni
    CREATE TABLE IF NOT EXISTS chefs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        experience TEXT,
        image TEXT NOT NULL,
        bio TEXT,
        facebook_url TEXT DEFAULT '#',
        instagram_url TEXT DEFAULT '#',
        twitter_url TEXT DEFAULT '#'
    );

    -- Tabela godzin otwarcia
    CREATE TABLE IF NOT EXISTS opening_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_range TEXT NOT NULL,
        hours TEXT NOT NULL,
        is_closed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0
    );

    -- Tabela wiadomosci kontaktowych
    CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela danych restauracji (informacje ogolne)
    CREATE TABLE IF NOT EXISTS restaurant_info (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
`);

console.log('Tabele zostaly utworzone pomyslnie.');

// 2. Wypelnianie danymi poczatkowymi (Seed)

// Uzytkownicy
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', 'admin123', 'Właściciel Jan Kowalski', 'owner');
    insertUser.run('pracownik', 'pracownik123', 'Pracownik Anna Nowak', 'employee');
    console.log('-> Dodano domyślnych użytkowników (admin / pracownik)');
}

// Kategorie
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, slug, item_count_label, image) VALUES (?, ?, ?, ?)');
    insertCat.run('Burgers', 'burgers', '24 items', '/img/category/2.jpg');
    insertCat.run('Pizza', 'pizza', '18 items', '/img/category/3.jpg');
    insertCat.run('Fried Chicken', 'chicken', '15 items', '/img/category/4.jpg');
    insertCat.run('Wraps', 'wraps', '12 items', '/img/category/5.jpg');
    insertCat.run('Desserts', 'desserts', '20 items', '/img/category/6.jpg');
    insertCat.run('Pasta', 'pasta', '14 items', '/img/category/1.jpg');
    console.log('-> Dodano kategorie dań');
}

// Dania (Menu Items)
const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get().count;
if (menuCount === 0) {
    const getCatId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug).id;

    const insertDish = db.prepare(`
        INSERT INTO menu_items (
            category_id, name, description, short_desc, price, old_price,
            image, badge, badge_type, rating, reviews_count, calories, prep_time, tags, is_dish_of_the_day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDish.run(
        getCatId('burgers'),
        'Classic Smash Burger',
        'Double smashed patty, cheddar cheese, caramelized onions, house pickles and our legendary special sauce. Made fresh to order on a toasted brioche bun.',
        'Double smashed patty, cheddar, caramelized onions, pickles & special sauce',
        14.99, 18.99,
        '/img/menu/1.jpg', 'Hot', 'hot', 4.9, 128, 620, 12, 'Spicy,Bestseller,Beef', 1
    );

    insertDish.run(
        getCatId('pizza'),
        'Margherita Royale',
        'San Marzano tomatoes, fresh buffalo mozzarella, fragrant basil leaves, drizzled with Italian truffle oil on a hand-stretched sourdough base.',
        'San Marzano tomatoes, buffalo mozzarella, basil & truffle oil on sourdough',
        19.99, 24.99,
        '/img/menu/2.jpg', 'New', 'new', 4.8, 95, 480, 18, 'Vegetarian,New,Italian', 0
    );

    insertDish.run(
        getCatId('chicken'),
        'Nashville Hot Chicken',
        'Extra-crispy fried chicken tossed in our signature fiery Nashville spice blend, served with honey drizzle and house pickles on a toasted brioche bun.',
        'Crispy fried chicken in fiery Nashville spice blend with honey drizzle',
        12.99, 16.99,
        '/img/menu/3.jpg', 'Best Seller', '', 5.0, 210, 710, 15, 'Spicy,Bestseller,Crispy', 0
    );

    insertDish.run(
        getCatId('wraps'),
        'Loaded Fajita Wrap',
        'Grilled chicken strips, sautéed bell peppers and onions, sour cream, fresh guacamole and salsa wrapped in a warm flour tortilla with melted cheddar.',
        'Grilled chicken, peppers, sour cream & guacamole in a warm tortilla',
        10.99, null,
        '/img/menu/4.jpg', null, null, 4.5, 74, 520, 10, 'Grilled,Fresh,Mexican', 0
    );

    insertDish.run(
        getCatId('desserts'),
        'Nutella Lava Cake',
        'Warm molten chocolate cake with a gooey Nutella center, served alongside Madagascar vanilla bean ice cream with salted caramel drizzle and fresh berries.',
        'Molten chocolate cake with Nutella center, vanilla ice cream & caramel',
        8.99, 11.99,
        '/img/menu/5.jpg', 'New', 'new', 4.9, 56, 390, 8, 'Sweet,New,Chocolate', 0
    );

    insertDish.run(
        getCatId('pasta'),
        'Truffle Mushroom Pasta',
        'Al dente tagliatelle tossed with mixed wild mushrooms, freshly shaved black truffle, aged parmesan, fresh thyme and a touch of cream in garlic butter.',
        'Al dente tagliatelle, wild mushrooms, black truffle, parmesan & thyme',
        16.99, null,
        '/img/menu/6.jpg', "Chef's Pick", 'hot', 4.9, 88, 560, 20, "Vegetarian,Chef's Pick,Italian", 0
    );

    console.log('-> Dodano przykładowe dania');
}

// Szefowie kuchni
const chefCount = db.prepare('SELECT COUNT(*) as count FROM chefs').get().count;
if (chefCount === 0) {
    const insertChef = db.prepare('INSERT INTO chefs (name, role, experience, image, bio) VALUES (?, ?, ?, ?, ?)');
    insertChef.run('Marcus Aurelius', 'Executive Chef', '15 years experience', '/img/chefs/1.jpg', 'Specialist in culinary innovation and fast casual dining.');
    insertChef.run('Sofia Loren', 'Pastry Master', '11 years experience', '/img/chefs/2.jpg', 'Award-winning dessert artisan crafted in European patisseries.');
    insertChef.run('Daniel Craig', 'Grill Specialist', '13 years experience', '/img/chefs/3.jpg', 'Master of the flame, flame-broiled burgers and ribs.');
    insertChef.run('William Latnum', 'Pizza Artisan', '9 years experience', '/img/chefs/4.jpg', 'Trained in Naples with passion for slow-fermented dough.');
    console.log('-> Dodano szefów kuchni');
}

// Godziny otwarcia
const hoursCount = db.prepare('SELECT COUNT(*) as count FROM opening_hours').get().count;
if (hoursCount === 0) {
    const insertHours = db.prepare('INSERT INTO opening_hours (day_range, hours, is_closed, sort_order) VALUES (?, ?, ?, ?)');
    insertHours.run('Monday - Tuesday', 'Closed', 1, 1);
    insertHours.run('Wednesday - Thursday', '09:00 AM - 10:00 PM', 0, 2);
    insertHours.run('Friday', '09:00 AM - 11:00 PM', 0, 3);
    insertHours.run('Saturday', '10:00 AM - 11:30 PM', 0, 4);
    insertHours.run('Sunday', '11:00 AM - 09:00 PM', 0, 5);
    console.log('-> Dodano godziny otwarcia');
}

// Opinie klientow
const revCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
if (revCount === 0) {
    const insertRev = db.prepare('INSERT INTO reviews (author_name, role_or_city, rating, comment, avatar, is_approved) VALUES (?, ?, ?, ?, ?, ?)');
    insertRev.run('Sarah Jenkins', 'Food Critic, NYC', 5, 'The smash burgers here redefined fast casual dining for me. The brioche bun is perfection.', '/img/testimonial/1.jpg', 1);
    insertRev.run('Michael Chen', 'Verified Customer', 5, 'Best Nashville hot chicken in the city! Friendly staff and lightning-fast table service.', '/img/testimonial/2.jpg', 1);
    insertRev.run('Emma Watson', 'Local Guide', 5, 'Unbelievable pizza crust. It has that authentic Neapolitan leopard-spotting and aroma.', '/img/testimonial/3.jpg', 1);
    console.log('-> Dodano zatwierdzone opinie');
}

// Informacje o restauracji
const infoCount = db.prepare('SELECT COUNT(*) as count FROM restaurant_info').get().count;
if (infoCount === 0) {
    const insertInfo = db.prepare('INSERT INTO restaurant_info (key, value) VALUES (?, ?)');
    insertInfo.run('restaurant_name', 'Sarab Restaurant');
    insertInfo.run('phone', '+1 (800) 123-4567');
    insertInfo.run('email', 'hello@sarabfood.com');
    insertInfo.run('address', '42 Flavor Street, Manhattan, NY 10001');
    insertInfo.run('delivery_tag', 'Free Delivery Today!');
    console.log('-> Dodano informacje o restauracji');
}

console.log('Inicjalizacja bazy zakonczona pomyslnie!');

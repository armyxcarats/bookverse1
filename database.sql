-- ============================================
-- BOOKVERSE DATABASE
-- ============================================

DROP DATABASE IF EXISTS bookverse1;
CREATE DATABASE bookverse1;
USE bookverse1;

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    token VARCHAR(512),
    deleted_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- CUSTOMER
-- ============================================

CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fname VARCHAR(255),
    lname VARCHAR(255),
    addressline VARCHAR(255),
    zipcode VARCHAR(10),
    phone VARCHAR(20),
    image_path VARCHAR(255),

    CONSTRAINT fk_customer_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================================
-- BOOKS
-- ============================================

CREATE TABLE item (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description_text TEXT,
    author VARCHAR(255),
    publisher VARCHAR(255),
    genre VARCHAR(255),
    cost_price DECIMAL(10,2) NOT NULL,
    sell_price DECIMAL(10,2) NOT NULL,
    on_sale TINYINT(1) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT NULL,
    img_path VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- STOCK
-- ============================================

CREATE TABLE stock (
    item_id INT PRIMARY KEY,
    quantity INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_stock_item
    FOREIGN KEY(item_id)
    REFERENCES item(item_id)
    ON DELETE CASCADE
);

-- ============================================
-- ITEM IMAGES
-- ============================================

CREATE TABLE item_image (
    item_image_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,

    CONSTRAINT fk_item_image
    FOREIGN KEY(item_id)
    REFERENCES item(item_id)
    ON DELETE CASCADE
);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating TINYINT NOT NULL,
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_review_item
        FOREIGN KEY(item_id)
        REFERENCES item(item_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_customer
        FOREIGN KEY(customer_id)
        REFERENCES customer(customer_id)
        ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_item_title ON item(title);
CREATE INDEX idx_item_genre ON item(genre);

-- ============================================
-- USERS
-- ============================================

INSERT INTO users(name,email,password,role)
VALUES
('Administrator','admin@bookverse.com','admin123','admin'),
('Juan Dela Cruz','juan@gmail.com','juan123','user'),
('Maria Santos','maria@gmail.com','maria123','user');

-- ============================================
-- CUSTOMERS
-- ============================================

INSERT INTO customer
(user_id,fname,lname,addressline,zipcode,phone)
VALUES
(2,'Juan','Dela Cruz','Manila City','1000','09171234567'),
(3,'Maria','Santos','Quezon City','1100','09991234567');

-- ============================================
-- BOOKS
-- ============================================

INSERT INTO item
(title,description_text,author,publisher,genre,cost_price,sell_price,img_path)
VALUES
(
'Atomic Habits',
'An easy and proven way to build good habits and break bad ones through small daily improvements.',
'James Clear',
'Penguin Random House',
'Self-Help',
280,
349,
'https://images.unsplash.com/photo-1512820790803-83ca734da794'
),
(
'The Midnight Library',
'Between life and death Nora Seed discovers a magical library where every book gives her another chance to live a different life.',
'Matt Haig',
'Canongate',
'Fiction',
300,
399,
'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f'
),
(
'Dune',
'Paul Atreides must survive on Arrakis while fighting for his family and destiny.',
'Frank Herbert',
'Ace Books',
'Science Fiction',
340,
419,
'https://images.unsplash.com/photo-1516979187457-637abb4f9353'
),
(
'The Alchemist',
'The inspiring journey of Santiago as he follows his dreams and discovers his personal legend.',
'Paulo Coelho',
'HarperOne',
'Adventure',
220,
299,
'https://images.unsplash.com/photo-1529156069898-49953e39b3ac'
);

-- ============================================
-- STOCK
-- ============================================

INSERT INTO stock(item_id,quantity)
VALUES
(1,25),
(2,18),
(3,12),
(4,30);

-- ============================================
-- BOOK IMAGES
-- ============================================

INSERT INTO item_image(item_id,file_path)
SELECT item_id,img_path
FROM item;

-- ============================================
-- REVIEWS
-- ============================================

INSERT INTO review(item_id,customer_id,rating,review_text)
VALUES
(1,1,5,'Excellent self-help book.'),
(1,2,4,'Very practical and easy to understand.'),
(2,1,5,'A touching and emotional novel.'),
(3,2,5,'Amazing science fiction masterpiece.'),
(4,1,4,'Inspiring and enjoyable to read.');

-- ============================================
-- CHECK DATA
-- ============================================

SELECT * FROM users;
SELECT * FROM customer;
SELECT * FROM item;
SELECT * FROM stock;
SELECT * FROM item_image;
SELECT * FROM review;

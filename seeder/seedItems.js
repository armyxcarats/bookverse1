require('dotenv').config();
const db = require('../models');

const products = [
  {
    title: 'The Midnight Library',
    description_text: 'Between life and death Nora Seed discovers a magical library where every book gives her another chance to live a different life.',
    author: 'Matt Haig',
    publisher: 'Canongate',
    genre: 'Fiction',
    cost_price: 300.00,
    sell_price: 399.00,
    img_path: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    quantity: 18
  },
  {
    title: 'Atomic Habits',
    description_text: 'An easy and proven way to build good habits and break bad ones through small daily improvements.',
    author: 'James Clear',
    publisher: 'Penguin Random House',
    genre: 'Self-Help',
    cost_price: 280.00,
    sell_price: 349.00,
    img_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    quantity: 24
  },
  {
    title: 'The Alchemist',
    description_text: 'The inspiring journey of Santiago as he follows his dreams and discovers his personal legend.',
    author: 'Paulo Coelho',
    publisher: 'HarperOne',
    genre: 'Adventure',
    cost_price: 220.00,
    sell_price: 299.00,
    img_path: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    quantity: 32
  },
  {
    title: 'Dune',
    description_text: 'Paul Atreides must survive on Arrakis while fighting for his family and destiny.',
    author: 'Frank Herbert',
    publisher: 'Ace Books',
    genre: 'Science Fiction',
    cost_price: 340.00,
    sell_price: 419.00,
    img_path: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    quantity: 10
  },
  {
    title: 'Pride and Prejudice',
    description_text: 'A witty romance that explores manners, marriage, and the power of first impressions.',
    author: 'Jane Austen',
    publisher: 'Penguin Classics',
    genre: 'Classic',
    cost_price: 180.00,
    sell_price: 249.00,
    img_path: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    quantity: 15
  },
  {
    title: '1984',
    description_text: 'A chilling dystopian novel about surveillance, truth, and the loss of freedom.',
    author: 'George Orwell',
    publisher: 'Secker & Warburg',
    genre: 'Dystopian',
    cost_price: 220.00,
    sell_price: 289.00,
    img_path: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    quantity: 20
  },
  {
    title: 'Sapiens',
    description_text: 'A sweeping account of human history from the Stone Age to the modern age.',
    author: 'Yuval Noah Harari',
    publisher: 'Harper',
    genre: 'History',
    cost_price: 260.00,
    sell_price: 329.00,
    img_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    quantity: 14
  },
  {
    title: 'Educated',
    description_text: 'A memoir about resilience, education, and the struggle to define one’s own identity.',
    author: 'Tara Westover',
    publisher: 'Random House',
    genre: 'Memoir',
    cost_price: 240.00,
    sell_price: 319.00,
    img_path: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80',
    quantity: 17
  },
  {
    title: 'The Hobbit',
    description_text: 'A legendary adventure of dwarves, dragons, and a reluctant hero on a grand quest.',
    author: 'J.R.R. Tolkien',
    publisher: 'Houghton Mifflin',
    genre: 'Fantasy',
    cost_price: 200.00,
    sell_price: 279.00,
    img_path: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    quantity: 21
  },
  {
    title: 'The Lean Startup',
    description_text: 'A practical guide for building products through validated learning and fast iteration.',
    author: 'Eric Ries',
    publisher: 'Crown Business',
    genre: 'Business',
    cost_price: 230.00,
    sell_price: 309.00,
    img_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    quantity: 13
  },
  {
    title: 'Clean Code',
    description_text: 'A handbook for writing readable, maintainable, and efficient software.',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    genre: 'Programming',
    cost_price: 250.00,
    sell_price: 329.00,
    img_path: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
    quantity: 16
  },
  {
    title: 'The Psychology of Money',
    description_text: 'Timeless lessons on how behavior and emotions shape financial decisions.',
    author: 'Morgan Housel',
    publisher: 'Harriman House',
    genre: 'Finance',
    cost_price: 210.00,
    sell_price: 289.00,
    img_path: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80',
    quantity: 19
  },
  {
    title: 'Becoming',
    description_text: 'A deeply personal memoir of Michelle Obama’s journey from childhood to the White House.',
    author: 'Michelle Obama',
    publisher: 'Crown',
    genre: 'Biography',
    cost_price: 260.00,
    sell_price: 349.00,
    img_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    quantity: 12
  },
  {
    title: 'The Silent Patient',
    description_text: 'A psychological thriller about a woman who stops speaking after a shocking crime.',
    author: 'Alex Michaelides',
    publisher: 'Celadon Books',
    genre: 'Thriller',
    cost_price: 240.00,
    sell_price: 319.00,
    img_path: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    quantity: 11
  },
  {
    title: 'The Power of Habit',
    description_text: 'A practical look at how habits shape our lives and how to change them effectively.',
    author: 'Charles Duhigg',
    publisher: 'Random House',
    genre: 'Self-Help',
    cost_price: 190.00,
    sell_price: 269.00,
    img_path: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    quantity: 18
  },
  {
    title: 'The Martian',
    description_text: 'An astronaut stranded on Mars must use ingenuity and humor to survive.',
    author: 'Andy Weir',
    publisher: 'Crown',
    genre: 'Science Fiction',
    cost_price: 270.00,
    sell_price: 359.00,
    img_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    quantity: 22
  },
  {
    title: 'Thinking, Fast and Slow',
    description_text: 'A fascinating exploration of how the mind makes decisions and handles uncertainty.',
    author: 'Daniel Kahneman',
    publisher: 'Farrar, Straus and Giroux',
    genre: 'Psychology',
    cost_price: 250.00,
    sell_price: 339.00,
    img_path: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80',
    quantity: 15
  },
  {
    title: 'The Great Gatsby',
    description_text: 'A dazzling portrait of the Jazz Age and the illusions of wealth and romance.',
    author: 'F. Scott Fitzgerald',
    publisher: 'Scribner',
    genre: 'Classic',
    cost_price: 180.00,
    sell_price: 259.00,
    img_path: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    quantity: 23
  },
  {
    title: 'The Subtle Art of Not Giving a F*ck',
    description_text: 'A bold and counterintuitive guide to living a better life by focusing on what matters.',
    author: 'Mark Manson',
    publisher: 'HarperOne',
    genre: 'Self-Help',
    cost_price: 220.00,
    sell_price: 299.00,
    img_path: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    quantity: 14
  },
  {
    title: 'Project Hail Mary',
    description_text: 'A brilliant scientist must save humanity with a daring space mission.',
    author: 'Andy Weir',
    publisher: 'Ballantine Books',
    genre: 'Science Fiction',
    cost_price: 300.00,
    sell_price: 389.00,
    img_path: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    quantity: 16
  },
  {
    title: 'The Kite Runner',
    description_text: 'A moving story of friendship, betrayal, and redemption in Afghanistan.',
    author: 'Khaled Hosseini',
    publisher: 'Riverhead Books',
    genre: 'Fiction',
    cost_price: 210.00,
    sell_price: 289.00,
    img_path: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80',
    quantity: 20
  },
  {
    title: 'Deep Work',
    description_text: 'A guide to cultivating focus and producing meaningful work in a distracted world.',
    author: 'Cal Newport',
    publisher: 'Grand Central Publishing',
    genre: 'Productivity',
    cost_price: 230.00,
    sell_price: 309.00,
    img_path: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
    quantity: 17
  }
];

async function seedItems() {
  try {
    await db.sequelize.authenticate();
    console.log('DB connection OK');

    for (const product of products) {
      const existingItem = await db.Item.findOne({ where: { description: product.title } });
      if (!existingItem) {
        const item = await db.Item.create({
          description: product.title,
          description_text: product.description_text,
          genre: product.genre,
          cost_price: product.cost_price,
          sell_price: product.sell_price,
          img_path: product.img_path
        });
        await db.Stock.create({ item_id: item.item_id, quantity: product.quantity });
        console.log(`Created item: ${product.title}`);
      } else {
        console.log(`Item already exists: ${product.title}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed items:', error);
    process.exit(1);
  }
}

seedItems();

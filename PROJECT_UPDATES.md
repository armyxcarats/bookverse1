*** Update June 23 2026 7.00pm
No more quiz 3. I'll check your project's progress.

*** Update June 23 2026
quiz 3 June 24 wednesday express nodejs jquery

*** Update June 8 2026
Advance Web Application Project Requirements
machine problems 20pts
mp1 Laravel CRUD api 12pts
    NodeJS CRUD api 20pts
mp2 Laravel CRUD api 12pts
    NodeJS CRUD api 20pts

mp3 CRUD Jquery/datatables multiple file uploads for mp1 20pts
mp4 CRUD Jquery/datatables frontend for mp2
mp5 generate and send tokens for authentication. 15pts
    save token on users table. 5pts
mp6 User registration, Login API via Jquery AJAX. admin can update role of user. admin can deactivate users. List users on datatable. Laravel 15pts. NodeJS 20pts
mp7  use Sequelize ORM on CRUD functions 20pts

term test Lab 40pts
transactions CRUD api and jquery front end. the sample UI implementation will have lower points. laravel 20pts NodeJS 25pts
send an email when updating the transaction 5pts
send an email when updating the transaction. attach the receipt with order details in pdf 10pts

quiz 4 15pts
Jquery validation for mp3 and mp4

quiz 5 15pts
jquery/api search/autocomplete on homepage.

quiz 6 15pts
route protection. add a middleware to check a user's role. only admin roles can access crud api.

quiz 7 15pts
three(3) js charts. bar line and pie charts

unit test 1 20pts
UI/UX Design

unit test 2 20pts
jquery pagination (datatable pagination is not applicable) 15pts
jquery infinite scroll (datatable pagination is not applicable) 20pts

unit 3 40
functional requirements completeness 10
app complexity. added features 10
program execution 10
project contribution 10

Term test Lecture multiple choice pen and paper

always check for updates

June 2 submission of project proposal
june 2 quiz 1 javascript
june 10 quiz 2 jquery nodejs
june 16 quiz 3 nodejs comment kung saan to nakalgay sa codes namin pero naka separate file like txt

---

## Feature implementation locations

- Multiple file upload for items: `routes/item.js` uses `upload.array('images', 5)` and `controllers/item.js` handles `req.files` in `createItem` / `updateItem`; upload storage config in `utils/multer.js`.
- Profile image upload: `routes/user.js` uses `upload.single('image')` and `controllers/user.js` handles profile updates with multipart form data.
- JWT auth and token storage: `controllers/user.js` in `loginUser()` generates JWT with `jsonwebtoken`, saves token to `users` table, and returns `token` + `user` object.
- Auth middleware and role protection: `middlewares/auth.js` exports `isAuthenticatedUser` and `isAdminUser`; used in `routes/item.js`, `routes/user.js`, `routes/order.js`, `routes/dashboard.js`, `routes/review.js`.
- Deactivated account handling:
  - backend login check in `controllers/user.js` at `loginUser()` rejects `user.deleted_at` deactivated accounts;
  - middleware `isAuthenticatedUser` in `middlewares/auth.js` also rejects requests when `user.deleted_at` is set;
  - frontend session guards in `public/index.html`, `public/cart.html`, `public/profile.html`, `public/my-orders.html`, `public/admin.html`, and `public/orders.html` clear localStorage and redirect when deactivated.
- Charts and admin dashboard: chart endpoints in `controllers/dashboard.js` (`addressChart`, `salesChart`, `itemsChart`) and `routes/dashboard.js`; front-end chart rendering in `public/admin.html` and `public/dashboard.html` using Chart.js.
- Sequelize ORM usage: `controllers/item.js`, `controllers/user.js`, and `middlewares/auth.js` use Sequelize models such as `Item`, `ItemImage`, `Stock`, `User`, `Customer`; models defined under `models/`.
- Static file serving and API mounting: `app.js` serves `public` static pages and mounts API routers under `/api/v1`.

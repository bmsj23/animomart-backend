# 🛒 AnimoMart Backend - Complete Implementation Guide

## 📖 Table of Contents
1. [Project Setup](#project-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Models](#database-models)
4. [Controllers & Services](#controllers--services)
5. [Routes & Validators](#routes--validators)
6. [Testing with Postman](#testing-with-postman)
7. [Deployment](#deployment)

---

## 🚀 Project Setup

### Prerequisites Installed ✅
- Node.js v22.18.0
- MongoDB Compass/Atlas
- Git

### Step 1: Install Dependencies

```powershell
npm install
```

All dependencies are already configured in `package.json`.

### Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

2. Edit `.env` and fill in your credentials:

```env
# Get from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id

# Get from Cloudinary Dashboard
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Your Gmail and App Password
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# MongoDB (use local or Atlas)
MONGODB_URI=mongodb://localhost:27017/animomart
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/animomart

# Generate strong secrets (use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET=your-generated-access-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
```

### Step 3: Generate Strong JWT Secrets

Run this in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and use it for `JWT_ACCESS_SECRET`. Run again for `JWT_REFRESH_SECRET`.

---

## 🗄️ Database Models

The models define your MongoDB schema. Each model has:
- Schema definition with validation
- Middleware (pre/post hooks)
- Instance methods
- Static methods

### Implementation Order:
1. **User Model** - Foundation for authentication
2. **Product Model** - Core marketplace feature
3. **Cart Model** - Shopping cart functionality
4. **Order Model** - Order management
5. **Favorite Model** - Wishlist feature
6. **Message Model** - Messaging system
7. **Review Model** - Rating system
8. **Report Model** - Admin moderation

### Next Steps:
After the project structure is set up, you'll create each model in `src/models/` directory.

**Files to create:**
- `User.js`
- `Product.js`
- `Cart.js`
- `Order.js`
- `Favorite.js`
- `Message.js`
- `Review.js`
- `Report.js`

---

## 🎮 Controllers & Services

### Architecture Pattern:
```
Route → Validator → Controller → Service → Model → Database
```

**Controllers** (`src/controllers/`):
- Handle HTTP requests/responses
- Input validation
- Call service layer
- Return standardized responses

**Services** (`src/services/`):
- Business logic
- Database operations
- External API calls (Google, Cloudinary)
- Reusable functions

### Files to Create:

**Controllers:**
- `auth.controller.js` - Login, register, token refresh
- `user.controller.js` - Profile management
- `product.controller.js` - CRUD operations
- `cart.controller.js` - Cart management
- `order.controller.js` - Order processing
- `favorite.controller.js` - Wishlist
- `message.controller.js` - Messaging
- `review.controller.js` - Reviews & ratings
- `report.controller.js` - Reporting system
- `upload.controller.js` - File uploads
- `admin.controller.js` - Admin operations

**Services:**
- `auth.service.js` - Authentication logic
- `user.service.js` - User operations
- `product.service.js` - Product logic
- `cart.service.js` - Cart logic
- `order.service.js` - Order processing
- `cloudinary.service.js` - Image upload/delete

---

## 🛣️ Routes & Validators

### Routes (`src/routes/`):
Define API endpoints and connect to controllers.

**Files to create:**
- `auth.routes.js`
- `user.routes.js`
- `product.routes.js`
- `cart.routes.js`
- `order.routes.js`
- `favorite.routes.js`
- `message.routes.js`
- `review.routes.js`
- `report.routes.js`
- `upload.routes.js`
- `admin.routes.js`

### Validators (`src/validators/`):
Input validation using express-validator.

**Files to create:**
- `auth.validator.js`
- `user.validator.js`
- `product.validator.js`
- `cart.validator.js`
- `order.validator.js`
- `review.validator.js`
- `report.validator.js`

---

## 🧪 Testing with Postman

### Postman Collection Structure:

```
AnimoMart API
├── Health Check
├── Auth
│   ├── POST /api/auth/google (Google Login)
│   ├── POST /api/auth/refresh (Refresh Token)
│   ├── GET /api/auth/profile (Get Profile)
│   └── POST /api/auth/logout (Logout)
├── Products
│   ├── GET /api/products (Get All)
│   ├── GET /api/products/:id (Get One)
│   ├── POST /api/products (Create - Auth)
│   ├── PUT /api/products/:id (Update - Auth)
│   ├── DELETE /api/products/:id (Delete - Auth)
│   └── GET /api/products/search (Search)
├── Cart
│   ├── GET /api/cart (Get Cart - Auth)
│   ├── POST /api/cart/items (Add Item - Auth)
│   ├── PUT /api/cart/items/:productId (Update - Auth)
│   └── DELETE /api/cart/items/:productId (Remove - Auth)
├── Orders
│   ├── POST /api/orders (Create - Auth)
│   ├── GET /api/orders (Get All - Auth)
│   ├── GET /api/orders/:id (Get One - Auth)
│   ├── PUT /api/orders/:id/status (Update Status - Auth)
│   └── PUT /api/orders/:id/cancel (Cancel - Auth)
└── ... (more endpoints)
```

### Testing Flow:
1. **Health Check** - Verify server is running
2. **Auth** - Login with Google (you'll need to get token from frontend first)
3. **Create Products** - Test product creation
4. **Cart Operations** - Add items to cart
5. **Create Orders** - Checkout flow
6. **Test all other features**

---

## 📝 Implementation Phases

### Phase 1: Core Setup ✅ (COMPLETED)
- [x] Project structure
- [x] Configuration files
- [x] Middleware
- [x] Utilities
- [x] Server setup

### Phase 2: Database Models (NEXT)
Create all Mongoose models with:
- Schema definitions
- Validation rules
- Indexes
- Methods

### Phase 3: Authentication System
- Google OAuth integration
- JWT token generation
- Refresh token flow
- Email domain validation (@dlsl.edu.ph)
- First user = admin logic

### Phase 4: Product Management
- CRUD operations
- Image upload to Cloudinary
- Search & filtering
- Pagination
- Category management
- Stock management

### Phase 5: Shopping & Orders
- Cart management
- Multi-seller checkout logic
- Order creation (split by seller)
- Order status updates
- Email notifications

### Phase 6: User Features
- Profile management
- Favorites/wishlist
- Purchase history
- Sales history
- Seller ratings

### Phase 7: Messaging System
- Conversation management
- Send/receive messages
- Mark as read
- Polling support

### Phase 8: Reviews & Ratings
- Product reviews
- Rating system
- Review restrictions (purchase required)
- Display on product pages

### Phase 9: Admin Features
- User management (suspend/activate/delete)
- Product moderation
- Order oversight
- Report system
- Statistics dashboard

### Phase 10: Testing & Polish
- Test all endpoints
- Error handling
- Edge cases
- Performance optimization

---

## 🔑 Key Implementation Notes

### Authentication Flow:
1. Frontend gets Google token
2. Send to `POST /api/auth/google`
3. Backend verifies with Google
4. Check @dlsl.edu.ph domain
5. Create/find user in DB
6. Generate access + refresh tokens
7. Return tokens + user data

### Stock Management:
- Decrease stock when order status = "pending"
- Auto-cancel pending orders after 48 hours
- Auto-mark as "sold" when stock = 0

### Multi-Seller Orders:
```javascript
// Cart has items from 3 sellers
Cart: [
  { product: P1, seller: S1 },
  { product: P2, seller: S1 },
  { product: P3, seller: S2 },
  { product: P4, seller: S3 }
]

// Creates 3 separate orders
Order1: { seller: S1, items: [P1, P2] }
Order2: { seller: S2, items: [P3] }
Order3: { seller: S3, items: [P4] }
```

### Image Upload Flow:
1. Frontend selects images
2. Upload to `POST /api/upload/images`
3. Backend uploads to Cloudinary
4. Returns array of URLs
5. Frontend includes URLs in product creation

---

## 🚦 Running the Server

### Development Mode:
```powershell
npm run dev
```

### Production Mode:
```powershell
npm start
```

### Expected Console Output:
```
✅ MongoDB Connected: localhost
📊 Database: animomart
✅ Cloudinary connected successfully
✅ Email service is ready

🚀 Server running on port 5000
🌍 Environment: development
📍 URL: http://localhost:5000
💚 AnimoMart Backend is ready!
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues:
```powershell
# Check if MongoDB is running
mongod --version

# Start MongoDB service (Windows)
net start MongoDB
```

### Port Already in Use:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Module Not Found Errors:
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📚 Next Steps

You're now ready to implement the models! I'll guide you through creating each file step by step.

**Ready to start? Let me know and I'll help you create:**
1. All database models
2. All controllers and services
3. All routes and validators
4. Testing strategies

Let's build AnimoMart! 🚀
#   a n i m o m a r t - b a c k e n d  
 
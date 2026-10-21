const User = require('../models/User');
const Store = require('../models/Store');
const { regenerateSession } = require('../middlewares/auth');

class AuthService {
  /**
   * Register a new seller and auto-create an initial boutique store
   */
  async register({ name, email, password, storeName, phone }) {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      err.code = 'USER_EXISTS';
      throw err;
    }

    // 2. Create the user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'owner',
    });
    await user.save();

    // 3. Create initial store with a unique slug
    let baseSlug = (storeName || `${name} Boutique`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!baseSlug) baseSlug = 'boutique';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Store.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const store = new Store({
      name: storeName || `${name}'s Boutique`,
      slug: uniqueSlug,
      ownerId: user._id,
      whatsappNumber: phone || '',
      tagline: 'Handcrafted & Curated Fashion',
    });
    await store.save();

    // 4. Associate store with user
    user.stores.push(store._id);
    user.activeStore = store._id;
    await user.save();

    return {
      user: user.toSafeObject(),
      store,
    };
  }

  /**
   * Login seller and attach session
   */
  async login(req, { email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('stores');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Session rotation to prevent session fixation attacks
    await regenerateSession(req);

    // Save user ID to server-side session
    req.session.userId = user._id;

    // Fetch active store
    let activeStore = null;
    if (user.activeStore) {
      activeStore = await Store.findById(user.activeStore);
    } else if (user.stores.length > 0) {
      activeStore = user.stores[0];
      user.activeStore = activeStore._id;
      await user.save();
    }

    return {
      user: user.toSafeObject(),
      store: activeStore,
    };
  }

  /**
   * Logout seller and invalidate server-side session
   */
  async logout(req) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Get current authenticated user profile and active store
   */
  async getProfile(userId) {
    const user = await User.findById(userId).populate('stores');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const activeStore = user.activeStore ? await Store.findById(user.activeStore) : null;
    return {
      user: user.toSafeObject(),
      store: activeStore,
      stores: user.stores,
    };
  }
}

module.exports = new AuthService();

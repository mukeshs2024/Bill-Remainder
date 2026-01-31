// Mongoose models are exported directly
const User = require('./User');
const Subscription = require('./Subscription');

const initializeModels = () => {
  // Models are already initialized by Mongoose
  // Just return them for consistency
  return {
    User,
    Subscription,
  };
};

module.exports = {
  initializeModels,
  User,
  Subscription
};

// Export User and Subscription as lazy getters for backward compatibility
Object.defineProperty(module.exports, 'User', {
  get() {
    return global.User || require('./User');
  },
});

Object.defineProperty(module.exports, 'Subscription', {
  get() {
    return global.Subscription || require('./Subscription');
  },
});

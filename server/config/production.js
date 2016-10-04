module.exports = {
  APP_PORT: process.env.APP_PORT || 3333,
  DB_HOST: process.env.DB_HOST || 'mongodb',
  DB_PORT: process.env.DB_PORT || 27017,
  DB_NAME: process.env.DB_NAME || 'duchenne-trials-dev'
};

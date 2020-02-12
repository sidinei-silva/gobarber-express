module.exports = {
  dialect: 'postgres',
  host: 'db',
  username: 'postgres',
  password: 'root',
  database: 'gobarber',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};

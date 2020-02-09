module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'potgres',
  password: 'root',
  database: 'gobarber',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};

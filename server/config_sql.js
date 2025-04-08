const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "samia",
  database: process.env.DB_DATABASE || "app",
  insecureAuth: true,
  protocol: "mysql",
};

function query(sql, params, callback) {
  connection.query(sql, params, (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results);
  });
}

module.exports = config;


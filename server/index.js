require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const db = require("./mysql_connect");
const dashB = require("./routes/dashb");

const axios = require("axios");
const port = 5000;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
console.log("WEATHER_API_KEY:", process.env.WEATHER_API_KEY);

app.use((req, res, next) => {
  console.log("Handling request:", req.method, req.url);
  res.header("Access-Control-Allow-Origin", "*"); // Changed to "*" for testing (revert to "http://localhost:3000" in production)
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight for:", req.url);
    return res.status(200).end();
  }
  next();
});

app.use("/dashboard", dashB);

app.get("/", function (req, res) {
  res.send("Only accepting GET and POST requests!");
});

app.post("/auth", async (req, res) => {
  console.log("Received /auth request:", req.body);
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
  }

  let rep = "unknown";
  if (username.toUpperCase().charAt(0) === "E" && password.length >= 6) rep = "employee";
  else if (username.toUpperCase().charAt(0) === "A" && password.length >= 6) rep = "admin";
  else if (username.toUpperCase().charAt(0) === "T" && password.length >= 6) rep = "tenant";
  else if (username.toUpperCase().charAt(0) === "O" && password.length >= 6) rep = "owner";

  try {
    await db.authoriseuser(username, password, (err, result) => {
      if (err) {
        console.error("DB error in /auth:", err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      console.log("Auth result:", result);
      if (result === "granted") {
        const sql = "SELECT id FROM auth WHERE user_id = ?";
        db.query(sql, [username], (err, authResult) => {
          if (err) {
            console.error("Error fetching auth id:", err);
            return res.status(500).json({ error: "Erreur de base de données lors de la récupération de l'ID utilisateur" });
          }
          if (!authResult || authResult.length === 0) {
            console.error("No auth record found for user_id:", username);
            return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
          }

          const authId = authResult[0].id;
          console.log("Auth ID for user_id", username, ":", authId);

          const activitySql = "INSERT INTO activities (user_id, action, date) VALUES (?, ?, NOW())";
          db.query(activitySql, [authId, "Logged in"], (err, activityResult) => {
            if (err) {
              console.error("Error inserting activity:", err);
            }
            console.log("Activity inserted:", activityResult);
          });

          if (rep === "admin") {
            const adminId = username.split("-")[1];
            if (!adminId) {
              console.error("Invalid admin username format:", username);
              return res.status(400).json({ error: "Format de nom d'utilisateur admin invalide. Attendu : a-<admin_id>" });
            }

            const adminSql = "SELECT admin_id FROM block_admin WHERE admin_id = ?";
            db.query(adminSql, [adminId], (err, adminResult) => {
              if (err) {
                console.error("Error fetching admin_id:", err);
                return res.status(500).json({ error: "Erreur de base de données lors de la récupération de l'ID admin" });
              }
              if (!adminResult || adminResult.length === 0) {
                console.error("No admin record found for admin_id:", adminId);
                return res.status(404).json({ error: "Admin non trouvé dans la table block_admin" });
              }

              const adminIdFromDb = adminResult[0].admin_id;
              console.log("Admin ID for admin_id", adminId, ":", adminIdFromDb);
              res.json({ access: "granted", user: rep, userType: rep, username, adminId: adminIdFromDb });
            });
          } else {
            res.json({ access: "granted", user: rep, userType: rep, username });
          }
        });
      } else {
        res.json({ access: "denied", user: rep });
      }
    });
  } catch (err) {
    console.error("Erreur lors de l'authentification:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'authentification" });
  }
});

app.post("/raisingcomplaint", async (req, res) => {
  const desc = req.body.desc;
  const blockno = req.body.blockno;
  const roomno = req.body.roomno;
  const values = [desc, blockno, roomno];
  try {
    await db.registercomplaint(values, (err, result) => {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      if (result.affectedRows === 0) {
        return res.status(404).send("No matching block and room found");
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de la plainte:", err);
    res.sendStatus(500);
  }
});

app.post("/createtenant", async (req, res) => {
  console.log("Request body:", req.body);
  const { name, age, roomno, password, dob, ID, stat, leaveDate } = req.body;

  if (!name || !roomno || !password || !dob || !ID || !stat || !age) {
    return res.status(400).send("Missing required fields");
  }

  try {
    await db.getdata("owner", (err, owners) => {
      if (err) {
        console.error("Error fetching owners:", err);
        return res.status(500).send("Database error fetching owners");
      }
      const owner = owners.find((o) => String(o.room_no) === String(roomno));
      console.log("Found owner for roomno", roomno, ":", owner);
      if (!owner) {
        console.log(`No owner found for roomno: ${roomno}`);
        return res.status(400).send(`No owner found for room number ${roomno}`);
      }
      const ownerno = owner.owner_id;

      const tenantValues = [name, dob, stat, leaveDate, roomno, age, ownerno, password];
      console.log("Tenant values to insert:", tenantValues);
      db.createtenant(tenantValues, (err, result) => {
        if (err) {
          console.error("Error creating tenant:", err);
          return res.status(500).send("Error creating tenant");
        }
        console.log("Tenant created:", result);
        const insertedTenantId = result.insertedId;

        const proofValues = [ID, insertedTenantId];
        db.createtenantproof(proofValues, (err, proofResult) => {
          if (err) {
            console.error("Error saving tenant proof:", err);
            const deleteSql = "DELETE FROM tenant WHERE tenant_id = ?";
            db.query(deleteSql, [insertedTenantId], () => {
              return res.status(500).send("Error saving tenant proof");
            });
            return;
          }
          console.log("Proof saved:", proofResult);
          res.status(200).json({ message: "Tenant created successfully", tenant_id: insertedTenantId });
        });
      });
    });
  } catch (err) {
    console.error("Erreur lors de la création du locataire:", err);
    res.status(500).send("Erreur serveur lors de la création du locataire");
  }
});

app.post('/createowner', async (req, res) => {
  const { name, age, roomno, password, aggrementStatus, dob } = req.body;

  if (!name || !age || !roomno || !password || !aggrementStatus || !dob) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const ownerValues = [name, age, aggrementStatus, roomno, dob, password];
  try {
    await db.createowner(ownerValues, (err, result) => {
      if (err) {
        console.error("Error creating owner:", err);
        return res.status(500).json({ message: "Error creating owner", error: err.sqlMessage });
      }

      const proofValues = [null, result.insertId];
      db.createownerproof(proofValues, (err, proofResult) => {
        if (err) {
          console.error("Error saving owner proof:", err);
          return res.status(500).json({ message: "Error saving owner proof", error: err.sqlMessage });
        }

        res.status(200).json({ message: "Owner created successfully", owner_id: result.insertId });
      });
    });
  } catch (err) {
    console.error("Erreur lors de la création du propriétaire:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création du propriétaire", error: err.message });
  }
});

app.get("/available-rooms", async (req, res) => {
  console.log("Handling request: GET /available-rooms");
  try {
    await db.getAvailableRooms((err, availableRooms) => {
      if (err) {
        console.error("Error fetching available rooms:", err);
        return res.status(500).json({ message: "Error fetching available rooms", error: err.sqlMessage });
      }
      res.status(200).json(availableRooms);
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des chambres disponibles:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des chambres disponibles" });
  }
});

app.get("/tenantdetails", async (req, res) => {
  try {
    await db.getdata("tenant", (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération des locataires:", err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/ownerdetails", async (req, res) => {
  try {
    await db.getdata("owner", (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération des propriétaires:", err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/viewparking", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.viewparking(id, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/ownercomplaints", async (req, res) => {
  const ownerid = req.body.userId;
  try {
    await db.ownercomplaints(ownerid, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/viewcomplaints", async (req, res) => {
  try {
    await db.viewcomplaints((err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/ownerroomdetails", async (req, res) => {
  const ownerId = req.body.userId;
  try {
    await db.ownerroomdetails(ownerId, (err, result) => {
      if (err) {
        console.log(err);
        return res.sendStatus(405);
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/bookslot", async (req, res) => {
  const { roomNo, slotNo } = req.body;
  try {
    const checkSql = "SELECT parking_slot FROM room WHERE room_no = ?";
    db.query(checkSql, [roomNo], (err, results) => {
      if (err) {
        console.error("Error checking room:", err);
        return res.status(500).json({ error: "Erreur lors de la vérification de la chambre" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Chambre non trouvée" });
      }

      const sql = "UPDATE room SET parking_slot = ? WHERE room_no = ?";
      db.query(sql, [slotNo, roomNo], (err, result) => {
        if (err) {
          console.error("Error booking slot:", err);
          return res.status(500).json({ error: "Erreur lors de la réservation de la place de parking" });
        }
        res.json({ message: "Place de parking réservée avec succès" });
      });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/ownertenantdetails", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.ownertenantdetails(id, (err, result) => {
      if (err) {
        console.log(err);
        return res.sendStatus(405);
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/paymaintanance", async (req, res) => {
  const userId = req.body.id;
  const sql = "SELECT id FROM auth WHERE user_id = ?";
  try {
    await db.query(sql, [userId], (err, authResult) => {
      if (err) {
        console.error("Error fetching auth id:", err);
        return res.status(500).json({ error: "Erreur de base de données lors de la récupération de l'ID utilisateur" });
      }
      if (!authResult || authResult.length === 0) {
        console.error("No auth record found for user_id:", userId);
        return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
      }

      const authId = authResult[0].id;
      console.log("Auth ID for user_id", userId, ":", authId);

      db.paymaintanence(userId, (err, result) => {
        if (err) {
          console.log(err);
          return res.sendStatus(405);
        }

        const activitySql = "INSERT INTO activities (user_id, action, date) VALUES (?, ?, NOW())";
        db.query(activitySql, [authId, "Paid maintenance"], (err, activityResult) => {
          if (err) {
            console.error("Error inserting activity:", err);
          }
          console.log("Activity inserted:", activityResult);
        });

        res.sendStatus(200);
      });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/deletetenant", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.deletetenant(id, (err, result) => {
      if (err) {
        console.log(err);
        return res.sendStatus(405);
      }
      res.sendStatus(200);
      console.log({ result });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/deleteowner", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.deleteowner(id, (err, result) => {
      if (err) {
        console.log(err);
        return res.sendStatus(405);
      }
      res.sendStatus(200);
      console.log({ result });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/deletemployee", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.deleteemployee(id, (err, result) => {
      if (err) {
        console.log(err);
        return res.sendStatus(405);
      }
      res.sendStatus(200);
      console.log({ result });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/deletecomplaint", async (req, res) => {
  const { room_no } = req.body;
  try {
    await db.deletecomplaint(room_no, (err, result) => {
      if (err) {
        console.error("Error resolving complaint:", err);
        return res.status(500).json({ error: "Error resolving complaint" });
      }
      res.json({ message: "Complaint resolved successfully" });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/recentactivities", async (req, res) => {
  const { userId, userType } = req.body;
  console.log("Received /recentactivities request:", { userId, userType });

  if (!userId || !userType) {
    console.log("Validation failed: Missing userId or userType");
    return res.status(400).json({ error: "Missing userId or userType in request body" });
  }

  let sql = "";
  if (userType === "tenant") {
    sql = "SELECT action, date FROM activities WHERE user_id = (SELECT id FROM auth WHERE user_id = ?) ORDER BY date DESC LIMIT 5";
  } else if (userType === "owner") {
    sql = "SELECT action, date FROM activities WHERE user_id IN (SELECT id FROM auth WHERE user_id = ?) ORDER BY date DESC LIMIT 5";
  } else if (userType === "admin") {
    sql = "SELECT action, date FROM activities ORDER BY date DESC LIMIT 5";
  } else {
    console.log("Validation failed: Invalid userType:", userType);
    return res.status(400).json({ error: "Invalid userType. Must be 'tenant', 'owner', or 'admin'" });
  }

  try {
    await db.query(sql, userType === "admin" ? [] : [userId], (err, results) => {
      if (err) {
        console.error("Error fetching recent activities:", err);
        return res.status(500).json({ error: "Error fetching recent activities" });
      }
      res.json(results);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/notifications", async (req, res) => {
  const { userId, userType } = req.body;
  console.log("Received /notifications request:", { userId, userType });

  if (!userId || !userType) {
    console.log("Validation failed: Missing userId or userType");
    return res.status(400).json({ error: "Missing userId or userType in request body" });
  }

  let sql = "";
  if (userType === "tenant") {
    sql = "SELECT message, date FROM notifications WHERE user_id = (SELECT id FROM auth WHERE user_id = ?) ORDER BY date DESC LIMIT 5";
  } else if (userType === "owner") {
    sql = "SELECT message, date FROM notifications WHERE user_id IN (SELECT id FROM auth WHERE user_id = ?) ORDER BY date DESC LIMIT 5";
  } else if (userType === "admin") {
    sql = "SELECT message, date FROM notifications ORDER BY date DESC LIMIT 5";
  } else {
    console.log("Validation failed: Invalid userType:", userType);
    return res.status(400).json({ error: "Invalid userType. Must be 'tenant', 'owner', or 'admin'" });
  }

  try {
    await db.query(sql, userType === "admin" ? [] : [userId], (err, results) => {
      if (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ error: "Error fetching notifications" });
      }
      res.json(results);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/stats-history", async (req, res) => {
  try {
    const sql = "SELECT month, total_owners, total_tenants, total_employees FROM stats_history ORDER BY month ASC";
    await db.query(sql, [], (err, results) => {
      if (err) {
        console.error("Error fetching stats history:", err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.json(results);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/employee", async (req, res) => {
  try {
    await db.getdata("employee", (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération des employés:", err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.send(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/weather", async (req, res) => {
  console.log("Reached /weather endpoint with city:", req.query.city);
  const city = req.query.city || "Paris";
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching weather data:", error.response?.data || error.message);
    if (error.response?.status === 404) {
      res.status(404).json({ error: "City not found", details: error.response.data.message });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: "Invalid API key", details: error.response.data.message });
    } else {
      res.status(500).json({ error: "Error fetching weather data", details: error.response?.data?.message || error.message });
    }
  }
});

app.post("/maintenancerequests", async (req, res) => {
  const { userId, userType, page = 1, all = false } = req.body;
  console.log("Received /maintenancerequests request:", { userId, userType, page, all });

  if (!userId || !userType) {
    console.log("Validation failed: Missing userId or userType");
    return res.status(400).json({ error: "Missing userId or userType in request body" });
  }

  const limit = 10; // Number of items per page
  const offset = (page - 1) * limit;

  const authSql = "SELECT id FROM auth WHERE user_id = ?";
  try {
    await db.query(authSql, [userId], (err, authResult) => {
      if (err) {
        console.error("Error fetching auth id:", err);
        return res.status(500).json({ error: "Erreur de base de données lors de la récupération de l'ID utilisateur" });
      }
      if (!authResult || authResult.length === 0) {
        console.error("No auth record found for user_id:", userId);
        return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
      }

      const authId = authResult[0].id;
      let sql = "";
      const params = [];
      if (userType === "tenant") {
        sql = "SELECT id, room_no, description, status, submitted_at FROM maintenance_requests WHERE user_id = ? AND user_type = ?";
        params.push(authId, userType);
      } else if (userType === "owner") {
        sql = `
          SELECT mr.id, mr.room_no, mr.description, mr.status, mr.submitted_at 
          FROM maintenance_requests mr
          JOIN tenant t ON mr.room_no = t.room_no
          JOIN owner o ON t.ownerno = o.owner_id
          WHERE o.owner_id = ? AND mr.user_type = 'tenant'
        `;
        params.push(authId);
      } else if (userType === "admin" || userType === "employee") {
        sql = "SELECT id, room_no, description, status, submitted_at FROM maintenance_requests WHERE user_type = 'tenant'";
      } else {
        console.log("Validation failed: Invalid userType:", userType);
        return res.status(400).json({ error: "Invalid userType. Must be 'tenant', 'owner', 'admin', or 'employee'" });
      }

      // Add ordering and pagination
      sql += " ORDER BY submitted_at DESC";
      if (!all) {
        sql += " LIMIT 5"; // Limit to 5 for dashboard
      } else {
        sql += ` LIMIT ${limit} OFFSET ${offset}`; // Pagination for MaintenanceRequests page
      }

      db.query(sql, params, (err, results) => {
        if (err) {
          console.error("Error fetching maintenance requests:", err);
          return res.status(500).json({ error: "Error fetching maintenance requests" });
        }
        console.log("Fetched maintenance requests:", results);
        res.json(results);
      });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Endpoint for system status (uptime, active users, alerts)
// Endpoint for system status (uptime, active users, alerts)
app.get("/systemstatus", async (req, res) => {
  try {
    // Calculate uptime (example: based on server start time)
    const serverStartTime = process.uptime(); // Time since server started in seconds
    const totalPossibleUptime = (Date.now() / 1000) - (new Date('2025-01-01').getTime() / 1000); // Example: total possible uptime since Jan 1, 2025
    const uptimePercentage = ((totalPossibleUptime - serverStartTime) / totalPossibleUptime) * 100;
    const uptime = Math.min(99.9, uptimePercentage).toFixed(1) + "%"; // Cap at 99.9% for realism

    // Count active users (users who logged in within the last 24 hours)
    const activeUsersSql = `
      SELECT COUNT(DISTINCT user_id) AS activeUsers
      FROM activities
      WHERE action = 'Logged in'
      AND date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const [activeUsersResult] = await new Promise((resolve, reject) => {
      db.query(activeUsersSql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Count recent alerts (unresolved alerts from the last 7 days)
    const alertsSql = `
      SELECT COUNT(*) AS alertCount 
      FROM system_alerts 
      WHERE resolved = FALSE 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const [alertsResult] = await new Promise((resolve, reject) => {
      db.query(alertsSql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      uptime: uptime,
      activeUsers: activeUsersResult.activeUsers || 0,
      alerts: alertsResult.alertCount || 0,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Endpoint for quick stats (logins today, complaints filed, pending requests)
app.get("/quickstats", async (req, res) => {
  try {
    // Count logins today
    const loginsTodaySql = `
      SELECT COUNT(*) AS totalLoginsToday
      FROM activities
      WHERE action = 'Logged in'
      AND DATE(date) = CURDATE()
    `;
    const [loginsTodayResult] = await new Promise((resolve, reject) => {
      db.query(loginsTodaySql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Count total complaints filed
    const complaintsSql = `
      SELECT COUNT(*) AS totalComplaintsFiled
      FROM block
      WHERE complaints IS NOT NULL
    `;
    const [complaintsResult] = await new Promise((resolve, reject) => {
      db.query(complaintsSql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Count pending maintenance requests
    const pendingRequestsSql = `
      SELECT COUNT(*) AS pendingRequests
      FROM maintenance_requests
      WHERE status = 'pending'
    `;
    const [pendingRequestsResult] = await new Promise((resolve, reject) => {
      db.query(pendingRequestsSql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      totalLoginsToday: loginsTodayResult.totalLoginsToday || 0,
      totalComplaintsFiled: complaintsResult.totalComplaintsFiled || 0,
      pendingRequests: pendingRequestsResult.pendingRequests || 0,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Endpoint for quick stats (logins today, complaints filed, pending requests)
app.get("/quickstats", async (req, res) => {
  try {
    // Count logins today
    const loginsTodaySql = `
      SELECT COUNT(*) AS totalLoginsToday
      FROM activities
      WHERE action = 'Logged in'
      AND DATE(date) = CURDATE()
    `;
    const [loginsTodayResult] = await new Promise((resolve, reject) => {
      db.query(loginsTodaySql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Count total complaints filed
    const complaintsSql = `
      SELECT COUNT(*) AS totalComplaintsFiled
      FROM block
      WHERE complaints IS NOT NULL
    `;
    const [complaintsResult] = await new Promise((resolve, reject) => {
      db.query(complaintsSql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Count pending maintenance requests
    const pendingRequestsSql = `
      SELECT COUNT(*) AS pendingRequests
      FROM maintenance_requests
      WHERE status = 'pending'
    `;
    const [pendingRequestsResult] = await new Promise((resolve, reject) => {
      db.query(pendingRequestsSql, [], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      totalLoginsToday: loginsTodayResult[0].totalLoginsToday || 0,
      totalComplaintsFiled: complaintsResult[0].totalComplaintsFiled || 0,
      pendingRequests: pendingRequestsResult[0].pendingRequests || 0,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/systemalerts", async (req, res) => {
  try {
    // Query to count unresolved alerts created in the last 7 days
    const sql = `
      SELECT COUNT(*) AS alertCount 
      FROM system_alerts 
      WHERE resolved = FALSE 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    await db.query(sql, [], (err, results) => {
      if (err) {
        console.error("Error fetching system alerts:", err);
        return res.status(500).json({ error: "Erreur de base de données" });
      }
      res.json({ alerts: results[0].alertCount });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.post("/submitmaintenancerequest", async (req, res) => {
  const { userId, userType, room_no, description } = req.body;
  console.log("Received /submitmaintenancerequest request:", { userId, userType, room_no, description });

  if (!userId || !userType || !room_no || !description) {
    console.log("Validation failed: Missing required fields");
    return res.status(400).json({ error: "Missing required fields: userId, userType, room_no, description" });
  }

  const authSql = "SELECT id FROM auth WHERE user_id = ?";
  try {
    await db.query(authSql, [userId], (err, authResult) => {
      if (err) {
        console.error("Error fetching auth id:", err);
        return res.status(500).json({ error: "Erreur de base de données lors de la récupération de l'ID utilisateur" });
      }
      if (!authResult || authResult.length === 0) {
        console.error("No auth record found for user_id:", userId);
        return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
      }

      const authId = authResult[0].id;
      const sql = "INSERT INTO maintenance_requests (user_id, user_type, room_no, description, status, submitted_at) VALUES (?, ?, ?, ?, 'pending', NOW())";
      db.query(sql, [authId, userType, room_no, description], (err, result) => {
        if (err) {
          console.error("Error submitting maintenance request:", err);
          return res.status(500).json({ error: "Error submitting maintenance request" });
        }
        res.json({ message: "Maintenance request submitted successfully", requestId: result.insertId });
      });
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/updateprofile/:userType", async (req, res) => {
  const { userId, block_no, email, phone, password, name, room_no, age, dob } = req.body;
  const { userType } = req.params;
  try {
    const actualId = userId.startsWith(`${userType.charAt(0).toLowerCase()}-`)
      ? userId.split("-")[1]
      : userId;

    if (userType === "admin") {
      if (!block_no || !/^\d+$/.test(block_no) || parseInt(block_no) <= 0) {
        return res.status(400).json({ error: "Le numéro de bloc doit être un entier positif." });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Adresse e-mail invalide." });
      }

      if (phone) {
        const phoneRegex = /^((\+33[67])|(0[67]))\d{8}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            error: "Le numéro de téléphone doit commencer par +336, +337, 06, ou 07 et être suivi de 8 chiffres (ex: +33612345678 ou 0612345678).",
          });
        }
      }

      if (password && password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
      }

      // Ignore the name field for admins
      const sql = "UPDATE block_admin SET block_no = ?, email = ?, phone = ? WHERE admin_id = ?";
      db.query(sql, [block_no, email, phone, actualId], (err, results) => {
        if (err) {
          console.error("Error updating block_admin:", err);
          return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
        }

        if (password) {
          const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
          db.query(authSql, [password, userId], (err, authResults) => {
            if (err) {
              console.error("Error updating auth:", err);
              return res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe" });
            }
            res.json({ message: "Profil mis à jour avec succès" });
          });
        } else {
          res.json({ message: "Profil mis à jour avec succès" });
        }
      });
    } else if (userType === "tenant") {
      const sql = "UPDATE tenant SET name = ?, room_no = ?, age = ?, dob = ? WHERE tenant_id = ?";
      db.query(sql, [name, room_no, age, dob, actualId], (err, results) => {
        if (err) {
          console.error("Error updating tenant:", err);
          return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
        }

        if (password) {
          const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
          db.query(authSql, [password, userId], (err, authResults) => {
            if (err) {
              console.error("Error updating auth:", err);
              return res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe" });
            }
            res.json({ message: "Profil mis à jour avec succès" });
          });
        } else {
          res.json({ message: "Profil mis à jour avec succès" });
        }
      });
    } else if (userType === "owner") {
      const sql = "UPDATE owner SET name = ? WHERE owner_id = ?";
      db.query(sql, [name, actualId], (err, results) => {
        if (err) {
          console.error("Error updating owner:", err);
          return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
        }

        if (password) {
          const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
          db.query(authSql, [password, userId], (err, authResults) => {
            if (err) {
              console.error("Error updating auth:", err);
              return res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe" });
            }
            res.json({ message: "Profil mis à jour avec succès" });
          });
        } else {
          res.json({ message: "Profil mis à jour avec succès" });
        }
      });
    } else if (userType === "employee") {
      const sql = "UPDATE employee SET name = ? WHERE emp_id = ?";
      db.query(sql, [name, actualId], (err, results) => {
        if (err) {
          console.error("Error updating employee:", err);
          return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
        }

        if (password) {
          const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
          db.query(authSql, [password, userId], (err, authResults) => {
            if (err) {
              console.error("Error updating auth:", err);
              return res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe" });
            }
            res.json({ message: "Profil mis à jour avec succès" });
          });
        } else {
          res.json({ message: "Profil mis à jour avec succès" });
        }
      });
    } else {
      return res.status(400).json({ error: "Invalid userType" });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
});

app.post("/block_admin", async (req, res) => {
  const { admin_id } = req.body;
  if (!admin_id) {
    return res.status(400).json({ error: "Missing admin_id in request body" });
  }

  try {
    await db.getBlockAdmin(admin_id, (err, result) => {
      if (err) {
        console.error("Error fetching block admin:", err);
        return res.status(500).json({ error: "Error fetching block admin data" });
      }
      if (!result) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.json(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/block", async (req, res) => {
  const { room_no } = req.body;
  if (!room_no) {
    return res.status(400).json({ error: "Missing room_no in request body" });
  }

  try {
    await db.getBlockByRoomNo(room_no, (err, result) => {
      if (err) {
        console.error("Error fetching block data:", err);
        return res.status(500).json({ error: "Error fetching block data" });
      }
      if (!result) {
        return res.status(404).json({ error: "Block not found for the given room number" });
      }
      res.json(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/paymentstatus", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    await db.getPaymentStatus(userId, (err, result) => {
      if (err) {
        console.error("Error fetching payment status:", err);
        return res.status(500).json({ error: "Error fetching payment status" });
      }
      if (!result) {
        return res.status(404).json({ error: "Payment status not found for the given user" });
      }
      res.json(result);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/available-parking-slots", async (req, res) => {
  console.log("Handling request: GET /available-parking-slots");
  try {
    await db.getAvailableParkingSlots((err, availableSlots) => {
      if (err) {
        console.error("Error fetching available parking slots:", err);
        return res.status(500).json({ message: "Error fetching available parking slots", error: err.sqlMessage });
      }
      res.status(200).json(availableSlots);
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des places de parking disponibles:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des places de parking disponibles" });
  }
});

app.get("/occupied-rooms", async (req, res) => {
  console.log("Handling request: GET /occupied-rooms");
  try {
    await db.getOccupiedRooms((err, occupiedRooms) => {
      if (err) {
        console.error("Error fetching occupied rooms:", err);
        return res.status(500).json({ message: "Error fetching occupied rooms", error: err.sqlMessage });
      }
      res.status(200).json(occupiedRooms);
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des chambres occupées:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des chambres occupées" });
  }
});

app.get("/available-blocks", async (req, res) => {
  try {
    const sql = "SELECT block_no, block_name FROM block";
    db.query(sql, [], (err, results) => {
      if (err) {
        console.error("Error fetching blocks:", err);
        return res.status(500).json({ error: "Erreur lors de la récupération des blocs" });
      }
      res.json(results);
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("*", function (req, res) {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

app.post("/dashboard/admin", async (req, res) => {
  const { userId } = req.body;
  try {
    const totalOwnerPromise = new Promise((resolve, reject) => {
      db.totalowner((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const totalTenantPromise = new Promise((resolve, reject) => {
      db.totaltenant((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const totalEmployeePromise = new Promise((resolve, reject) => {
      db.totalemployee((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const avgOwnerAgePromise = new Promise((resolve, reject) => {
      db.getAverageOwnerAge((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const avgTenantAgePromise = new Promise((resolve, reject) => {
      db.getAverageTenantAge((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const avgEmployeeAgePromise = new Promise((resolve, reject) => {
      db.getAverageEmployeeAge((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const activeOwnersPromise = new Promise((resolve, reject) => {
      db.getActiveOwners((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const activeTenantsPromise = new Promise((resolve, reject) => {
      db.getActiveTenants((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const activeEmployeesPromise = new Promise((resolve, reject) => {
      db.getActiveEmployees((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const [
      totalowner,
      totaltenant,
      totalemployee,
      avgOwnerAge,
      avgTenantAge,
      avgEmployeeAge,
      activeOwners,
      activeTenants,
      activeEmployees,
    ] = await Promise.all([
      totalOwnerPromise,
      totalTenantPromise,
      totalEmployeePromise,
      avgOwnerAgePromise,
      avgTenantAgePromise,
      avgEmployeeAgePromise,
      activeOwnersPromise,
      activeTenantsPromise,
      activeEmployeesPromise,
    ]);

    res.json({
      totalowner,
      totaltenant,
      totalemployee,
      avgOwnerAge,
      avgTenantAge,
      avgEmployeeAge,
      activeOwners,
      activeTenants,
      activeEmployees,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

try {
  app.listen(port, () => {
    console.log("Server started to listen...");
  });
} catch (err) {
  console.error("Error starting server:", err);
  process.exit(1);
}
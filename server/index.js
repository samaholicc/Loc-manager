require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const db = require("./mysql_connect");
const dashB = require("./routes/dashb");
const { param, validationResult } = require("express-validator");
const { sendVerificationEmail } = require("./utils/email");
const { v4: uuidv4 } = require("uuid");

const axios = require("axios");

const port = 5000;

const validateUserType = [
  param("userType")
    .isIn(["admin", "tenant", "owner", "employee"]) 
    .withMessage("Invalid userType"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  },
];
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
app.post("/owner", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const sql = `
      SELECT owner_id, name, room_no, email, is_email_verified
      FROM owner 
      WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?)
    `;
    const results = await db.query(sql, [userId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Owner not found for userId: " + userId });
    }
    res.json({ owner: results[0] });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/tenant", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const sql = `
      SELECT tenant_id, name, dob, age, room_no, email, is_email_verified
      FROM tenant 
      WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)
    `;
    const results = await db.query(sql, [userId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Tenant not found for userId: " + userId });
    }
    res.json(results);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});
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
    const result = await db.authoriseuser(username, password);
    console.log("Auth result:", result);
    if (result === "granted") {
      const sql = "SELECT id FROM auth WHERE user_id = ?";
      const authResult = await db.query(sql, [username]);
      if (!authResult || authResult.length === 0) {
        console.error("No auth record found for user_id:", username);
        return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
      }

      const authId = authResult[0].id;
      console.log("Auth ID for user_id", username, ":", authId);

      // Check email verification
      let isEmailVerified = false;
      let verificationSql;
      if (rep === "admin") {
        verificationSql = "SELECT is_email_verified FROM block_admin WHERE admin_id = ?";
      } else if (rep === "tenant") {
        verificationSql = "SELECT is_email_verified FROM tenant WHERE tenant_id = ?";
      } else if (rep === "owner") {
        verificationSql = "SELECT is_email_verified FROM owner WHERE owner_id = ?";
      } else if (rep === "employee") {
        verificationSql = "SELECT is_email_verified FROM employee WHERE emp_id = ?";
      }

      const verificationResult = await db.query(verificationSql, [authId]);
      if (!verificationResult || verificationResult.length === 0) {
        console.error(`No ${rep} record found for ${rep}_id:`, authId);
        return res.status(404).json({ error: `Utilisateur ${rep} non trouvé dans la table correspondante` });
      }

      isEmailVerified = verificationResult[0].is_email_verified;

      if (!isEmailVerified) {
        return res.status(403).json({ error: "Veuillez vérifier votre adresse e-mail avant de vous connecter." });
      }

      const activitySql = "INSERT INTO activities (user_id, action, date) VALUES (?, ?, NOW())";
      await db.query(activitySql, [authId, "Connexion utilisateur"]);

      if (rep === "admin") {
        const adminSql = "SELECT admin_id FROM block_admin WHERE admin_id = ?";
        const adminResult = await db.query(adminSql, [authId]); // Use authId instead of adminId
        if (!adminResult || adminResult.length === 0) {
          console.error("No admin record found for admin_id:", authId);
          return res.status(404).json({ error: "Admin non trouvé dans la table block_admin" });
        }

        const adminIdFromDb = adminResult[0].admin_id;
        console.log("Admin ID for admin_id", authId, ":", adminIdFromDb);
        res.json({ access: "granted", user: rep, userType: rep, username, adminId: adminIdFromDb });
      } else {
        res.json({ access: "granted", user: rep, userType: rep, username });
      }
    } else {
      res.json({ access: "denied", user: rep });
    }
  } catch (err) {
    console.error("Erreur lors de l'authentification:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'authentification" });
  }
});

app.get("/verify-email", async (req, res) => {
  const { userId, userType, token } = req.query;

  if (!userId || !userType || !token) {
    return res.redirect(`${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent("Missing required query parameters")}`);
  }

  try {
    // Fetch the auth ID
    const authSql = "SELECT id FROM auth WHERE user_id = ?";
    const authResult = await db.query(authSql, [userId]);
    if (!authResult || authResult.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent("Utilisateur non trouvé dans la table auth")}`);
    }
    const authId = authResult[0].id;

    // Check if the email is already verified
    let sql;
    if (userType === "admin") {
      sql = "SELECT is_email_verified FROM block_admin WHERE admin_id = ?";
    } else if (userType === "tenant") {
      sql = "SELECT is_email_verified FROM tenant WHERE tenant_id = ?";
    } else if (userType === "owner") {
      sql = "SELECT is_email_verified FROM owner WHERE owner_id = ?";
    } else if (userType === "employee") {
      sql = "SELECT is_email_verified FROM employee WHERE emp_id = ?";
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent("Invalid userType")}`);
    }

    const result = await db.query(sql, [authId]);
    if (!result || result.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent("Utilisateur non trouvé dans la table correspondante")}`);
    }

    if (result[0].is_email_verified) {
      return res.redirect(`${process.env.FRONTEND_URL}/verified?message=${encodeURIComponent("Email already verified")}`);
    }

    const isVerified = await db.verifyEmailToken(userId, userType, token);
    if (!isVerified) {
      return res.redirect(`${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent("Invalid or expired verification token")}`);
    }

    res.redirect(`${process.env.FRONTEND_URL}/verified?message=${encodeURIComponent("Email verified successfully")}`);
  } catch (err) {
    console.error("Error verifying email:", err);
    res.redirect(`${process.env.FRONTEND_URL}/verified?error=${encodeURIComponent("Server error: " + err.message)}`);
  }
});

app.post("/resend-verification", async (req, res) => {
  const { userId, userType } = req.body;
  if (!userId || !userType) {
    return res.status(400).json({ error: "Missing userId or userType" });
  }

  try {
    // Fetch the auth ID
    const authSql = "SELECT id FROM auth WHERE user_id = ?";
    const authResult = await db.query(authSql, [userId]);
    if (!authResult || authResult.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
    }
    const authId = authResult[0].id;

    // Start a transaction
    await db.query("START TRANSACTION");

    try {
      // Fetch the user's email based on userType
      let sql;
      if (userType === "admin") {
        sql = "SELECT email, is_email_verified FROM block_admin WHERE admin_id = ? FOR UPDATE";
      } else if (userType === "tenant") {
        sql = "SELECT email, is_email_verified FROM tenant WHERE tenant_id = ? FOR UPDATE";
      } else if (userType === "owner") {
        sql = "SELECT email, is_email_verified FROM owner WHERE owner_id = ? FOR UPDATE";
      } else if (userType === "employee") {
        sql = "SELECT email, is_email_verified FROM employee WHERE emp_id = ? FOR UPDATE";
      } else {
        await db.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid userType" });
      }

      const queryResult = await db.query(sql, [authId]);
      console.log("Full query result:", queryResult);

      if (!Array.isArray(queryResult) || queryResult.length < 1) {
        await db.query("ROLLBACK");
        return res.status(500).json({ error: "Unexpected query result format" });
      }

      const rows = queryResult[0];
      console.log("Rows from query:", rows);

      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
      }

      const user = Array.isArray(rows) ? rows[0] : rows;
      console.log("User object:", user);

      if (!user || !user.email) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: "Email not found for user" });
      }

      if (user.is_email_verified) {
        await db.query("ROLLBACK");
        return res.status(400).json({ error: "Email is already verified" });
      }

      const email = user.email;

      // Generate a new verification token and send the email
      const token = await db.generateVerificationToken(authId, userType);
      await sendVerificationEmail(email, userId, userType, token);

      await db.query("COMMIT");
      res.json({ message: "Verification email resent successfully" });
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  } catch (err) {
    console.error("Error resending verification email:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});


app.post("/raisingcomplaint", async (req, res) => {
  const desc = req.body.desc;
  const blockno = req.body.blockno;
  const roomno = req.body.roomno;
  const values = [desc, blockno, roomno];
  try {
    const result = await db.registercomplaint(values);
    if (result.affectedRows === 0) {
      return res.status(404).send("No matching block and room found");
    }
    res.send(result);
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de la plainte:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la plainte" });
  }
});

app.post("/createtenant", async (req, res) => {
  console.log("Request body:", req.body);
  const { name, age, roomno, password, dob, ID, stat, leaveDate, email } = req.body;

  if (!name || !roomno || !password || !dob || !ID || !stat || !age || !email) {
    return res.status(400).send("Missing required fields, including email");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const owners = await db.getdata("owner");
    const owner = owners.find((o) => String(o.room_no) === String(roomno));
    console.log("Found owner for roomno", roomno, ":", owner);
    if (!owner) {
      console.log(`No owner found for roomno: ${roomno}`);
      return res.status(400).send(`No owner found for room number ${roomno}`);
    }
    const ownerno = owner.owner_id;

    const tenantValues = [name, dob, stat, leaveDate, roomno, age, ownerno, password];
    console.log("Tenant values to insert:", tenantValues);
    const result = await db.createtenant(tenantValues);
    const insertedTenantId = result.insertedId;

    // Update email
    const updateSql = "UPDATE tenant SET email = ?, is_email_verified = FALSE WHERE tenant_id = ?";
    await db.query(updateSql, [email, insertedTenantId]);

    const token = await db.generateVerificationToken(insertedTenantId, "tenant");
    await sendVerificationEmail(email, `t-${insertedTenantId}`, "tenant", token);

    const proofValues = [ID, insertedTenantId];
    await db.createtenantproof(proofValues);

    console.log(`New tenant created with tenant_id: ${insertedTenantId}, user_id: t-${insertedTenantId}`);
    res.status(200).json({
      message: "Tenant created successfully. Please verify your email.",
      tenant_id: insertedTenantId,
      user_id: `t-${insertedTenantId}`,
    });
  } catch (err) {
    console.error("Erreur lors de la création du locataire:", err);
    res.status(500).send("Erreur serveur lors de la création du locataire: " + err.message);
  }
});

app.post("/createowner", async (req, res) => {
  const { name, age, roomno, password, aggrementStatus, dob, email } = req.body;

  if (!name || !age || !roomno || !password || !aggrementStatus || !dob || !email) {
    return res.status(400).json({ message: "All fields are required, including email" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const ownerValues = [name, age, aggrementStatus, roomno, dob, password];
  try {
    const result = await db.createowner(ownerValues);
    const ownerId = result.insertId;

    // Update email and generate verification token
    const updateSql = "UPDATE owner SET email = ?, is_email_verified = FALSE WHERE owner_id = ?";
    await db.query(updateSql, [email, ownerId]);

    const token = await db.generateVerificationToken(ownerId, "owner");
    await sendVerificationEmail(email, `o-${ownerId}`, "owner", token);

    const proofValues = [null, ownerId];
    await db.createownerproof(proofValues);
    res.status(200).json({
      message: "Owner created successfully. Please verify your email.",
      owner_id: ownerId,
    });
  } catch (err) {
    console.error("Erreur lors de la création du propriétaire:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création du propriétaire", error: err.message });
  }
});

app.get("/available-rooms", async (req, res) => {
  console.log("Handling request: GET /available-rooms");
  try {
    const availableRooms = await db.getAvailableRooms();
    res.status(200).json(availableRooms);
  } catch (err) {
    console.error("Erreur lors de la récupération des chambres disponibles:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des chambres disponibles", error: err.message });
  }
});

app.get("/tenantdetails", async (req, res) => {
  try {
    const result = await db.getdata("tenant");
    res.send(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des locataires:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.get("/ownerdetails", async (req, res) => {
  try {
    const result = await db.getdata("owner");
    res.send(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des propriétaires:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/viewparking", async (req, res) => {
  const id = req.body.userId;
  try {
    const result = await db.viewparking(id);
    res.send(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/ownercomplaints", async (req, res) => {
  const ownerid = req.body.userId;
  try {
    const result = await db.ownercomplaints(ownerid);
    res.send(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.get("/viewcomplaints", async (req, res) => {
  try {
    const result = await db.viewcomplaints();
    res.send(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/ownerroomdetails", async (req, res) => {
  const ownerId = req.body.userId;
  try {
    const result = await db.ownerroomdetails(ownerId);
    res.send(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/bookslot", async (req, res) => {
  const { roomNo, slotNo } = req.body;
  try {
    const checkSql = "SELECT parking_slot FROM room WHERE room_no = ?";
    const results = await db.query(checkSql, [roomNo]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Chambre non trouvée" });
    }

    const sql = "UPDATE room SET parking_slot = ? WHERE room_no = ?";
    await db.query(sql, [slotNo, roomNo]);
    res.json({ message: "Place de parking réservée avec succès" });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/ownertenantdetails", async (req, res) => {
  const id = req.body.userId;
  try {
    const result = await db.ownertenantdetails(id);
    res.send(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/paymaintanance", async (req, res) => {
  const userId = req.body.id;
  const sql = "SELECT id FROM auth WHERE user_id = ?";
  try {
    const authResult = await db.query(sql, [userId]);
    if (!authResult || authResult.length === 0) {
      console.error("No auth record found for user_id:", userId);
      return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
    }

    const authId = authResult[0].id;
    console.log("Auth ID for user_id", userId, ":", authId);

    await db.paymaintanence(userId);

    const activitySql = "INSERT INTO activities (user_id, action, date) VALUES (?, ?, NOW())";
    await db.query(activitySql, [authId, "Maintenance payé"]);

    res.sendStatus(200);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/deletetenant", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.deletetenant(id);
    res.sendStatus(200);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/deleteowner", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.deleteowner(id);
    res.sendStatus(200);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/deletemployee", async (req, res) => {
  const id = req.body.userId;
  try {
    await db.deleteemployee(id);
    res.sendStatus(200);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/deletecomplaint", async (req, res) => {
  const { room_no } = req.body;
  try {
    await db.deletecomplaint(room_no);
    res.json({ message: "Complaint resolved successfully" });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
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
  const params = userType === "admin" ? [] : [userId];
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
    const results = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("Error fetching recent activities:", err);
    res.status(500).json({ error: "Error fetching recent activities: " + err.message });
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
  const params = userType === "admin" ? [] : [userId];
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
    const results = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Error fetching notifications: " + err.message });
  }
});

app.get("/stats-history", async (req, res) => {
  try {
    const sql = "SELECT month, total_owners, total_tenants, total_employees FROM stats_history ORDER BY month ASC";
    const results = await db.query(sql, []);
    res.json(results);
  } catch (err) {
    console.error("Error fetching stats history:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.get("/employee", async (req, res) => {
  try {
    const result = await db.getdata("employee");
    res.send(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des employés:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
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
    const authResult = await db.query(authSql, [userId]);
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

    const results = await db.query(sql, params);
    console.log("Fetched maintenance requests:", results);
    res.json(results);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

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
      WHERE action = 'Connexion utilisateur'
      AND date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const [activeUsersResult] = await db.query(activeUsersSql, []);

    // Count recent alerts (unresolved alerts from the last 7 days)
    const alertsSql = `
      SELECT COUNT(*) AS alertCount 
      FROM system_alerts 
      WHERE resolved = FALSE 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const [alertsResult] = await db.query(alertsSql, []);

    res.json({
      uptime: uptime,
      activeUsers: activeUsersResult.activeUsers || 0,
      alerts: alertsResult.alertCount || 0,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.get("/quickstats", async (req, res) => {
  try {
    // Count logins today
    const loginsTodaySql = `
      SELECT COUNT(*) AS totalLoginsToday
      FROM activities
      WHERE action = 'Connexion utilisateur'
      AND DATE(date) = CURDATE()
    `;
    const [loginsTodayResult] = await db.query(loginsTodaySql, []);

    // Count total complaints filed
    const complaintsSql = `
      SELECT COUNT(*) AS totalComplaintsFiled
      FROM block
      WHERE complaints IS NOT NULL
    `;
    const [complaintsResult] = await db.query(complaintsSql, []);

    // Count pending maintenance requests
    const pendingRequestsSql = `
      SELECT COUNT(*) AS pendingRequests
      FROM maintenance_requests
      WHERE status = 'pending'
    `;
    const [pendingRequestsResult] = await db.query(pendingRequestsSql, []);

    res.json({
      totalLoginsToday: loginsTodayResult.totalLoginsToday || 0,
      totalComplaintsFiled: complaintsResult.totalComplaintsFiled || 0,
      pendingRequests: pendingRequestsResult.pendingRequests || 0,
    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});


app.get("/systemalerts", async (req, res) => {
  try {
    const sql = `
      SELECT COUNT(*) AS alertCount 
      FROM system_alerts 
      WHERE resolved = FALSE 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const [results] = await db.query(sql, []);
    res.json({ alerts: results.alertCount });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
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
    const authResult = await db.query(authSql, [userId]);
    if (!authResult || authResult.length === 0) {
      console.error("No auth record found for user_id:", userId);
      return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
    }

    const authId = authResult[0].id;
    const sql = "INSERT INTO maintenance_requests (user_id, user_type, room_no, description, status, submitted_at) VALUES (?, ?, ?, ?, 'pending', NOW())";
    const result = await db.query(sql, [authId, userType, room_no, description]);
    res.json({ message: "Maintenance request submitted successfully", requestId: result.insertId });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.put("/updateprofile/:userType", async (req, res) => {
  const { userId, block_no, email, phone, password, name, room_no, age, dob } = req.body;
  let { userType } = req.params;

  userType = userType.toLowerCase();
  console.log(`Received userType: ${userType}`);

  try {
    // Fetch the auth ID
    const authSql = "SELECT id FROM auth WHERE user_id = ?";
    const authResult = await db.query(authSql, [userId]);
    if (!authResult || authResult.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth" });
    }
    const authId = authResult[0].id;

    console.log(`Updating profile for userType: ${userType}, userId: ${userId}, authId: ${authId}`);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Adresse e-mail invalide." });
    }

    if (userType === "admin") {
      if (!block_no || !/^\d+$/.test(block_no) || parseInt(block_no) <= 0) {
        return res.status(400).json({ error: "Le numéro de bloc doit être un entier positif." });
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

      const sql = "UPDATE block_admin SET block_no = ?, email = ?, phone = ?, is_email_verified = FALSE WHERE admin_id = ?";
      const result = await db.query(sql, [block_no, email, phone, authId]);
      console.log("Query result for admin:", result);

      const affectedRows = Array.isArray(result) ? result[0]?.affectedRows : result?.affectedRows;
      if (affectedRows === undefined) {
        throw new Error("Résultat de la requête non valide pour admin.");
      }

      if (affectedRows === 0) {
        return res.status(404).json({ error: "Administrateur non trouvé." });
      }

      if (email) {
        const token = await db.generateVerificationToken(authId, "admin");
        await sendVerificationEmail(email, userId, "admin", token);
      }

      if (password) {
        const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
        const authResult = await db.query(authSql, [password, userId]);
        console.log("Auth query result for admin:", authResult);

        const authAffectedRows = Array.isArray(authResult) ? authResult[0]?.affectedRows : authResult?.affectedRows;
        if (authAffectedRows === undefined) {
          throw new Error("Résultat de la requête non valide pour auth.");
        }

        if (authAffectedRows === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth." });
        }
      }
      res.json({ message: "Profil mis à jour avec succès. Veuillez vérifier votre nouvelle adresse e-mail si elle a été modifiée." });
    } else if (userType === "tenant") {
      const sql = "UPDATE tenant SET name = ?, room_no = ?, age = ?, dob = ?, email = ?, is_email_verified = FALSE WHERE tenant_id = ?";
      const result = await db.query(sql, [name, room_no, age, dob, email, authId]);
      console.log("Query result for tenant:", result);

      const affectedRows = Array.isArray(result) ? result[0]?.affectedRows : result?.affectedRows;
      if (affectedRows === undefined) {
        throw new Error("Résultat de la requête non valide pour tenant.");
      }

      if (affectedRows === 0) {
        return res.status(404).json({ error: "Locataire non trouvé." });
      }

      if (email) {
        const token = await db.generateVerificationToken(authId, "tenant");
        await sendVerificationEmail(email, userId, "tenant", token);
      }

      if (password) {
        const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
        const authResult = await db.query(authSql, [password, userId]);
        console.log("Auth query result for tenant:", authResult);

        const authAffectedRows = Array.isArray(authResult) ? authResult[0]?.affectedRows : authResult?.affectedRows;
        if (authAffectedRows === undefined) {
          throw new Error("Résultat de la requête non valide pour auth.");
        }

        if (authAffectedRows === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth." });
        }
      }
      res.json({ message: "Profil mis à jour avec succès. Veuillez vérifier votre nouvelle adresse e-mail si elle a été modifiée." });
    } else if (userType === "owner") {
      const sql = "UPDATE owner SET name = ?, email = ?, is_email_verified = FALSE WHERE owner_id = ?";
      const result = await db.query(sql, [name, email, authId]);
      console.log("Query result for owner:", result);

      const affectedRows = Array.isArray(result) ? result[0]?.affectedRows : result?.affectedRows;
      if (affectedRows === undefined) {
        throw new Error("Résultat de la requête non valide pour owner.");
      }

      if (affectedRows === 0) {
        return res.status(404).json({ error: "Propriétaire non trouvé." });
      }

      if (email) {
        const token = await db.generateVerificationToken(authId, "owner");
        await sendVerificationEmail(email, userId, "owner", token);
      }

      if (password) {
        const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
        const authResult = await db.query(authSql, [password, userId]);
        console.log("Auth query result for owner:", authResult);

        const authAffectedRows = Array.isArray(authResult) ? authResult[0]?.affectedRows : authResult?.affectedRows;
        if (authAffectedRows === undefined) {
          throw new Error("Résultat de la requête non valide pour auth.");
        }

        if (authAffectedRows === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth." });
        }
      }
      res.json({ message: "Profil mis à jour avec succès. Veuillez vérifier votre nouvelle adresse e-mail si elle a été modifiée." });
    } else if (userType === "employee") {
      const sql = "UPDATE employee SET emp_name = ?, email = ?, is_email_verified = FALSE WHERE emp_id = ?";
      const result = await db.query(sql, [name, email, authId]);
      console.log("Query result for employee:", result);

      const affectedRows = Array.isArray(result) ? result[0]?.affectedRows : result?.affectedRows;
      if (affectedRows === undefined) {
        throw new Error("Résultat de la requête non valide pour employee.");
      }

      if (affectedRows === 0) {
        return res.status(404).json({ error: "Employé non trouvé avec cet emp_id." });
      }

      if (email) {
        const token = await db.generateVerificationToken(authId, "employee");
        await sendVerificationEmail(email, userId, "employee", token);
      }

      if (password) {
        const authSql = "UPDATE auth SET password = ? WHERE user_id = ?";
        const authResult = await db.query(authSql, [password, userId]);
        console.log("Auth query result for employee:", authResult);

        const authAffectedRows = Array.isArray(authResult) ? authResult[0]?.affectedRows : authResult?.affectedRows;
        if (authAffectedRows === undefined) {
          throw new Error("Résultat de la requête non valide pour auth.");
        }

        if (authAffectedRows === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth." });
        }
      }
      res.json({ message: "Profil mis à jour avec succès. Veuillez vérifier votre nouvelle adresse e-mail si elle a été modifiée." });
    } else {
      return res.status(400).json({ error: "Invalid userType" });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil: " + error.message });
  }
});
app.post("/sendmessage", async (req, res) => {
  const { sender_id, sender_type, receiver_id, receiver_type, subject, message } = req.body;

  if (!sender_id || !sender_type || !receiver_id || !receiver_type || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const sql = "INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, subject, message) VALUES (?, ?, ?, ?, ?, ?)";
    const result = await db.query(sql, [sender_id, sender_type, receiver_id, receiver_type, subject, message]);
    res.json({ message: "Message sent successfully", messageId: result.insertId });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

// Endpoint to fetch admins and owners for the dropdown
app.get("/usersfor messaging", async (req, res) => {
  try {
    const adminsSql = "SELECT admin_id AS id, admin_name AS name, 'admin' AS type FROM block_admin";
    const ownersSql = "SELECT owner_id AS id, name, 'owner' AS type FROM owner";
    
    const [admins] = await db.query(adminsSql);
    const [owners] = await db.query(ownersSql);

    const users = [...admins, ...owners];
    res.json(users);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});


app.post("/get-auth-id", async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await db.query("SELECT id FROM auth WHERE user_id = ?", [userId]);
    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé dans la table auth." });
    }

    const id = result[0].id;
    console.log("Extracted ID:", id);
    res.json({ id });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID auth:", error);
    res.status(500).json({ error: "Erreur serveur: " + error.message });
  }
});
app.post("/block_admin", async (req, res) => {
  const { admin_id } = req.body;
  if (!admin_id) {
    return res.status(400).json({ error: "Missing admin_id in request body" });
  }

  try {
    const result = await db.getBlockAdmin(admin_id);
    if (!result) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/block", async (req, res) => {
  const { room_no } = req.body;
  if (!room_no) {
    return res.status(400).json({ error: "Missing room_no in request body" });
  }

  try {
    const result = await db.getBlockByRoomNo(room_no);
    if (!result) {
      return res.status(404).json({ error: "Block not found for the given room number" });
    }
    res.json(result);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.post("/paymentstatus", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const result = await db.getPaymentStatus(userId);
    if (!result) {
      return res.status(404).json({ error: "Payment status not found for userId: " + userId });
    }
    res.json(result);
  } catch (err) {
    console.error("Error fetching payment status:", err);
    res.status(500).json({ error: "Error fetching payment status: " + err.message });
  }
});

app.get("/available-parking-slots", async (req, res) => {
  console.log("Handling request: GET /available-parking-slots");
  try {
    const availableSlots = await db.getAvailableParkingSlots();
    res.status(200).json(availableSlots);
  } catch (err) {
    console.error("Erreur lors de la récupération des places de parking disponibles:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des places de parking disponibles", error: err.message });
  }
});

app.get("/occupied-rooms", async (req, res) => {
  console.log("Handling request: GET /occupied-rooms");
  try {
    const occupiedRooms = await db.getOccupiedRooms();
    res.status(200).json(occupiedRooms);
  } catch (err) {
    console.error("Erreur lors de la récupération des chambres occupées:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des chambres occupées", error: err.message });
  }
});

app.get("/available-blocks", async (req, res) => {
  try {
    const sql = "SELECT block_no, block_name FROM block";
    const results = await db.query(sql, []);
    res.json(results);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

app.get("*", function (req, res) {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

try {
  app.listen(port, () => {
    console.log("Server started to listen...");
  });
} catch (err) {
  console.error("Error starting server:", err);
  process.exit(1);
}
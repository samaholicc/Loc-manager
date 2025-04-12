const mysql = require("mysql2/promise");
const config = require("./config_sql");
const { v4: uuidv4 } = require("uuid");
let con;

async function connect() {
  try {
    con = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      insecureAuth: config.insecureAuth,
      protocol: config.protocol,
    });
    console.log("database Connected!");
  } catch (err) {
    console.error("Erreur lors de la connexion à la base de données:", err);
    setTimeout(connect, 2000); // Réessayer après 2 secondes
  }

  con.on("error", (err) => {
    console.error("Erreur de connexion à la base de données:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.fatal) {
      console.log("Connexion perdue, tentative de reconnexion...");
      connect();
    } else {
      throw err;
    }
  });
}

connect();
async function generateVerificationToken(userId, userType) {
  try {
    await ensureConnection();
    const token = uuidv4();
    let sql;
    const params = [token, userId];

    if (userType === "admin") {
      sql = "UPDATE block_admin SET verification_token = ? WHERE admin_id = ?";
    } else if (userType === "tenant") {
      sql = "UPDATE tenant SET verification_token = ? WHERE tenant_id = ?";
    } else if (userType === "owner") {
      sql = "UPDATE owner SET verification_token = ? WHERE owner_id = ?";
    } else if (userType === "employee") {
      sql = "UPDATE employee SET verification_token = ? WHERE emp_id = ?";
    } else {
      throw new Error("Invalid userType");
    }

    const [result] = await con.query(sql, params);
    return token;
  } catch (err) {
    throw err;
  }
}

async function verifyEmailToken(userId, userType, token) {
  try {
    await ensureConnection();
    // Fetch the auth ID
    const authSql = "SELECT id FROM auth WHERE user_id = ?";
    const authResult = await con.query(authSql, [userId]);
    if (!authResult || authResult.length === 0) {
      throw new Error("Utilisateur non trouvé dans la table auth");
    }
    const authId = authResult[0][0].id; // Access the id from the first row

    let sql;
    const params = [authId, token];

    if (userType === "admin") {
      sql = "SELECT verification_token FROM block_admin WHERE admin_id = ? AND verification_token = ?";
    } else if (userType === "tenant") {
      sql = "SELECT verification_token FROM tenant WHERE tenant_id = ? AND verification_token = ?";
    } else if (userType === "owner") {
      sql = "SELECT verification_token FROM owner WHERE owner_id = ? AND verification_token = ?";
    } else if (userType === "employee") {
      sql = "SELECT verification_token FROM employee WHERE emp_id = ? AND verification_token = ?";
    } else {
      throw new Error("Invalid userType");
    }

    const [results] = await con.query(sql, params);
    if (results.length === 0) {
      return false;
    }

    // Mark email as verified and clear token
    if (userType === "admin") {
      sql = "UPDATE block_admin SET is_email_verified = TRUE, verification_token = NULL WHERE admin_id = ?";
    } else if (userType === "tenant") {
      sql = "UPDATE tenant SET is_email_verified = TRUE, verification_token = NULL WHERE tenant_id = ?";
    } else if (userType === "owner") {
      sql = "UPDATE owner SET is_email_verified = TRUE, verification_token = NULL WHERE owner_id = ?";
    } else if (userType === "employee") {
      sql = "UPDATE employee SET is_email_verified = TRUE, verification_token = NULL WHERE emp_id = ?";
    }

    await con.query(sql, [authId]);
    return true;
  } catch (err) {
    throw err;
  }
}
async function ensureConnection() {
  if (!con || con.connection._closing || con.connection.stream.destroyed) {
    console.log("Connexion déconnectée, tentative de reconnexion...");
    await connect();
  }
}

async function registercomplaint(values) {
  try {
    await ensureConnection();
    const [complaint, blockNo, roomNo] = values;
    const checkSql = "SELECT * FROM block WHERE block_no = ? AND room_no = ?";
    const [results] = await con.query(checkSql, [blockNo, roomNo]);

    if (results.length === 0) {
      const insertSql = "INSERT INTO block (block_no, room_no, complaints) VALUES (?, ?, ?)";
      const [insertResult] = await con.query(insertSql, [blockNo, roomNo, complaint]);
      console.log("Inserted new block:", insertResult);
      return insertResult;
    } else {
      const updateSql = "UPDATE block SET complaints = ? WHERE block_no = ? AND room_no = ?";
      const [updateResult] = await con.query(updateSql, [complaint, blockNo, roomNo]);
      console.log("Updated block:", updateResult);
      return updateResult;
    }
  } catch (err) {
    throw err;
  }
}

async function totalowner() {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(owner_id) AS totalowner FROM owner";
    const [results] = await con.query(sql);
    return results[0].totalowner;
  } catch (err) {
    throw err;
  }
}

async function getdata(tablename) {
  try {
    await ensureConnection();
    const sql = "SELECT * FROM " + tablename + ";";
    const [results] = await con.query(sql);
    return results;
  } catch (err) {
    throw err;
  }
}

async function createowner(values) {
  try {
    await ensureConnection();
    const [name, age, aggrementStatus, roomno, dob, password] = values;
    const sql = "INSERT INTO owner (name, age, aggrement_status, room_no, dob) VALUES (?, ?, ?, ?, ?)";
    const [result] = await con.query(sql, [name, age, aggrementStatus, roomno, dob]);
    const insertedOwnerId = result.insertId;

    const authValues = ["o-" + insertedOwnerId, password];
    const authResult = await createuserid(authValues);
    return result;
  } catch (err) {
    throw err;
  }
}

async function createownerproof(values) {
  try {
    await ensureConnection();
    const sql = "INSERT INTO identity VALUES (?, ?, NULL)";
    const [results] = await con.query(sql, values);
    return results;
  } catch (err) {
    throw err;
  }
}

async function viewcomplaints() {
  try {
    await ensureConnection();
    const sql = "SELECT * FROM block WHERE complaints IS NOT NULL;";
    const [results] = await con.query(sql);
    return results;
  } catch (err) {
    throw err;
  }
}

async function ownercomplaints(ownerid) {
  try {
    await ensureConnection();
    const sql =
      "SELECT complaints, room_no, resolved FROM block WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [ownerid]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function totaltenant() {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(tenant_id) AS totaltenant FROM tenant";
    const [results] = await con.query(sql);
    return results[0].totaltenant;
  } catch (err) {
    throw err;
  }
}

async function totalemployee() {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(emp_id) AS totalemployee FROM employee";
    const [results] = await con.query(sql);
    return results[0].totalemployee;
  } catch (err) {
    throw err;
  }
}

async function totalcomplaint() {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(complaints) AS totalcomplaint FROM block WHERE complaints IS NOT NULL";
    const [results] = await con.query(sql);
    return results[0].totalcomplaint;
  } catch (err) {
    throw err;
  }
}

async function gettenantdata(tid) {
  try {
    await ensureConnection();
    const sql = "SELECT tenant_id, name, dob, age, room_no FROM tenant WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)";
    const [results] = await con.query(sql, [tid]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function createtenant(values) {
  try {
    await ensureConnection();
    if (!Array.isArray(values) || values.length !== 8) {
      throw new Error("Invalid tenant values: expected exactly 8 elements [name, dob, stat, leaveDate, room_no, age, ownerno, password]");
    }

    const name = values[0];
    const dob = values[1];
    const stat = values[2];
    const leaveDate = values[3];
    const room_no = values[4];
    const age = values[5];
    const ownerno = values[6];
    const password = values[7];

    if (!ownerno || ownerno === "") {
      throw new Error("ownerno is required and cannot be empty");
    }
    if (!password || password === "") {
      throw new Error("password is required and cannot be empty");
    }

    const checkSql = "SELECT id FROM auth WHERE id = ?";
    const [results] = await con.query(checkSql, [ownerno]);
    if (results.length === 0) {
      throw new Error(`ownerno ${ownerno} does not exist in auth table`);
    }

    // Step 1: Insert into auth table, letting MySQL auto-increment the id
    const authSql = "INSERT INTO auth (password) VALUES (?)";
    const [authResult] = await con.query(authSql, [password]);
    const insertedId = authResult.insertId;

    // Step 2: Construct user_id as t-<insertedId> and update the auth record
    const userId = `t-${insertedId}`;
    const updateAuthSql = "UPDATE auth SET user_id = ? WHERE id = ?";
    await con.query(updateAuthSql, [userId, insertedId]);

    // Step 3: Insert into tenant table using the same id as tenant_id
    const tenantSql = "INSERT INTO tenant (tenant_id, name, dob, stat, leaveDate, room_no, age, ownerno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const tenantValues = [insertedId, name, dob, stat, leaveDate, room_no, age, ownerno];
    const [tenantResult] = await con.query(tenantSql, tenantValues);

    return { ...tenantResult, insertedId };
  } catch (err) {
    // Rollback: delete the auth record if tenant insertion fails
    if (insertedId) {
      const deleteAuthSql = "DELETE FROM auth WHERE id = ?";
      await con.query(deleteAuthSql, [insertedId]);
    }
    throw err;
  }
}

async function createtenantproof(values) {
  try {
    await ensureConnection();
    const sql = "INSERT INTO identity VALUES (?, NULL, ?)";
    const [results] = await con.query(sql, values);
    return results;
  } catch (err) {
    throw err;
  }
}

async function createuserid(values) {
  try {
    await ensureConnection();
    const sql = "INSERT INTO auth (user_id, password) VALUES (?, ?)";
    const [results] = await con.query(sql, values);
    const insertedId = results.insertId;
    return { ...results, insertedId };
  } catch (err) {
    throw err;
  }
}

async function ownertenantdetails(values) {
  try {
    await ensureConnection();
    const sql =
      "SELECT tenant_id, name, dob, stat, room_no, age FROM tenant WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [values]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function paymaintanence(id) {
  try {
    await ensureConnection();
    const sql =
      'UPDATE tenant SET stat = "Payé" WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)';
    const [results] = await con.query(sql, [id]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function ownerroomdetails(values) {
  try {
    await ensureConnection();
    const sql =
      "SELECT * FROM room WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [values]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function getOccupiedRooms() {
  try {
    await ensureConnection();
    // Fetch rooms from owner table
    const ownerSql = "SELECT room_no FROM owner";
    const [ownerResults] = await con.query(ownerSql);
    console.log("Rooms in owner table:", ownerResults.map((row) => row.room_no));

    // Fetch rooms from tenant table
    const tenantSql = "SELECT room_no FROM tenant";
    const [tenantResults] = await con.query(tenantSql);
    console.log("Rooms in tenant table:", tenantResults.map((row) => row.room_no));

    // Fetch rooms assigned to both owners and tenants
    const sql = `
      SELECT DISTINCT o.room_no 
      FROM owner o
      INNER JOIN tenant t ON o.room_no = t.room_no
    `;
    const [results] = await con.query(sql);
    const occupiedRooms = results.map((row) => row.room_no);
    console.log("Occupied rooms (assigned to both owner and tenant):", occupiedRooms);
    return occupiedRooms;
  } catch (err) {
    console.error("SQL Error in getOccupiedRooms:", err);
    throw err;
  }
}

async function viewparking(id) {
  try {
    await ensureConnection();
    const sql =
      "SELECT parking_slot FROM room WHERE room_no IN (SELECT room_no FROM tenant WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [id]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function empsalary(id) {
  try {
    await ensureConnection();
    const sql =
      "SELECT salary FROM employee WHERE emp_id IN (SELECT id FROM auth WHERE user_id = ?)";
    const [results] = await con.query(sql, [id]);
    return results;
  } catch (err) {
    throw err;
  }
}

async function authoriseuser(username, password) {
  try {
    await ensureConnection();
    let results;
    const sql = "SELECT password FROM auth WHERE user_id = ?";
    const value = [username];
    console.log(value);
    const [result] = await con.query(sql, value);

    if (!result || result.length === 0) {
      results = "denied";
      return results;
    }

    const resultArray = result[0].password;
    if (password === resultArray) {
      results = "granted";
    } else {
      results = "denied";
    }
    return results;
  } catch (err) {
    console.error("Erreur lors de la vérification de l'utilisateur:", err);
    throw err;
  }
}

async function getAverageOwnerAge() {
  try {
    await ensureConnection();
    const sql = "SELECT AVG(age) AS averageAge FROM owner WHERE age IS NOT NULL";
    const [results] = await con.query(sql);
    return results[0].averageAge || 0;
  } catch (err) {
    throw err;
  }
}

async function getAverageTenantAge() {
  try {
    await ensureConnection();
    const sql = "SELECT AVG(age) AS averageAge FROM tenant WHERE age IS NOT NULL";
    const [results] = await con.query(sql);
    return results[0].averageAge || 0;
  } catch (err) {
    throw err;
  }
}

async function getAverageEmployeeAge() {
  try {
    await ensureConnection();
    const sql = "SELECT AVG(age) AS averageAge FROM employee WHERE age IS NOT NULL";
    const [results] = await con.query(sql);
    return results[0].averageAge || 0;
  } catch (err) {
    throw err;
  }
}

async function getActiveOwners() {
  try {
    await ensureConnection();
    // Assuming "active" means owners who have at least one tenant
    const sql = `
      SELECT COUNT(DISTINCT o.owner_id) AS activeOwners 
      FROM owner o
      JOIN tenant t ON t.ownerno = o.owner_id
    `;
    const [results] = await con.query(sql);
    return results[0].activeOwners || 0;
  } catch (err) {
    throw err;
  }
}

async function getActiveTenants() {
  try {
    await ensureConnection();
    // Assuming "active" means tenants who have paid their maintenance
    const sql = "SELECT COUNT(*) AS activeTenants FROM tenant WHERE stat = 'Payé'";
    const [results] = await con.query(sql);
    return results[0].activeTenants || 0;
  } catch (err) {
    throw err;
  }
}

async function getActiveEmployees() {
  try {
    await ensureConnection();
    // Assuming "active" means employees who have a salary
    const sql = "SELECT COUNT(*) AS activeEmployees FROM employee WHERE salary IS NOT NULL";
    const [results] = await con.query(sql);
    return results[0].activeEmployees || 0;
  } catch (err) {
    throw err;
  }
}

async function bookslot(values) {
  try {
    await ensureConnection();
    const sql = "UPDATE room SET parking_slot = ? WHERE room_no = ?";
    const [results] = await con.query(sql, values);
    return results;
  } catch (err) {
    throw err;
  }
}

async function deletetenant(id) {
  try {
    await ensureConnection();
    const deleteRentalQuery = "DELETE FROM rental WHERE tenant_id = ?";
    const [rentalResults] = await con.query(deleteRentalQuery, [id]);
    const deleteIdentityQuery = "DELETE FROM identity WHERE tenant_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteTenantQuery = "DELETE FROM tenant WHERE tenant_id = ?";
    const [tenantResults] = await con.query(deleteTenantQuery, [id]);
    return tenantResults;
  } catch (err) {
    throw err;
  }
}

async function deleteowner(id) {
  try {
    await ensureConnection();
    const deleteIdentityQuery = "DELETE FROM identity WHERE owner_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteOwnerQuery = "DELETE FROM owner WHERE owner_id = ?";
    const [ownerResults] = await con.query(deleteOwnerQuery, [id]);
    return ownerResults;
  } catch (err) {
    throw err;
  }
}

async function deleteemployee(id) {
  try {
    await ensureConnection();
    const deleteIdentityQuery = "DELETE FROM identity WHERE emp_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteOwnerQuery = "DELETE FROM employee WHERE emp_id = ?";
    const [ownerResults] = await con.query(deleteOwnerQuery, [id]);
    return ownerResults;
  } catch (err) {
    throw err;
  }
}

async function deletecomplaint(id) {
  try {
    await ensureConnection();
    const sql = "UPDATE block SET complaints = NULL, resolved = TRUE WHERE room_no = ?";
    const [results] = await con.query(sql, [id]);
    console.log(results);
    return results;
  } catch (err) {
    throw err;
  }
}

async function getAvailableRooms() {
  try {
    await ensureConnection();
    const sql = `
      SELECT room_no 
      FROM room 
      WHERE room_no NOT IN (
        SELECT room_no FROM owner
      )
    `;
    const [results] = await con.query(sql);
    const availableRooms = results.map((row) => row.room_no);
    console.log("Available rooms:", availableRooms);
    return availableRooms;
  } catch (err) {
    console.error("SQL Error in getAvailableRooms:", err);
    throw err;
  }
}

async function getBlockAdmin(adminId) {
  try {
    await ensureConnection();
    const sql = "SELECT admin_name, block_no, email, phone, is_email_verified FROM block_admin WHERE admin_id = ?";
    const [results] = await con.query(sql, [adminId]);
    return results.length > 0 ? results[0] : null;
  } catch (err) {
    throw err;
  }
}

async function getBlockByRoomNo(roomNo) {
  try {
    await ensureConnection();
    const sql = "SELECT block_no, block_name FROM block WHERE room_no = ?";
    const [results] = await con.query(sql, [roomNo]);
    return results.length > 0 ? results[0] : null;
  } catch (err) {
    throw err;
  }
}

async function getPaymentStatus(tenantId) {
  try {
    await ensureConnection();
    const sql = "SELECT stat AS status, leaveDate AS dueDate FROM tenant WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)";
    const [results] = await con.query(sql, [tenantId]);
    return results.length > 0 ? results[0] : null;
  } catch (err) {
    throw err;
  }
}

async function getAvailableParkingSlots() {
  try {
    await ensureConnection();
    // Fetch all parking slots from the parking_slots table
    const slotsSql = "SELECT slot_number FROM parking_slots";
    const [slotsResults] = await con.query(slotsSql);
    const totalSlots = slotsResults.map((row) => row.slot_number);

    // Fetch assigned parking slots from the room table
    const assignedSql = "SELECT parking_slot FROM room WHERE parking_slot IS NOT NULL";
    const [assignedResults] = await con.query(assignedSql);
    const assignedSlots = assignedResults.map((row) => row.parking_slot);

    // Find available slots by filtering out assigned slots
    const availableSlots = totalSlots.filter((slot) => !assignedSlots.includes(slot));
    console.log("Available parking slots:", availableSlots);
    return availableSlots;
  } catch (err) {
    console.error("SQL Error in getAvailableParkingSlots:", err);
    throw err;
  }
}

module.exports = {
  con,
  query: async (sql, params) => {
    try {
      await ensureConnection();
      console.log("Executing query:", sql, "with params:", params);
      const [results, fields] = await con.query(sql, params);
      console.log("Raw query result:", [results, fields]);
      console.log("Returning results:", results);
      return results;
    } catch (err) {
      console.error("Query error:", err);
      throw err;
    }
  },
  connect,
  registercomplaint,
  createowner,
  bookslot,
  getdata,
  totalowner,
  totaltenant,
  totalemployee,
  totalcomplaint,
  createownerproof,
  viewcomplaints,
  authoriseuser,
  gettenantdata,
  createtenant,
  createtenantproof,
  ownerroomdetails,
  ownercomplaints,
  viewparking,
  createuserid,
  paymaintanence,
  empsalary,
  ownertenantdetails,
  deletetenant,
  deleteowner,
  deleteemployee,
  deletecomplaint,
  getAvailableRooms,
  getBlockAdmin,
  getBlockByRoomNo,
  getPaymentStatus,
  getAvailableParkingSlots,
  getOccupiedRooms,
  getAverageOwnerAge,
  getAverageTenantAge,
  getAverageEmployeeAge,
  getActiveOwners,
  getActiveTenants,
  getActiveEmployees,
  generateVerificationToken,
  verifyEmailToken,
};
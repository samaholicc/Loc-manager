const mysql = require("mysql2/promise");
const config = require("./config_sql");
const { v4: uuidv4 } = require("uuid");
let con;

// Define the query function at the top
const query = async (sql, params) => {
  try {
    await ensureConnection();
    const [results, fields] = await con.query(sql, params);
    return results;
  } catch (err) {
    throw err;
  }
};

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
    console.log("Database Connected! Config:", {
      host: config.host,
      user: config.user,
      database: config.database,
    });
  } catch (err) {
    console.error("Erreur lors de la connexion à la base de données:", err);
    setTimeout(connect, 2000);
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
    console.error("Error in generateVerificationToken:", err);
    throw err;
  }
}

async function verifyEmailToken(userId, userType, token) {
  try {
    await ensureConnection();
    const numericId = parseInt(userId.split("-")[1] || userId);
    let sql;
    const params = [numericId, token];

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

    if (userType === "admin") {
      sql = "UPDATE block_admin SET is_email_verified = TRUE, verification_token = NULL WHERE admin_id = ?";
    } else if (userType === "tenant") {
      sql = "UPDATE tenant SET is_email_verified = TRUE, verification_token = NULL WHERE tenant_id = ?";
    } else if (userType === "owner") {
      sql = "UPDATE owner SET is_email_verified = TRUE, verification_token = NULL WHERE owner_id = ?";
    } else if (userType === "employee") {
      sql = "UPDATE employee SET is_email_verified = TRUE, verification_token = NULL WHERE emp_id = ?";
    }

    await con.query(sql, [numericId]);
    return true;
  } catch (err) {
    console.error("Error in verifyEmailToken:", err);
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
    console.error("Error in registercomplaint:", err);
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
    console.error("Error in totalowner:", err);
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
    console.error("Error in getdata:", err);
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
    console.error("Error in createowner:", err);
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
    console.error("Error in createownerproof:", err);
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
    console.error("Error in viewcomplaints:", err);
    throw err;
  }
}

async function ownercomplaints(ownerid) {
  try {
    await ensureConnection();
    const sql = `
      SELECT complaints, room_no, resolved 
      FROM block 
      WHERE room_no IN (
        SELECT room_no 
        FROM owner 
        WHERE owner_id IN (
          SELECT id 
          FROM auth_owner 
          WHERE id = ?
        )
      )
    `;
    const result = await query(sql, [ownerid]);
    return result;
  } catch (err) {
    console.error("Error in ownercomplaints:", err);
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
    console.error("Error in totaltenant:", err);
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
    console.error("Error in totalemployee:", err);
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
    console.error("Error in totalcomplaint:", err);
    throw err;
  }
}

async function gettenantdata(tid) {
  try {
    await ensureConnection();
    const numericId = parseInt(tid.split("-")[1] || tid);
    const sql = "SELECT tenant_id, name, dob, age, room_no FROM tenant WHERE tenant_id = ?";
    const [results] = await con.query(sql, [numericId]);
    return results;
  } catch (err) {
    console.error("Error in gettenantdata:", err);
    throw err;
  }
}

async function createtenant(values) {
  let insertedId = null; // Initialize insertedId to null
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

    const checkSql = "SELECT id FROM auth_owner WHERE id = ?";
    const [results] = await con.query(checkSql, [ownerno]);
    if (results.length === 0) {
      throw new Error(`ownerno ${ownerno} does not exist in auth_owner table`);
    }

    const authSql = "INSERT INTO auth_tenant (password) VALUES (?)";
    const [authResult] = await con.query(authSql, [password]);
    insertedId = authResult.insertId;

    const userId = `t-${insertedId}`;
    const updateAuthSql = "UPDATE auth_tenant SET id = ? WHERE id = ?";
    await con.query(updateAuthSql, [insertedId, insertedId]);

    const tenantSql = "INSERT INTO tenant (tenant_id, name, dob, stat, leaveDate, room_no, age, ownerno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const tenantValues = [insertedId, name, dob, stat, leaveDate, room_no, age, ownerno];
    const [tenantResult] = await con.query(tenantSql, tenantValues);

    return { ...tenantResult, insertedId };
  } catch (err) {
    if (insertedId !== null) { // Only attempt cleanup if insertedId is defined
      try {
        const deleteAuthSql = "DELETE FROM auth_tenant WHERE id = ?";
        await con.query(deleteAuthSql, [insertedId]);
        console.log(`Cleaned up auth_tenant record with id ${insertedId}`);
      } catch (cleanupErr) {
        console.error("Error during auth_tenant cleanup:", cleanupErr);
      }
    }
    console.error("Error in createtenant:", err);
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
    console.error("Error in createtenantproof:", err);
    throw err;
  }
}

async function createuserid(values) {
  try {
    await ensureConnection();
    const [user_id, password] = values;
    let authTable;
    if (user_id.startsWith("o-")) {
      authTable = "auth_owner";
    } else if (user_id.startsWith("t-")) {
      authTable = "auth_tenant";
    } else if (user_id.startsWith("e-")) {
      authTable = "auth_employee";
    } else if (user_id.startsWith("a-")) {
      authTable = "auth_admin";
    } else {
      throw new Error("Invalid user_id format");
    }

    const numericId = parseInt(user_id.split("-")[1]);
    const sql = `INSERT INTO ${authTable} (id, password) VALUES (?, ?)`;
    const [results] = await con.query(sql, [numericId, password]);
    const insertedId = results.insertId;
    return { ...results, insertedId };
  } catch (err) {
    console.error("Error in createuserid:", err);
    throw err;
  }
}

async function ownertenantdetails(values) {
  try {
    await ensureConnection();
    const sql =
      "SELECT tenant_id, name, dob, stat, room_no, age FROM tenant WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth_owner WHERE id = ?))";
    const numericId = parseInt(values.split("-")[1] || values);
    const [results] = await query(sql, [numericId]);
    return results;
  } catch (err) {
    console.error("Error in ownertenantdetails:", err);
    throw err;
  }
}

async function paymaintanence(id) {
  try {
    await ensureConnection();
    const numericId = parseInt(id.split("-")[1] || id);
    const sql = 'UPDATE tenant SET stat = "Payé" WHERE tenant_id = ?';
    const [results] = await con.query(sql, [numericId]);
    return results;
  } catch (err) {
    console.error("Error in paymaintanence:", err);
    throw err;
  }
}

async function ownerroomdetails(values) {
  try {
    await ensureConnection();
    const numericId = parseInt(values.split("-")[1] || values);
    const sql = "SELECT * FROM room WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id = ?)";
    const [results] = await con.query(sql, [numericId]);
    return results;
  } catch (err) {
    console.error("Error in ownerroomdetails:", err);
    throw err;
  }
}

async function getOccupiedRooms() {
  try {
    await ensureConnection();
    const ownerSql = "SELECT room_no FROM owner";
    const [ownerResults] = await con.query(ownerSql);
    console.log("Rooms in owner table:", ownerResults.map((row) => row.room_no));

    const tenantSql = "SELECT room_no FROM tenant";
    const [tenantResults] = await con.query(tenantSql);
    console.log("Rooms in tenant table:", tenantResults.map((row) => row.room_no));

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
    const numericId = parseInt(id.split("-")[1] || id);
    const sql =
      "SELECT parking_slot FROM room WHERE room_no IN (SELECT room_no FROM tenant WHERE tenant_id = ?)";
    const [results] = await con.query(sql, [numericId]);
    return results;
  } catch (err) {
    console.error("Error in viewparking:", err);
    throw err;
  }
}

async function empsalary(id) {
  try {
    await ensureConnection();
    const numericId = parseInt(id.split("-")[1] || id);
    const sql = "SELECT salary FROM employee WHERE emp_id = ?";
    const [results] = await con.query(sql, [numericId]);
    return results;
  } catch (err) {
    console.error("Error in empsalary:", err);
    throw err;
  }
}

async function authoriseuser(username, password) {
  try {
    await ensureConnection();
    let results;
    let authTable;
    if (username.startsWith("a-")) authTable = "auth_admin";
    else if (username.startsWith("o-")) authTable = "auth_owner";
    else if (username.startsWith("t-")) authTable = "auth_tenant";
    else if (username.startsWith("e-")) authTable = "auth_employee";
    else throw new Error("Invalid username format");

    const numericId = parseInt(username.split("-")[1]);
    const sql = `SELECT password FROM ${authTable} WHERE id = ?`;
    const [result] = await con.query(sql, [numericId]);

    if (!result || result.length === 0) {
      results = "denied";
      return results;
    }

    const storedPassword = result[0].password;
    if (password === storedPassword) {
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
    console.error("Error in getAverageOwnerAge:", err);
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
    console.error("Error in getAverageTenantAge:", err);
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
    console.error("Error in getAverageEmployeeAge:", err);
    throw err;
  }
}

async function getActiveOwners() {
  try {
    await ensureConnection();
    const sql = `
      SELECT COUNT(DISTINCT o.owner_id) AS activeOwners 
      FROM owner o
      JOIN tenant t ON t.ownerno = o.owner_id
    `;
    const [results] = await con.query(sql);
    return results[0].activeOwners || 0;
  } catch (err) {
    console.error("Error in getActiveOwners:", err);
    throw err;
  }
}

async function getActiveTenants() {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(*) AS activeTenants FROM tenant WHERE stat = 'Payé'";
    const [results] = await con.query(sql);
    return results[0].activeTenants || 0;
  } catch (err) {
    console.error("Error in getActiveTenants:", err);
    throw err;
  }
}

async function getActiveEmployees() {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(*) AS activeEmployees FROM employee WHERE salary IS NOT NULL";
    const [results] = await con.query(sql);
    return results[0].activeEmployees || 0;
  } catch (err) {
    console.error("Error in getActiveEmployees:", err);
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
    console.error("Error in bookslot:", err);
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
    console.error("Error in deletetenant:", err);
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
    console.error("Error in deleteowner:", err);
    throw err;
  }
}

async function deleteemployee(id) {
  try {
    await ensureConnection();
    const deleteIdentityQuery = "DELETE FROM identity WHERE emp_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteEmployeeQuery = "DELETE FROM employee WHERE emp_id = ?";
    const [employeeResults] = await con.query(deleteEmployeeQuery, [id]);
    return employeeResults;
  } catch (err) {
    console.error("Error in deleteemployee:", err);
    throw err;
  }
}

async function deletecomplaint(id) {
  try {
    await ensureConnection();
    const sql = "UPDATE block SET complaints = NULL, resolved = TRUE WHERE room_no = ?";
    const [results] = await con.query(sql, [id]);
    console.log("Complaint deleted:", results);
    return results;
  } catch (err) {
    console.error("Error in deletecomplaint:", err);
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
    console.error("Error in getBlockAdmin:", err);
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
    console.error("Error in getBlockByRoomNo:", err);
    throw err;
  }
}

async function getPaymentStatus(tenantId) {
  try {
    await ensureConnection();
    const numericId = parseInt(tenantId.toString().split("-")[1] || tenantId);
    const sql = "SELECT stat AS status, leaveDate AS dueDate FROM tenant WHERE tenant_id = ?";
    const [results] = await con.query(sql, [numericId]);
    return results.length > 0 ? results[0] : null;
  } catch (err) {
    console.error("Error in getPaymentStatus:", err);
    throw err;
  }
}

async function getAvailableParkingSlots() {
  try {
    await ensureConnection();
    const slotsSql = "SELECT slot_number FROM parking_slots";
    const [slotsResults] = await con.query(slotsSql);
    const totalSlots = slotsResults.map((row) => row.slot_number);

    const assignedSql = "SELECT parking_slot FROM room WHERE parking_slot IS NOT NULL";
    const [assignedResults] = await con.query(assignedSql);
    const assignedSlots = assignedResults.map((row) => row.parking_slot);

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
  query,
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
const mysql = require("mysql2/promise");
const config = require("./config_sql");

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

async function ensureConnection() {
  if (!con || con.connection._closing || con.connection.stream.destroyed) {
    console.log("Connexion déconnectée, tentative de reconnexion...");
    await connect();
  }
}

async function registercomplaint(values, callback) {
  try {
    await ensureConnection();
    const [complaint, blockNo, roomNo] = values;
    const checkSql = "SELECT * FROM block WHERE block_no = ? AND room_no = ?";
    const [results] = await con.query(checkSql, [blockNo, roomNo]);

    if (results.length === 0) {
      const insertSql = "INSERT INTO block (block_no, room_no, complaints) VALUES (?, ?, ?)";
      const [insertResult] = await con.query(insertSql, [blockNo, roomNo, complaint]);
      console.log("Inserted new block:", insertResult);
      callback(null, insertResult);
    } else {
      const updateSql = "UPDATE block SET complaints = ? WHERE block_no = ? AND room_no = ?";
      const [updateResult] = await con.query(updateSql, [complaint, blockNo, roomNo]);
      console.log("Updated block:", updateResult);
      callback(null, updateResult);
    }
  } catch (err) {
    callback(err, null);
  }
}

async function totalowner(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(owner_id) AS totalowner FROM owner";
    const [results] = await con.query(sql);
    callback(null, results[0].totalowner);
  } catch (err) {
    callback(err, null);
  }
}

async function getdata(tablename, callback) {
  try {
    await ensureConnection();
    const sql = "SELECT * FROM " + tablename + ";";
    const [results] = await con.query(sql);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function createowner(values, callback) {
  try {
    await ensureConnection();
    const [name, age, aggrementStatus, roomno, dob, password] = values;
    const sql = "INSERT INTO owner (name, age, aggrement_status, room_no, dob) VALUES (?, ?, ?, ?, ?)";
    const [result] = await con.query(sql, [name, age, aggrementStatus, roomno, dob]);
    const insertedOwnerId = result.insertId;

    const authValues = ["o-" + insertedOwnerId, password];
    await createuserid(authValues, (err, authResult) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  } catch (err) {
    callback(err, null);
  }
}

async function createownerproof(values, callback) {
  try {
    await ensureConnection();
    const sql = "INSERT INTO identity VALUES (?, ?, NULL)";
    const [results] = await con.query(sql, values);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}



async function viewcomplaints(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT * FROM block WHERE complaints IS NOT NULL;";
    const [results] = await con.query(sql);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function ownercomplaints(ownerid, callback) {
  try {
    await ensureConnection();
    const sql =
      "SELECT complaints, room_no, resolved FROM block WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [ownerid]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function totaltenant(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(tenant_id) AS totaltenant FROM tenant";
    const [results] = await con.query(sql);
    callback(null, results[0].totaltenant);
  } catch (err) {
    callback(err, null);
  }
}

async function totalemployee(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(emp_id) AS totalemployee FROM employee";
    const [results] = await con.query(sql);
    callback(null, results[0].totalemployee);
  } catch (err) {
    callback(err, null);
  }
}

async function totalcomplaint(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT COUNT(complaints) AS totalcomplaint FROM block WHERE complaints IS NOT NULL";
    const [results] = await con.query(sql);
    callback(null, results[0].totalcomplaint);
  } catch (err) {
    callback(err, null);
  }
}

async function gettenantdata(tid, callback) {
  try {
    await ensureConnection();
    const sql =
      "SELECT tenant_id, name, dob, age, room_no FROM tenant WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)";
    const [results] = await con.query(sql, [tid]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function createtenant(values, callback) {
  try {
    await ensureConnection();
    if (!Array.isArray(values) || values.length !== 8) {
      return callback(new Error("Invalid tenant values: expected exactly 8 elements [name, dob, stat, leaveDate, room_no, age, ownerno, password]"), null);
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
      return callback(new Error("ownerno is required and cannot be empty"), null);
    }
    if (!password || password === "") {
      return callback(new Error("password is required and cannot be empty"), null);
    }

    const checkSql = "SELECT id FROM auth WHERE id = ?";
    const [results] = await con.query(checkSql, [ownerno]);
    if (results.length === 0) {
      return callback(new Error(`ownerno ${ownerno} does not exist in auth table`), null);
    }

    const sql = "INSERT INTO tenant (name, dob, stat, leaveDate, room_no, age, ownerno) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const insertValues = [name, dob, stat, leaveDate, room_no, age, ownerno];
    const [insertResult] = await con.query(sql, insertValues);
    const insertedId = insertResult.insertId;

    const userId = `t-${insertedId}`;
    const authValues = [userId, password];
    await createuserid(authValues, (err, authResult) => {
      if (err) {
        const deleteSql = "DELETE FROM tenant WHERE tenant_id = ?";
        con.query(deleteSql, [insertedId], (deleteErr) => {
          if (deleteErr) {
            console.error("Error rolling back tenant insert:", deleteErr);
          }
          return callback(new Error(`Failed to create user login: ${err.message}`), null);
        });
        return;
      }
      callback(null, { ...insertResult, insertedId });
    });
  } catch (err) {
    callback(err, null);
  }
}

async function createtenantproof(values, callback) {
  try {
    await ensureConnection();
    const sql = "INSERT INTO identity VALUES (?, NULL, ?)";
    const [results] = await con.query(sql, values);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function createuserid(values, callback) {
  try {
    await ensureConnection();
    const sql = "INSERT INTO auth (user_id, password) VALUES (?, ?)";
    const [results] = await con.query(sql, values);
    const insertedId = results.insertId;
    callback(null, { ...results, insertedId });
  } catch (err) {
    callback(err, null);
  }
}

async function ownertenantdetails(values, callback) {
  try {
    await ensureConnection();
    const sql =
      "SELECT tenant_id, name, dob, stat, room_no, age FROM tenant WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [values]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function paymaintanence(id, callback) {
  try {
    await ensureConnection();
    const sql =
      'UPDATE tenant SET stat = "Payé" WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)';
    const [results] = await con.query(sql, [id]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function ownerroomdetails(values, callback) {
  try {
    await ensureConnection();
    const sql =
      "SELECT * FROM room WHERE room_no IN (SELECT room_no FROM owner WHERE owner_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [values]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}
async function getOccupiedRooms(callback) {
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
    callback(null, occupiedRooms);
  } catch (err) {
    console.error("SQL Error in getOccupiedRooms:", err);
    callback(err, null);
  }
}
async function viewparking(id, callback) {
  try {
    await ensureConnection();
    const sql =
      "SELECT parking_slot FROM room WHERE room_no IN (SELECT room_no FROM tenant WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?))";
    const [results] = await con.query(sql, [id]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function empsalary(id, callback) {
  try {
    await ensureConnection();
    const sql =
      "SELECT salary FROM employee WHERE emp_id IN (SELECT id FROM auth WHERE user_id = ?)";
    const [results] = await con.query(sql, [id]);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function authoriseuser(username, password, callback) {
  try {
    await ensureConnection();
    let results;
    const sql = "SELECT password FROM auth WHERE user_id = ?";
    const value = [username];
    console.log(value);
    const [result] = await con.query(sql, value);

    if (!result || result.length === 0) {
      results = "denied";
      callback(null, results);
      return;
    }

    const resultArray = result[0].password;
    if (password === resultArray) {
      results = "granted";
    } else {
      results = "denied";
    }
    callback(null, results);
  } catch (err) {
    console.error("Erreur lors de la vérification de l'utilisateur:", err);
    callback(err, "denied");
  }
}

// Add to mysql_connect.js

async function getAverageOwnerAge(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT AVG(age) AS averageAge FROM owner WHERE age IS NOT NULL";
    const [results] = await con.query(sql);
    callback(null, results[0].averageAge || 0);
  } catch (err) {
    callback(err, null);
  }
}

async function getAverageTenantAge(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT AVG(age) AS averageAge FROM tenant WHERE age IS NOT NULL";
    const [results] = await con.query(sql);
    callback(null, results[0].averageAge || 0);
  } catch (err) {
    callback(err, null);
  }
}

async function getAverageEmployeeAge(callback) {
  try {
    await ensureConnection();
    const sql = "SELECT AVG(age) AS averageAge FROM employee WHERE age IS NOT NULL";
    const [results] = await con.query(sql);
    callback(null, results[0].averageAge || 0);
  } catch (err) {
    callback(err, null);
  }
}

async function getActiveOwners(callback) {
  try {
    await ensureConnection();
    // Assuming "active" means owners who have at least one tenant
    const sql = `
      SELECT COUNT(DISTINCT o.owner_id) AS activeOwners 
      FROM owner o
      JOIN tenant t ON t.ownerno = o.owner_id
    `;
    const [results] = await con.query(sql);
    callback(null, results[0].activeOwners || 0);
  } catch (err) {
    callback(err, null);
  }
}

async function getActiveTenants(callback) {
  try {
    await ensureConnection();
    // Assuming "active" means tenants who have paid their maintenance
    const sql = "SELECT COUNT(*) AS activeTenants FROM tenant WHERE stat = 'Payé'";
    const [results] = await con.query(sql);
    callback(null, results[0].activeTenants || 0);
  } catch (err) {
    callback(err, null);
  }
}

async function getActiveEmployees(callback) {
  try {
    await ensureConnection();
    // Assuming "active" means employees who have a salary
    const sql = "SELECT COUNT(*) AS activeEmployees FROM employee WHERE salary IS NOT NULL";
    const [results] = await con.query(sql);
    callback(null, results[0].activeEmployees || 0);
  } catch (err) {
    callback(err, null);
  }
}
async function bookslot(values, callback) {
  try {
    await ensureConnection();
    const sql = "UPDATE room SET parking_slot = ? WHERE room_no = ?";
    const [results] = await con.query(sql, values);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}
async function deletetenant(id, callback) {
  try {
    await ensureConnection();
    const deleteRentalQuery = "DELETE FROM rental WHERE tenant_id = ?";
    const [rentalResults] = await con.query(deleteRentalQuery, [id]);
    const deleteIdentityQuery = "DELETE FROM identity WHERE tenant_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteTenantQuery = "DELETE FROM tenant WHERE tenant_id = ?";
    const [tenantResults] = await con.query(deleteTenantQuery, [id]);
    callback(null, tenantResults);
  } catch (err) {
    callback(err, null);
  }
}

async function deleteowner(id, callback) {
  try {
    await ensureConnection();
    const deleteIdentityQuery = "DELETE FROM identity WHERE owner_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteOwnerQuery = "DELETE FROM owner WHERE owner_id = ?";
    const [ownerResults] = await con.query(deleteOwnerQuery, [id]);
    callback(null, ownerResults);
  } catch (err) {
    callback(err, null);
  }
}

async function deleteemployee(id, callback) {
  try {
    await ensureConnection();
    const deleteIdentityQuery = "DELETE FROM identity WHERE emp_id = ?";
    const [identityResults] = await con.query(deleteIdentityQuery, [id]);
    const deleteOwnerQuery = "DELETE FROM employee WHERE emp_id = ?";
    const [ownerResults] = await con.query(deleteOwnerQuery, [id]);
    callback(null, ownerResults);
  } catch (err) {
    callback(err, null);
  }
}

async function deletecomplaint(id, callback) {
  try {
    await ensureConnection();
    const sql = "UPDATE block SET complaints = NULL, resolved = TRUE WHERE room_no = ?";
    const [results] = await con.query(sql, [id]);
    console.log(results);
    callback(null, results);
  } catch (err) {
    callback(err, null);
  }
}

async function getAvailableRooms(callback) {
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
    callback(null, availableRooms);
  } catch (err) {
    console.error("SQL Error in getAvailableRooms:", err);
    callback(err, null);
  }
}

// New functions to support dashboard endpoints

async function getBlockAdmin(adminId, callback) {
  try {
    await ensureConnection();
    const sql = "SELECT admin_name, block_no, email, phone FROM block_admin WHERE admin_id = ?";
    const [results] = await con.query(sql, [adminId]);
    callback(null, results.length > 0 ? results[0] : null);
  } catch (err) {
    callback(err, null);
  }
}

async function getBlockByRoomNo(roomNo, callback) {
  try {
    await ensureConnection();
    const sql = "SELECT block_no, block_name FROM block WHERE room_no = ?";
    const [results] = await con.query(sql, [roomNo]);
    callback(null, results.length > 0 ? results[0] : null);
  } catch (err) {
    callback(err, null);
  }
}

async function getPaymentStatus(tenantId, callback) {
  try {
    await ensureConnection();
    const sql = "SELECT stat AS status, leaveDate AS dueDate FROM tenant WHERE tenant_id IN (SELECT id FROM auth WHERE user_id = ?)";
    const [results] = await con.query(sql, [tenantId]);
    callback(null, results.length > 0 ? results[0] : null);
  } catch (err) {
    callback(err, null);
  }
}
async function getAvailableParkingSlots(callback) {
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
    callback(null, availableSlots);
  } catch (err) {
    console.error("SQL Error in getAvailableParkingSlots:", err);
    callback(err, null);
  }
}
module.exports = {
  query: async (sql, params, callback) => {
    try {
      await ensureConnection();
      const [results] = await con.query(sql, params);
      callback(null, results);
    } catch (err) {
      callback(err, null);
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
  getAverageOwnerAge,    // Added
  getAverageTenantAge,  // Added
  getAverageEmployeeAge,// Added
  getActiveOwners,      // Added
  getActiveTenants,     // Added
  getActiveEmployees,   // Added
};
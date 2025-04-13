const express = require("express");
const router = express.Router();
const db = require("../mysql_connect");

// Dashboard route for employees
router.post("/employee", async (req, res) => {
  const { userId } = req.body;
  try {
    console.log("Received /dashboard/employee request with userId:", userId);

    if (!userId) {
      console.log("Missing userId in request body");
      return res.status(400).json({ error: "Missing userId in request body" });
    }

    const emp_id = parseInt(userId.split("-")[1] || userId);
    if (isNaN(emp_id)) {
      console.log("Invalid userId format:", userId);
      return res.status(400).json({ error: "Invalid userId format" });
    }

    console.log("Fetching employee data for emp_id:", emp_id);

    const sql = "SELECT emp_name, salary, block_no, email, is_email_verified FROM employee WHERE emp_id = ?";
    const results = await db.query(sql, [emp_id]);
    console.log("Employee query result:", results);

    if (!Array.isArray(results)) {
      console.log("Employee query result is not an array:", results);
      return res.status(500).json({ error: "Unexpected employee query result format" });
    }

    if (results.length === 0) {
      console.log("No employee record found for emp_id:", emp_id);
      return res.status(404).json({ error: "Employee not found for emp_id: " + emp_id });
    }

    const blockNo = results[0].block_no;
    let blockName = "Inconnu";
    if (blockNo) {
      const blockSql = "SELECT block_name FROM block WHERE block_no = ?";
      const blockResults = await db.query(blockSql, [blockNo]);
      console.log("Block query result:", blockResults);

      if (Array.isArray(blockResults) && blockResults.length > 0) {
        blockName = blockResults[0].block_name || "Inconnu";
      }
    }

    const totalComplaintSql = "SELECT COUNT(*) AS totalcomplaint FROM block WHERE complaints IS NOT NULL";
    const complaintResult = await db.query(totalComplaintSql);
    console.log("Total complaints:", complaintResult);

    if (!Array.isArray(complaintResult) || complaintResult.length === 0) {
      console.log("Total complaints query result is not valid:", complaintResult);
      return res.status(500).json({ error: "Unexpected total complaints query result format" });
    }

    const employeeData = {
      emp_name: results[0].emp_name,
      salary: results[0].salary,
      block_no: results[0].block_no,
      block_name: blockName,
      email: results[0].email || "",
      is_email_verified: results[0].is_email_verified || false,
      totalcomplaint: complaintResult[0].totalcomplaint,
    };

    res.json(employeeData);
  } catch (err) {
    console.error("Error fetching employee dashboard data:", err);
    res.status(500).json({ error: "Error fetching employee dashboard data: " + err.message });
  }
});

// Dashboard route for admins
router.post("/admin", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const totalowner = await db.totalowner();
    const totaltenant = await db.totaltenant();
    const totalemployee = await db.totalemployee();
    const avgOwnerAge = await db.getAverageOwnerAge();
    const avgTenantAge = await db.getAverageTenantAge();
    const avgEmployeeAge = await db.getAverageEmployeeAge();
    const activeOwners = await db.getActiveOwners();
    const activeTenants = await db.getActiveTenants();
    const activeEmployees = await db.getActiveEmployees();

    res.json({
      totalowner: totalowner || 0,
      totaltenant: totaltenant || 0,
      totalemployee: totalemployee || 0,
      avgOwnerAge: avgOwnerAge || 0,
      avgTenantAge: avgTenantAge || 0,
      avgEmployeeAge: avgEmployeeAge || 0,
      activeOwners: activeOwners || 0,
      activeTenants: activeTenants || 0,
      activeEmployees: activeEmployees || 0,
    });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).json({ error: "Error fetching admin dashboard data: " + err.message });
  }
});

// Dashboard route for owners
router.post("/owner", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const numericId = parseInt(userId.split("-")[1] || userId);
    const sql = `
      SELECT owner_id, name, room_no, email, is_email_verified
      FROM owner 
      WHERE owner_id = ?
    `;
    const results = await db.query(sql, [numericId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Owner not found for userId: " + numericId });
    }
    const totalcomplaint = await db.totalcomplaint();
    res.json({ owner: results[0], totalcomplaint });
  } catch (err) {
    console.error("Erreur serveur in /dashboard/owner:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

// Dashboard route for tenants
router.post("/tenant", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  try {
    const numericId = parseInt(userId.split("-")[1] || userId);
    const sql = `
      SELECT tenant_id, name, dob, age, room_no, email, is_email_verified
      FROM tenant 
      WHERE tenant_id = ?
    `;
    const results = await db.query(sql, [numericId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Tenant not found for userId: " + numericId });
    }
    res.json(results);
  } catch (err) {
    console.error("Erreur serveur in /dashboard/tenant:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
});

module.exports = router;
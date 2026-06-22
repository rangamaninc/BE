const mysql = require("mysql2/promise");
const config = require("../config");

function deriveFinancialYear(mmddyyyy) {
  const parts = String(mmddyyyy).split("/");
  if (parts.length !== 3) return null;

  const month = Number(parts[0]);
  const year = Number(parts[2]);
  if (!month || !year) return null;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}

const OpeningBalance = {
  deriveFinancialYear,

  async createOpeningBalance(openingBalance) {
    const connection = await mysql.createConnection(config.database);

    const financialYear =
      openingBalance.financialYear ||
      deriveFinancialYear(openingBalance.openingBalanceDate);
    const balanceType = openingBalance.isDebit === "1" || openingBalance.isDebit === true ? "D" : "C";

    try {
      const [result] = await connection.execute(
        `INSERT INTO opening_balances (
          client_id,
          gl_code,
          financial_year,
          balance_date,
          opening_amount,
          balance_type,
          currency_code,
          remarks,
          posting_status,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, STR_TO_DATE(?, '%m/%d/%Y'), ?, ?, ?, ?, 'DRAFT', ?, ?)`,
        [
          String(openingBalance.clientId),
          openingBalance.glCode,
          financialYear,
          openingBalance.openingBalanceDate,
          openingBalance.amount,
          balanceType,
          openingBalance.currencyCode || "USD",
          openingBalance.remarks || null,
          openingBalance.userDisplayName || String(openingBalance.userid),
          openingBalance.userDisplayName || String(openingBalance.userid),
        ]
      );

      return {
        id: result.insertId,
        financialYear,
        balanceType,
        ...openingBalance,
      };
    } finally {
      connection.end();
    }
  },

  async getOpeningBalancesByClient(clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        `SELECT ob.opening_balance_id,
                ob.gl_code AS glCode,
                COALESCE(coa.gl_name, cgm.client_gl_name) AS glName,
                DATE_FORMAT(ob.balance_date, '%m/%d/%Y') AS openingBalanceDate,
                ob.opening_amount AS openingAmount,
                ob.balance_type AS balanceType,
                ob.financial_year AS financialYear,
                ob.currency_code AS currencyCode,
                ob.remarks,
                ob.batch_id AS batchId,
                ob.posting_status AS postingStatus,
                ob.journal_id AS journalId,
                ob.updated_by AS updatedBy,
                COALESCE(
                  NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''),
                  u.username,
                  u.email,
                  ob.updated_by
                ) AS updatedByName,
                ob.created_on AS createdOn
         FROM opening_balances ob
         LEFT JOIN chart_of_accounts coa ON coa.gl_code = ob.gl_code
         LEFT JOIN client_gl_mapping cgm
           ON cgm.client_gl_code = ob.gl_code
          AND CAST(cgm.client_id AS CHAR) = CAST(ob.client_id AS CHAR)
         LEFT JOIN users u ON CAST(u.id AS CHAR) = CAST(ob.updated_by AS CHAR)
         WHERE CAST(ob.client_id AS CHAR) = CAST(? AS CHAR)
         ORDER BY ob.balance_date DESC, ob.gl_code ASC`,
        [clientId]
      );

      return rows.map((row) => ({
        id: row.opening_balance_id,
        glCode: row.glCode,
        glName: row.glName ?? null,
        openingBalanceDate: row.openingBalanceDate,
        openingAmount: Number(row.openingAmount),
        amount: Number(row.openingAmount),
        balanceType: row.balanceType,
        isDebit: row.balanceType === "D",
        financialYear: row.financialYear,
        currencyCode: row.currencyCode,
        remarks: row.remarks,
        batchId: row.batchId,
        postingStatus: row.postingStatus,
        journalId: row.journalId,
        updatedBy: row.updatedByName || row.updatedBy,
        createdOn: row.createdOn,
      }));
    } finally {
      connection.end();
    }
  },

  async findOpeningBalanceByClientGlAndYear(
    clientId,
    glCode,
    financialYear,
    excludeId = null
  ) {
    const connection = await mysql.createConnection(config.database);

    try {
      let sql = `SELECT opening_balance_id
         FROM opening_balances
         WHERE client_id = ?
           AND gl_code = ?
           AND financial_year = ?`;
      const params = [String(clientId), glCode, financialYear];

      if (excludeId) {
        sql += " AND opening_balance_id != ?";
        params.push(excludeId);
      }

      const [rows] = await connection.execute(sql, params);

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.end();
    }
  },

  async updateOpeningBalance(openingBalanceId, clientId, openingBalance) {
    const connection = await mysql.createConnection(config.database);

    const financialYear =
      openingBalance.financialYear ||
      deriveFinancialYear(openingBalance.openingBalanceDate);
    const balanceType =
      openingBalance.isDebit === "1" || openingBalance.isDebit === true
        ? "D"
        : "C";

    try {
      const [result] = await connection.execute(
        `UPDATE opening_balances
         SET gl_code = ?,
             financial_year = ?,
             balance_date = STR_TO_DATE(?, '%m/%d/%Y'),
             opening_amount = ?,
             balance_type = ?,
             currency_code = ?,
             remarks = ?,
             updated_by = ?
         WHERE opening_balance_id = ?
           AND client_id = ?`,
        [
          openingBalance.glCode,
          financialYear,
          openingBalance.openingBalanceDate,
          openingBalance.amount,
          balanceType,
          openingBalance.currencyCode || "USD",
          openingBalance.remarks || null,
          openingBalance.userDisplayName || String(openingBalance.userid),
          openingBalanceId,
          String(clientId),
        ]
      );

      return result.affectedRows > 0;
    } finally {
      connection.end();
    }
  },

  async deleteOpeningBalance(openingBalanceId, clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [result] = await connection.execute(
        `DELETE FROM opening_balances
         WHERE opening_balance_id = ?
           AND client_id = ?`,
        [openingBalanceId, String(clientId)]
      );

      return result.affectedRows > 0;
    } finally {
      connection.end();
    }
  },

  async getDraftOpeningBalancesByClient(clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        `SELECT ob.opening_balance_id AS id,
                ob.client_id AS clientId,
                ob.gl_code AS glCode,
                COALESCE(coa.gl_name, cgm.client_gl_name) AS glName,
                DATE_FORMAT(ob.balance_date, '%m/%d/%Y') AS openingBalanceDate,
                ob.opening_amount AS amount,
                ob.balance_type AS balanceType,
                ob.financial_year AS financialYear,
                ob.currency_code AS currencyCode,
                ob.remarks,
                ob.posting_status AS postingStatus
         FROM opening_balances ob
         LEFT JOIN chart_of_accounts coa ON coa.gl_code = ob.gl_code
         LEFT JOIN client_gl_mapping cgm
           ON cgm.client_gl_code = ob.gl_code
          AND CAST(cgm.client_id AS CHAR) = CAST(ob.client_id AS CHAR)
         WHERE CAST(ob.client_id AS CHAR) = CAST(? AS CHAR)
           AND (ob.posting_status IS NULL OR ob.posting_status = 'DRAFT')
         ORDER BY ob.balance_date DESC, ob.gl_code ASC`,
        [clientId]
      );

      return rows.map((row) => ({
        ...row,
        isDebit: row.balanceType === "D",
        openingAmount: Number(row.amount),
      }));
    } finally {
      connection.end();
    }
  },

  /**
   * Post opening balances for a client.
   * Validates and creates journal entries, general ledger entries, and audit trail.
   * Uses database transaction with rollback on any error.
   */
  async postOpeningBalances(clientId, userId, userDisplayName) {
    const connection = await mysql.createConnection(config.database);

    try {
      await connection.beginTransaction();

      // 1. Fetch all DRAFT opening balances for the client
      const [draftRecords] = await connection.execute(
        `SELECT ob.opening_balance_id AS id,
                ob.client_id AS clientId,
                ob.gl_code AS glCode,
                ob.financial_year AS financialYear,
                ob.balance_date AS balanceDate,
                ob.opening_amount AS amount,
                ob.balance_type AS balanceType,
                ob.currency_code AS currencyCode,
                ob.remarks
         FROM opening_balances ob
         WHERE CAST(ob.client_id AS CHAR) = CAST(? AS CHAR)
           AND (ob.posting_status IS NULL OR ob.posting_status = 'DRAFT')
         ORDER BY ob.gl_code ASC`,
        [clientId]
      );

      if (draftRecords.length === 0) {
        throw new Error("No draft opening balances found to post.");
      }

      // 2. VALIDATIONS

      // 2a. Financial Year Open check - all records must have same financial year
      const financialYears = [...new Set(draftRecords.map(r => r.financialYear))];
      if (financialYears.length !== 1) {
        throw new Error("All opening balances must belong to the same financial year.");
      }
      const financialYear = financialYears[0];

      // 2b. No Duplicate GL Codes
      const glCodes = draftRecords.map(r => r.glCode);
      const uniqueGlCodes = [...new Set(glCodes)];
      if (uniqueGlCodes.length !== glCodes.length) {
        throw new Error("Duplicate GL codes found. Each GL code can only appear once.");
      }

      // 2c. GL Codes Valid - verify against chart_of_accounts or client_gl_mapping
      if (uniqueGlCodes.length > 0) {
        const placeholders = uniqueGlCodes.map(() => '?').join(',');
        const [validGlCodes] = await connection.execute(
          `SELECT gl_code FROM chart_of_accounts WHERE gl_code IN (${placeholders})`,
          uniqueGlCodes
        );
        const validCodeSet = new Set(validGlCodes.map(r => r.gl_code));
        const invalidCodes = uniqueGlCodes.filter(code => !validCodeSet.has(code));
        if (invalidCodes.length > 0) {
          // Also check client_gl_mapping
          const clientPlaceholders = invalidCodes.map(() => '?').join(',');
          const [clientGlCodes] = await connection.execute(
            `SELECT client_gl_code FROM client_gl_mapping WHERE client_gl_code IN (${clientPlaceholders}) AND CAST(client_id AS CHAR) = CAST(? AS CHAR)`,
            [...invalidCodes, clientId]
          );
          const clientValidSet = new Set(clientGlCodes.map(r => r.client_gl_code));
          const stillInvalid = invalidCodes.filter(code => !clientValidSet.has(code));
          if (stillInvalid.length > 0) {
            throw new Error(`Invalid GL codes: ${stillInvalid.join(', ')}`);
          }
        }
      }

      // 2d. Validate balance type is valid
      for (const record of draftRecords) {
        const bt = String(record.balanceType || '').toUpperCase();
        if (bt !== 'D' && bt !== 'C') {
          throw new Error(
            `Invalid balance type '${record.balanceType}' for GL code ${record.glCode}. Must be 'D' or 'C'.`
          );
        }
        if (Number(record.amount) <= 0) {
          throw new Error(
            `Opening balance amount must be greater than zero for GL code ${record.glCode}.`
          );
        }
      }

      // 2e. Debit = Credit validation
      let totalDebit = 0;
      let totalCredit = 0;
      for (const record of draftRecords) {
        const bt = String(record.balanceType).toUpperCase();
        if (bt === 'D') {
          totalDebit += Number(record.amount);
        } else {
          totalCredit += Number(record.amount);
        }
      }
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(
          `Total debit (${totalDebit.toFixed(2)}) does not equal total credit (${totalCredit.toFixed(2)}).`
        );
      }

      // 3. Generate journal number
      const journalDate = draftRecords[0].balanceDate;
      const journalDateStr = new Date(journalDate).toISOString().slice(0, 10).replace(/-/g, '');
      const [journalCountResult] = await connection.execute(
        `SELECT COUNT(*) AS cnt FROM journal_header WHERE client_id = ? AND DATE(created_on) = CURDATE()`,
        [String(clientId)]
      );
      const journalSeq = (journalCountResult[0].cnt || 0) + 1;
      const journalNumber = `OB-${journalDateStr}-${String(journalSeq).padStart(4, '0')}`;

      // 4. Create Journal Header
      const accountingPeriod = financialYear.replace('-', '');
      const [journalHeaderResult] = await connection.execute(
        `INSERT INTO journal_header (
          client_id,
          journal_number,
          journal_date,
          accounting_period,
          financial_year,
          journal_type,
          reference_type,
          reference_id,
          currency_code,
          description,
          total_debit,
          total_credit,
          posting_status,
          posted_by,
          posted_on,
          created_by,
          updated_by
        ) VALUES (?, ?, STR_TO_DATE(?, '%Y%m%d'), ?, ?, 'OPENING_BALANCE', 'OPENING_BALANCE', NULL, 'USD', ?, ?, ?, 'POSTED', ?, NOW(), ?, ?)`,
        [
          String(clientId),
          journalNumber,
          journalDateStr,
          accountingPeriod,
          financialYear,
          'Opening Balance Posting',
          totalDebit,
          totalCredit,
          userDisplayName || String(userId),
          userDisplayName || String(userId),
          userDisplayName || String(userId),
        ]
      );
      const journalId = journalHeaderResult.insertId;

      // 5. Create Journal Details and General Ledger entries
      let lineNo = 1;
      const batchId = journalId; // Use journal_id as batch_id for grouping

      for (const record of draftRecords) {
        const bt = String(record.balanceType || '').toUpperCase().trim();
        const amount = Number(record.amount) || 0;
        let debitAmount = 0;
        let creditAmount = 0;
        if (bt === 'D') {
          debitAmount = amount;
        } else if (bt === 'C') {
          creditAmount = amount;
        } else {
          throw new Error(`Invalid balance type '${record.balanceType}' for GL code ${record.glCode}.`);
        }

        // Insert Journal Detail
        const [journalDetailResult] = await connection.execute(
          `INSERT INTO journal_detail (
            journal_id,
            line_no,
            gl_code,
            debit_amount,
            credit_amount,
            narration,
            created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            journalId,
            lineNo,
            record.glCode,
            debitAmount,
            creditAmount,
            record.remarks || `Opening balance - ${record.glCode}`,
            userDisplayName || String(userId),
          ]
        );
        const journalDetailId = journalDetailResult.insertId;

        // Insert General Ledger entry
        await connection.execute(
          `INSERT INTO general_ledger (
            client_id,
            journal_id,
            journal_detail_id,
            transaction_date,
            accounting_period,
            financial_year,
            gl_code,
            debit_amount,
            credit_amount,
            currency_code,
            reference_type,
            reference_id,
            source_module,
            narration,
            created_by
          ) VALUES (?, ?, ?, STR_TO_DATE(?, '%Y%m%d'), ?, ?, ?, ?, ?, ?, 'OPENING_BALANCE', NULL, 'OPENING_BALANCE', ?, ?)`,
          [
            String(clientId),
            journalId,
            journalDetailId,
            journalDateStr,
            accountingPeriod,
            financialYear,
            record.glCode,
            debitAmount,
            creditAmount,
            record.currencyCode || 'USD',
            record.remarks || `Opening balance - ${record.glCode}`,
            userDisplayName || String(userId),
          ]
        );

        lineNo++;
      }

      // 6. Update opening_balances status to POSTED
      const idPlaceholders = draftRecords.map(() => '?').join(',');
      const ids = draftRecords.map(r => r.id);
      await connection.execute(
        `UPDATE opening_balances
         SET posting_status = 'POSTED',
             batch_id = ?,
             journal_id = ?,
             updated_by = ?
         WHERE opening_balance_id IN (${idPlaceholders})`,
        [batchId, journalId, userDisplayName || String(userId), ...ids]
      );

      // 7. Insert Journal Audit record
      const auditDescription = JSON.stringify({
        action: 'POST',
        clientId,
        financialYear,
        totalRecords: draftRecords.length,
        totalDebit,
        totalCredit,
        journalNumber,
      });
      await connection.execute(
        `INSERT INTO journal_audit (
          journal_id,
          action_type,
          old_data,
          new_data,
          changed_by
        ) VALUES (?, 'POST', NULL, ?, ?)`,
        [journalId, auditDescription, userDisplayName || String(userId)]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Opening balances posted successfully.',
        journalId,
        journalNumber,
        batchId,
        recordsPosted: draftRecords.length,
        totalDebit,
        totalCredit,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.end();
    }
  },
};

module.exports = OpeningBalance;
// src/controllers/cashbookController.js
const Accural = require("../models/Accural");
const config = require("../config");

const AccuralController = {
  async addAcuuralData(req, res) {
    try {
        const {glCode,fromDate,toDate,monetisation,amount} = req.body
        const clientId= req.params.clientId
        const userId = req.user

        const AccuralData = {
            glCode,
            fromDate,
            toDate,
            clientId,
            userId,
            monetisation,
            amount
          };
          console.log(AccuralData)
        const result = await Accural.addAccural(AccuralData)

        res.json({success:true, messgae : "Accural Added Successfully"})

    } catch (error) {
        config.logger.error("Error inserting Accural:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = AccuralController;

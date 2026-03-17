import React, { useState } from "react";
import { Dialog, DialogContent } from "@mui/material";
import axios from "axios";
import { API_URL } from "../config/api.js";

const AdminCreateCompitition = ({ open, onClose }) => {

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "#fff"
  };

  const [formData, setFormData] = useState({
    competitionName: "",
    description: "",
    competitionType: "trading",
    startDate: "",
    endDate: "",
    maxParticipants: "",
    entryFee: "",
    totalPrizePool: "",
    competitionRules: "",
    isPublic: true,
    requiresKYC: false,
    allowMultipleEntries: false
  });

  const [prizeDistribution, setPrizeDistribution] = useState([]);

  const handleInputChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

  };

  const addPrizeRow = () => {

    const newRank = prizeDistribution.length + 1;

    setPrizeDistribution([
      ...prizeDistribution,
      { rank: newRank, prizeAmount: "" }
    ]);

  };

  const updatePrizeRow = (index, field, value) => {

    const updated = [...prizeDistribution];
    updated[index][field] = value;
    setPrizeDistribution(updated);

  };

  const removePrizeRow = (index) => {

    setPrizeDistribution(prizeDistribution.filter((_, i) => i !== index));

  };

  const validateForm = () => {

    if (
      !formData.competitionName ||
      !formData.description ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.maxParticipants ||
      !formData.entryFee ||
      !formData.totalPrizePool ||
      !formData.competitionRules
    ) {
      alert("Please fill all required fields");
      return false;
    }

    if (prizeDistribution.length === 0) {
      alert("Please add prize distribution");
      return false;
    }

    for (let prize of prizeDistribution) {
      if (!prize.prizeAmount) {
        alert("Please enter prize amount for all ranks");
        return false;
      }
    }

    return true;

  };

  const handleCreateCompetition = async () => {

    if (!validateForm()) return;

    try {

      const payload = {
        ...formData,
        prizeDistribution
      };

      const response = await axios.post(
        `${API_URL}/competitions/create`,
        payload
      );

      console.log("Competition Saved:", response.data);

      alert("Competition created successfully");

      onClose();

    } catch (error) {

      console.error(error);

      alert("Failed to create competition");

    }

  };

  return (

    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>

      <DialogContent>

        <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#f5f5f5" }}>

          <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>

              <h2>Add New Competition</h2>

              <div>

                <button
                  onClick={onClose}
                  style={{
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    marginRight: "10px",
                    borderRadius: "6px"
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateCompetition}
                  style={{
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px"
                  }}
                >
                  Create Competition
                </button>

              </div>

            </div>

            {/* FORM GRID */}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

              {/* LEFT */}

              <div>

                <label>Competition Name *</label>
                <input
                  name="competitionName"
                  value={formData.competitionName}
                  onChange={handleInputChange}
                  style={inputStyle}
                />

                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  style={inputStyle}
                />

                <label>Competition Type *</label>
                <select
                  name="competitionType"
                  value={formData.competitionType}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="trading">Trading</option>
                  <option value="demo">Demo</option>
                  <option value="investment">Investment</option>
                </select>

              </div>

              {/* RIGHT */}

              <div>

                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  style={inputStyle}
                />

                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  style={inputStyle}
                />

                <label>Max Participants *</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  style={inputStyle}
                />

                <label>Entry Fee *</label>
                <input
                  type="number"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  style={inputStyle}
                />

                <label>Total Prize Pool *</label>
                <input
                  name="totalPrizePool"
                  value={formData.totalPrizePool}
                  onChange={handleInputChange}
                  style={inputStyle}
                />

              </div>

            </div>

            {/* RULES */}

            <div style={{ marginTop: "20px" }}>

              <label>Competition Rules *</label>

              <textarea
                name="competitionRules"
                value={formData.competitionRules}
                onChange={handleInputChange}
                rows={4}
                style={inputStyle}
              />

            </div>

            {/* PRIZE DISTRIBUTION */}

            <div style={{ marginTop: "30px" }}>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>

                <h3>Prize Distribution *</h3>

                <button
                  onClick={addPrizeRow}
                  style={{
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  + Add Prize
                </button>

              </div>

              {prizeDistribution.length === 0 ? (

                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    background: "#fafafa",
                    border: "1px dashed #ccc",
                    borderRadius: "8px",
                    color: "#777"
                  }}
                >
                  No prize distribution added yet
                </div>

              ) : (

                prizeDistribution.map((prize, index) => (

                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr 120px",
                      gap: "10px",
                      alignItems: "center",
                      padding: "15px",
                      background: "#f9f9f9",
                      borderRadius: "8px",
                      marginBottom: "10px"
                    }}
                  >

                    <div
                      style={{
                        background: "#4CAF50",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "20px",
                        textAlign: "center",
                        fontWeight: "bold"
                      }}
                    >
                      Rank #{prize.rank}
                    </div>

                    <input
                      placeholder="Prize Amount (ex: $2500)"
                      value={prize.prizeAmount}
                      onChange={(e) =>
                        updatePrizeRow(index, "prizeAmount", e.target.value)
                      }
                      style={inputStyle}
                    />

                    <button
                      onClick={() => removePrizeRow(index)}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      </DialogContent>

    </Dialog>

  );

};

export default AdminCreateCompitition;
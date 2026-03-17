import React, { useState, useEffect } from 'react';
import AdminCreateCompitition from './AdminCreateCompitition';
import AdminLayout from '../components/AdminLayout';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api.js";

const AdminCompetition = () => {

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ongoing');
  const [open, setOpen] = useState(false);

  const [competitions, setCompetitions] = useState({
    ongoing: [],
    upcoming: [],
    completed: []
  });

  const whiteTheme = {
    bgPrimary: "#ffffff",
    bgCard: "#ffffff",
    bgHover: "#f8fafc",
    border: "#e5e7eb",
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    adminSuccess: "#16a34a",
    adminWarning: "#f59e0b",
    adminError: "#ef4444",
    adminInfo: "#3b82f6"
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {

    try {

      const res = await axios.get(`${API_URL}/competitions/getall`);
      const data = res.data.data;

      const grouped = {
        ongoing: [],
        upcoming: [],
        completed: []
      };

      data.forEach(comp => {

        const formatted = {
          id: comp._id,
          name: comp.competitionName,
          entryFee: comp.entryFee || "Free",
          prizePool: comp.totalPrizePool,
          participants: Array.isArray(comp.participants)
            ? comp.participants.length
            : (comp.participants || 0),
          startDate: comp.startDate?.slice(0,10),
          endDate: comp.endDate?.slice(0,10),
          raw: comp
        };

        if (comp.competitionStatus === "live") grouped.ongoing.push(formatted);
        if (comp.competitionStatus === "upcoming") grouped.upcoming.push(formatted);
        if (comp.competitionStatus === "completed") grouped.completed.push(formatted);

      });

      setCompetitions(grouped);

    } catch (error) {
      console.error("Error fetching competitions", error);
    }

  };

  const handleView = (competition) => {
    navigate(`/admin/competition-details/${competition.id}`);
  };

  const handleEdit = (competition) => {
    console.log("Edit competition:", competition);
    setOpen(true);
  };

  const handleDelete = async (competition) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this competition?"
    );

    if (!confirmDelete) return;

    try {

      await axios.delete(
        `${API_URL}/competitions/delete/${competition.id}`
      );

      fetchCompetitions();
      alert("Competition deleted");

    } catch (error) {
      console.error("Delete failed", error);
    }

  };

  const tabs = [
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' }
  ];

  return (

    <AdminLayout
      title="Trading Competitions"
      subtitle="Manage and create trading competitions for your users"
    >

      <div
        style={{
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: whiteTheme.bgPrimary,
          minHeight: '80vh'
        }}
      >

        <div
          style={{
            backgroundColor: whiteTheme.bgCard,
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${whiteTheme.border}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}
          >
            <h1
              style={{
                margin: 0,
                color: whiteTheme.textPrimary,
                fontSize: '24px'
              }}
            >
              Trading Competitions
            </h1>

            <button
              style={{
                backgroundColor: whiteTheme.adminSuccess,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              onClick={() => setOpen(true)}
            >
              Create Competition
            </button>
          </div>

          <AdminCreateCompitition
            open={open}
            onClose={() => setOpen(false)}
          />

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: `2px solid ${whiteTheme.border}`,
              marginBottom: '20px'
            }}
          >

            {tabs.map(tab => (

              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  color: activeTab === tab.id
                    ? whiteTheme.adminSuccess
                    : whiteTheme.textSecondary,
                  borderBottom: activeTab === tab.id
                    ? `2px solid ${whiteTheme.adminSuccess}`
                    : 'none',
                  marginBottom: '-2px'
                }}
              >
                {tab.label}
              </button>

            ))}

          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}
            >

              <thead>

                <tr
                  style={{
                    backgroundColor: whiteTheme.bgHover
                  }}
                >

                  <th style={thStyle}>Competition Name</th>
                  <th style={thStyle}>Entry Fee</th>
                  <th style={thStyle}>Prize Pool</th>
                  <th style={thStyle}>Participants</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>End Date</th>
                  <th style={thStyle}>Actions</th>

                </tr>

              </thead>

              <tbody>

                {competitions[activeTab].map((competition, index) => (

                  <tr
                    key={index}
                    style={{
                      borderBottom: `1px solid ${whiteTheme.border}`
                    }}
                  >

                    <td style={tdStyle}>{competition.name}</td>
                    <td style={tdStyle}>{competition.entryFee}</td>

                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold"
                      }}
                    >
                      {competition.prizePool}
                    </td>

                    <td style={tdStyle}>{competition.participants}</td>
                    <td style={tdStyle}>{competition.startDate}</td>
                    <td style={tdStyle}>{competition.endDate}</td>

                    <td style={{ padding: "12px" }}>

                      <button
                        onClick={() => handleView(competition)}
                        style={viewBtn}
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleEdit(competition)}
                        style={editBtn}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(competition)}
                        style={deleteBtn}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </AdminLayout>

  );
};

const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "2px solid #e5e7eb",
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold"
};

const tdStyle = {
  padding: "12px",
  color: "#111827"
};

const viewBtn = {
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  marginRight: "5px"
};

const editBtn = {
  backgroundColor: "#f59e0b",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  marginRight: "5px"
};

const deleteBtn = {
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px"
};

export default AdminCompetition;
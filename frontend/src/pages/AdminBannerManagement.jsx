import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { API_URL } from "../config/api";

const AdminBannerManagement = () => {

  const [banners, setBanners] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);

  // Remove /api from API_URL for loading images
  const BASE_URL = API_URL.replace("/api", "");

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_URL}/banners/getall`);
      setBanners(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const uploadBanner = async () => {

    if (!title || !image) {
      alert("Please provide banner title and image");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", image);

    try {

      await axios.post(`${API_URL}/banners/create`, formData);

      setOpenUpload(false);
      setTitle("");
      setImage(null);

      fetchBanners();

    } catch (err) {
      console.log(err);
    }
  };

  const deleteBanner = async (id) => {

    if (!window.confirm("Delete this banner?")) return;

    try {
      await axios.delete(`${API_URL}/banners/delete/${id}`);
      fetchBanners();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <AdminLayout
      title="Banner Management"
      subtitle="Manage promotional banners for client dashboard"
    >

      <div
        style={{
          padding: "30px",
          background: "#f8fafc",
          minHeight: "100vh",
          color: "#1e293b"
        }}
      >

        {/* Banner Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "25px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}
        >

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}
          >

            <div>
              <h3 style={{ margin: 0 }}>Banner Management</h3>
              <span style={{ color: "#64748b" }}>
                {banners.length} banners configured
              </span>
            </div>

            <button
              onClick={() => setOpenUpload(true)}
              style={{
                background: "linear-gradient(45deg,#8b5cf6,#6366f1)",
                border: "none",
                color: "white",
                padding: "10px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              + Add Banner
            </button>

          </div>

          {/* Empty State */}
          {banners.length === 0 && (

            <div
              style={{
                border: "1px dashed #cbd5f5",
                borderRadius: "10px",
                padding: "70px",
                textAlign: "center",
                background: "#ffffff",
                color: "#64748b"
              }}
            >

              <div style={{ fontSize: "45px", marginBottom: "10px" }}>🖼</div>

              <p>No banners created yet</p>

              <span
                style={{
                  color: "#6366f1",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
                onClick={() => setOpenUpload(true)}
              >
                Create your first banner
              </span>

            </div>

          )}

          {/* Banner Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: "20px",
              marginTop: "20px"
            }}
          >

            {banners.map((banner) => (

              <div
                key={banner._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >

                <img
                  src={`${BASE_URL}/uploads/banners/${banner.image}`}
                  alt={banner.title}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover"
                  }}
                />

                <div style={{ padding: "15px" }}>

                  <h4 style={{ marginBottom: "10px", color: "#1e293b" }}>
                    {banner.title}
                  </h4>

                  <button
                    onClick={() => deleteBanner(banner._id)}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "white",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* Upload Modal */}
        {openUpload && (

          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999
            }}
          >

            <div
              style={{
                background: "#ffffff",
                padding: "30px",
                borderRadius: "12px",
                width: "420px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.25)"
              }}
            >

              <h2 style={{ marginBottom: "20px" }}>Add Banner</h2>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "500" }}>Banner Title</label>

                <input
                  type="text"
                  placeholder="Enter banner title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                    borderRadius: "6px",
                    border: "1px solid #ccc"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontWeight: "500" }}>Upload Image</label>

                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  style={{ marginTop: "6px" }}
                />
              </div>

              {image && (
                <div style={{ marginBottom: "20px" }}>
                  <img
                    src={URL.createObjectURL(image)}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ddd"
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px"
                }}
              >

                <button
                  onClick={() => setOpenUpload(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    background: "#f5f5f5",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={uploadBanner}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#6366f1",
                    color: "white",
                    fontWeight: "500",
                    cursor: "pointer"
                  }}
                >
                  Upload Banner
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </AdminLayout>
  );
};

export default AdminBannerManagement;
import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { API_URL } from "../config/api";

const AdminBannerManagement = () => {

  const [banners, setBanners] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_URL}/banners/getall`);
      setBanners(res.data.data);
    } catch (err) {
      // console.log(err);
    }
  };

  const uploadBanner = async () => {

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
      // console.log(err);
    }
  };

  const deleteBanner = async (id) => {

    if (!window.confirm("Delete this banner?")) return;

    await axios.delete(`${API_URL}/banners/delete/${id}`);

    fetchBanners();

  };

  return (
    <AdminLayout title="Banner Management">

      <div style={{ padding: "20px", color: "white" }}>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>

          <div>
            <h2 style={{ margin: 0 }}>Banner Management</h2>
            <p style={{ margin: 0, opacity: 0.6 }}>
              Manage promotional banners for client dashboard
            </p>
          </div>

          <div style={{
            background: "#ff3b3b",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px"
          }}>
            â— Admin Mode
          </div>

        </div>

        {/* Banner Card */}
        <div style={{
          background: "#0f172a",
          padding: "20px",
          borderRadius: "10px"
        }}>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>

            <div>
              <h3 style={{ margin: 0 }}>Dashboard Banners</h3>
              <span style={{ opacity: 0.6 }}>
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
                fontWeight: "bold"
              }}
            >
              + Add Banner
            </button>

          </div>

          {/* Empty State */}
          {banners.length === 0 && (

            <div style={{
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "80px",
              textAlign: "center",
              opacity: 0.6
            }}>

              <div style={{ fontSize: "50px", marginBottom: "10px" }}>ðŸ–¼</div>

              <p>No banners created yet</p>

              <span
                style={{
                  color: "#a855f7",
                  cursor: "pointer"
                }}
                onClick={() => setOpenUpload(true)}
              >
                Create your first banner
              </span>

            </div>

          )}

          {/* Banner Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: "20px"
          }}>

            {banners.map(banner => (

              <div key={banner._id} style={{
                background: "#020617",
                borderRadius: "10px",
                overflow: "hidden"
              }}>

                <img
                  src={`${API_URL}/uploads/banners/${banner.image}`}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover"
                  }}
                />

                <div style={{ padding: "10px" }}>

                  <h4>{banner.title}</h4>

                  <button
                    onClick={() => deleteBanner(banner._id)}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "5px",
                      cursor: "pointer"
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

          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>

            <div style={{
              background: "#020617",
              padding: "30px",
              borderRadius: "10px",
              width: "400px"
            }}>

              <h3>Add Banner</h3>

              <input
                placeholder="Banner Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px"
                }}
              />

              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
              />

              <div style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between"
              }}>

                <button onClick={() => setOpenUpload(false)}>
                  Cancel
                </button>

                <button
                  onClick={uploadBanner}
                  style={{
                    background: "#8b5cf6",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px"
                  }}
                >
                  Upload
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

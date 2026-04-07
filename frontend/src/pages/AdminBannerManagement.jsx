import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { API_URL } from "../config/api";
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Upload, 
  X, 
  Info,
  Sparkles,
  ExternalLink,
  Loader2
} from "lucide-react";

const AdminBannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [desc, setDesc] = useState("");
  const [highlight, setHighlight] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("desc", desc);
    formData.append("highlight", highlight);
    formData.append("image", image);

    try {
      await axios.post(`${API_URL}/banners/create`, formData);
      setOpenUpload(false);
      setTitle("");
      setDesc("");
      setHighlight("");
      setImage(null);
      fetchBanners();
    } catch (err) {
      console.log(err);
      alert("Upload failed. Verify server logs.");
    }
    setLoading(false);
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Permanent deletion of this asset. Continue?")) return;

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
      subtitle="Manage promotional banners and marketing assets for the platform"
    >
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <ImageIcon size={28} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-xl tracking-tight">Active Banners</h3>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-0.5">
                 {banners.length} Configurations Deployed
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpenUpload(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Add New Banner
          </button>
        </div>
      </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 sm:p-8">
          {banners.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <Sparkles size={28} className="text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-1">No banners active</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto font-medium">Your promotional reach is currently inactive. Deploy a banner to engage users.</p>
              <button
                onClick={() => setOpenUpload(true)}
                className="text-blue-600 font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:text-blue-700 transition-all font-sans"
              >
                Launch First Campaign <ExternalLink size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={`${BASE_URL}/uploads/banners/${banner.image}`}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {banner.highlight && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur text-slate-900 border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {banner.highlight}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={() => deleteBanner(banner._id)}
                    className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 active:scale-95 shadow-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                     <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Promotion</p>
                  </div>
                  <h4 className="text-slate-900 font-bold text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {banner.title}
                  </h4>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2">
                    {banner.desc || "Active marketing asset."}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-60">
                     <div className="flex items-center gap-2">
                        <Info size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ready</span>
                     </div>
                     <span className="text-slate-400 font-mono text-[10px]">ID: {banner._id.slice(-6)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      {openUpload && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Upload size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add New Banner</h2>
                  <p className="text-xs font-medium text-slate-500">Configure promotional asset parameters</p>
                </div>
              </div>
              <button 
                onClick={() => setOpenUpload(false)}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Banner Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Trading Bonus"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g., LIMITED"
                      value={highlight}
                      onChange={(e) => setHighlight(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Brief Context</label>
                    <input
                      type="text"
                      placeholder="Description..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Creative Asset</label>
                  <div className="relative group/zone">
                    <input
                      type="file"
                      onChange={(e) => setImage(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                    <div className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                      image ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50 group-hover/zone:border-blue-300 group-hover/zone:bg-blue-50/50'
                    }`}>
                      {image ? (
                        <div className="flex items-center gap-3 px-6">
                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                              <ImageIcon size={20} className="text-green-600" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-slate-900 font-bold text-xs truncate">{image.name}</p>
                              <p className="text-green-600 font-bold text-[9px] uppercase tracking-wider">File Selected</p>
                           </div>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-400 group-hover/zone:text-blue-500 transition-colors mb-2" />
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Click or drag banner image</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {image && (
                  <div className="animate-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Preview</p>
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-[16/7]">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setOpenUpload(false)}
                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={uploadBanner}
                disabled={loading}
                className="flex-[2] px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {loading ? 'Processing...' : 'Upload Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBannerManagement;

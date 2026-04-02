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
      title="Banner Marketplace"
      subtitle="Architect global promotional assets for the client ecosystem"
    >
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-10 border-b border-slate-50">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center shadow-inner">
              <ImageIcon size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-2xl tracking-tight">Active Gallery</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 italic">
                 {banners.length} Configurations Deployed
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpenUpload(true)}
            className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Initialize Asset
          </button>
        </div>

        <div className="p-6 sm:p-10">
          {banners.length === 0 && (
            <div className="text-center py-40 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-200">
                <Sparkles size={48} className="text-slate-200" />
              </div>
              <h2 className="text-slate-900 font-black text-2xl mb-3 tracking-tighter">Void Detected</h2>
              <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Your promotional reach is currently inactive. Deploy a banner to engage users.</p>
              <button
                onClick={() => setOpenUpload(true)}
                className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:gap-4 transition-all"
              >
                Launch First Campaign <ExternalLink size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500"
              >
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    src={`${BASE_URL}/uploads/banners/${banner.image}`}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {banner.highlight && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                        {banner.highlight}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={() => deleteBanner(banner._id)}
                    className="absolute top-4 right-4 p-3 bg-red-600/90 backdrop-blur-md text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 active:scale-90 shadow-2xl"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest italic">Campaign Node</p>
                     <div className="flex gap-1">
                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-slate-200 rounded-full" />)}
                     </div>
                  </div>
                  <h4 className="text-slate-900 font-black text-2xl tracking-tighter mb-2 group-hover:text-blue-600 transition-colors">
                    {banner.title}
                  </h4>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed truncate">
                    {banner.desc || "Operational marketing asset without context."}
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                     <div className="flex items-center gap-2">
                        <Info size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Ready</span>
                     </div>
                     <span className="text-slate-900 font-mono text-[10px] font-bold">ID: {banner._id.slice(-6)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {openUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
                  <Upload size={32} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-black text-2xl tracking-tight">Deploy Banner</h2>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Configure asset parameters</p>
                </div>
              </div>
              <button 
                onClick={() => setOpenUpload(false)}
                className="p-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-200 shadow-sm transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3 italic">Administrative Title</label>
                  <input
                    type="text"
                    placeholder="E.g., Winter Liquidity Boost"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3 italic">Highlight Micro-copy</label>
                    <input
                      type="text"
                      placeholder="Ex: LIMITED TIME"
                      value={highlight}
                      onChange={(e) => setHighlight(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3 italic">Base Context</label>
                    <input
                      type="text"
                      placeholder="Brief description..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3 italic">Visual Payload</label>
                  <div className="relative group/zone">
                    <input
                      type="file"
                      onChange={(e) => setImage(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                    <div className={`h-40 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all ${
                      image ? 'border-green-200 bg-green-50/30' : 'border-slate-100 bg-slate-50 group-hover/zone:border-blue-200 group-hover/zone:bg-blue-50/30'
                    }`}>
                      {image ? (
                        <div className="flex items-center gap-4 px-8">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                              <ImageIcon size={24} className="text-green-600" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-slate-900 font-black text-sm truncate">{image.name}</p>
                              <p className="text-green-600 font-black text-[10px] uppercase tracking-widest italic">Asset Locked</p>
                           </div>
                        </div>
                      ) : (
                        <>
                          <Upload size={32} className="text-slate-300 group-hover/zone:text-blue-500 transition-colors mb-2" />
                          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest italic">Sync JPG/PNG Asset</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {image && (
                  <div className="animate-in slide-in-from-top-4">
                    <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3 italic">Live Render Trace</p>
                    <div className="rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-xl">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="preview"
                        className="w-full h-32 object-cover grayscale"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-50 flex gap-4">
              <button
                onClick={() => setOpenUpload(false)}
                className="flex-1 px-8 py-5 bg-white border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all font-black"
              >
                Abort
              </button>
              <button
                onClick={uploadBanner}
                disabled={loading}
                className="flex-[2] px-8 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                   <Loader2 size={18} className="animate-spin" />
                ) : (
                   <Sparkles size={18} />
                )}
                {loading ? 'PROCESSING PAYLOAD...' : 'DISPATCH CAMPAIGN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBannerManagement;

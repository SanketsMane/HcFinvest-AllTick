import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const ClientDashboardBannerSlider = () => {
  const [banners, setBanners] = useState([]);

  const BASE_URL = API_URL.replace("/api", "");

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_URL}/banners/getall`);
      setBanners(res.data.data || []);
    } catch (error) {
      // console.log(error);
    }
  };

  return (
    
    <div
      style={{
        width: "1300px", height: "260px", overflow: "hidden", borderRadius: "12px", boxSizing: "border-box", margin:"20px"
      }}
    className="w-full h-[260px] rounded-xl box-border">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        style={{
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div className="w-full h-[260px]">
              <img
                src={`${BASE_URL}/uploads/banners/${banner.image}`}
                alt={banner.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ClientDashboardBannerSlider;

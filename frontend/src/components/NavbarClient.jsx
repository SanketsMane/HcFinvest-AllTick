// // NavbarClient.jsx

// import { User, LogOut, Bell, Megaphone } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import { API_URL } from "../config/api";
// import { getSafeJSON } from "../utils/safeLocalStorage";

// const NavbarClient = ({ title, subtitle }) => {
//   const navigate = useNavigate();
  

//   const [open, setOpen] = useState(false);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const [announcements, setAnnouncements] = useState([]);
//   const [hasNew, setHasNew] = useState(false);
//   const [newIds, setNewIds] = useState([]); // 🔵 track new announcements

//   const user = getSafeJSON("user", {});

//   const initial =
//     `${user?.firstName || ""} ${user?.lastName || ""}`
//       .trim()
//       .split(" ")
//       .map((n) => n.charAt(0))
//       .slice(0, 2)
//       .join("")
//       .toUpperCase() || "U";

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     navigate("/user/login");
//   };

//   // ✅ Fetch announcements + detect new
//   const fetchAnnouncements = async () => {
//     try {
//       const res = await axios.get(
//         `${API_URL}/announcement/get/announcements`
//       );

//       const data = res.data || [];
//       setAnnouncements(data);

//       const lastSeen = localStorage.getItem("lastSeenAnnouncement");

//       if (data.length > 0) {
//         const latest = new Date(data[0].createdAt).getTime();

//         if (!lastSeen || latest > Number(lastSeen)) {
//           setHasNew(true);

//           const newItems = data.filter(
//             (item) =>
//               new Date(item.createdAt).getTime() >
//               Number(lastSeen || 0)
//           );

//           setNewIds(newItems.map((item) => item._id));
//         }
//       }
//     } catch (error) {
//       console.log("Error fetching announcements", error);
//     }
//   };

//   useEffect(() => {
//     fetchAnnouncements();
//   }, []);

//   // ✅ Close dropdowns on outside click
//   useEffect(() => {
//     const handleClickOutside = () => {
//       setOpen(false);
//       setNotifOpen(false);
//     };

//     window.addEventListener("click", handleClickOutside);
//     return () => window.removeEventListener("click", handleClickOutside);
//   }, []);

//   return (
//     <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-4">
      
//       {/* LEFT */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
//         <p className="text-gray-500 text-sm">{subtitle}</p>
//       </div>

//       {/* RIGHT SECTION */}
//       <div className="flex items-center gap-4 relative">

//         {/* 🔔 ANNOUNCEMENT BELL */}
//         <div className="relative">
//           <div
//             onClick={(e) => {
//               e.stopPropagation();
//               setNotifOpen(!notifOpen);

//               // ✅ Mark as seen (BUT DO NOT CLEAR newIds)
//               if (announcements.length > 0) {
//                 const latest = new Date(
//                   announcements[0].createdAt
//                 ).getTime();

//                 localStorage.setItem(
//                   "lastSeenAnnouncement",
//                   latest
//                 );

//                 setHasNew(false);

//                 // ❌ IMPORTANT: removed setNewIds([])
//               }
//             }}
//             className="p-2 rounded-full bg-green-200 hover:bg-gray-200 transition cursor-pointer"
//           >
//             <Megaphone size={20} className="text-gray-700" />
//           </div>

//           {/* 🔴 SHOW ONLY 1 */}
//           {hasNew && (
//             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
//               1
//             </span>
//           )}

//           {/* 🔽 ANNOUNCEMENT DROPDOWN */}
//           {notifOpen && (
//             <div
//               onClick={(e) => e.stopPropagation()}
//               className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-xl border z-50 overflow-hidden"
//             >
//               <div className="p-3 border-b font-semibold text-gray-700 bg-gray-50">
//                 📢 Announcements
//               </div>

//               <div className="max-h-72 overflow-y-auto">
//                 {announcements.length === 0 ? (
//                   <p className="p-3 text-gray-500 text-sm">
//                     No announcements
//                   </p>
//                 ) : (
//                   announcements.map((item) => (
//                     <div
//                       key={item._id}
//                       className={`p-3 border-b transition 
//                         ${
//                           newIds.includes(item._id)
//                             ? "bg-blue-50 border-l-4 border-blue-500"
//                             : "hover:bg-gray-50"
//                         }`}
//                     >
//                       <p className="font-semibold text-sm text-gray-800 flex items-center">
//                         {item.title}

//                         {/* 🆕 NEW BADGE */}
//                         {newIds.includes(item._id) && (
//                           <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded">
//                             NEW
//                           </span>
//                         )}
//                       </p>

//                       <p className="text-xs text-gray-600 mt-1">
//                         {item.description}
//                       </p>

//                       <p className="text-[10px] text-gray-400 mt-1">
//                         {new Date(item.createdAt).toLocaleString()}
//                       </p>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* 👤 PROFILE */}
//         <div className="relative">
//           <div
//             onClick={(e) => {
//               e.stopPropagation();
//               setOpen(!open);
//             }}
//             className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-gray-100 transition"
//           >
//             <div className="w-9 h-9 rounded-full bg-[#22c55e] text-white flex items-center justify-center font-semibold text-sm">
//               {initial}
//             </div>

//             <div>
//               <p className="text-sm font-semibold text-gray-900">
//                 {user?.firstName || "User"}
//               </p>
//             </div>
//           </div>

//           {/* PROFILE DROPDOWN */}
//           {open && (
//             <div
//               onClick={(e) => e.stopPropagation()}
//               className="absolute right-0 mt-3 w-52 bg-white shadow-xl rounded-xl border z-50 overflow-hidden"
//             >
//               <div className="px-4 py-3 border-b bg-gray-50">
//                 <p className="text-sm font-semibold text-gray-800">
//                   {user?.firstName || "User"}
//                 </p>
//               </div>

//               <ul className="text-sm">
//                 <li
//                   onClick={() => navigate("/profile")}
//                   className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 cursor-pointer"
//                 >
//                   <User size={16} />
//                   Profile
//                 </li>

//                 <li
//                   onClick={handleLogout}
//                   className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 cursor-pointer"
//                 >
//                   <LogOut size={16} />
//                   Logout
//                 </li>
//               </ul>
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// };

// export default NavbarClient;


// NavbarClient.jsx

import { User, LogOut, Bell, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import { io } from "socket.io-client";

const NavbarClient = ({ title, subtitle }) => {
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const [newIds, setNewIds] = useState([]); // 🔵 track new announcements
  const [notifications, setNotifications] = useState([]);
  const [notifBellOpen, setNotifBellOpen] = useState(false);

  const [newNotifIds, setNewNotifIds] = useState([]);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  /* 
const fetchNotifications = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/notifications/${user?._id}`
    );
    setNotifications(res.data);
  } catch (err) {
    console.log("Error fetching notifications", err);
  }
};
 */

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications/${user?._id}`);

      const data = res.data || [];
      setNotifications(data);

      const lastSeen = localStorage.getItem("lastSeenNotification");

      if (data.length > 0) {
        const latest = new Date(data[0].createdAt).getTime();

        if (!lastSeen || latest > Number(lastSeen)) {
          setHasNewNotif(true);

          const newItems = data.filter(
            (item) =>
              new Date(item.createdAt).getTime() > Number(lastSeen || 0),
          );

          setNewNotifIds(newItems.map((item) => item._id));
        }
      }
    } catch (err) {
      console.log("Error fetching notifications", err);
    }
  };
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id]);

  const initial =
    `${user?.firstName || ""} ${user?.lastName || ""}`
      .trim()
      .split(" ")
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
  };

  // ✅ Fetch announcements + detect new
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API_URL}/announcement/get/announcements`);

      const data = res.data || [];
      setAnnouncements(data);

      const lastSeen = localStorage.getItem("lastSeenAnnouncement");
      const alreadyOpened = sessionStorage.getItem("announcementOpened");

      // ✅ ALWAYS check announcements
      if (data.length > 0) {
        const latest = new Date(data[0].createdAt).getTime();

        // 🔴 Detect new
        if (!lastSeen || latest > Number(lastSeen)) {
          setHasNew(true);

          const newItems = data.filter(
            (item) =>
              new Date(item.createdAt).getTime() > Number(lastSeen || 0),
          );

          setNewIds(newItems.map((item) => item._id));
        }

        // ✅ ALWAYS OPEN ON LOGIN (only once per session)
        if (!alreadyOpened) {
          setNotifOpen(true);
          sessionStorage.setItem("announcementOpened", "true");
        }
      }
    } catch (error) {
      console.log("Error fetching announcements", error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpen(false);
      setNotifOpen(false);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    const BASE_URL = API_URL.split("/api")[0];

    const newSocket = io(BASE_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    // ✅ STORE SOCKET
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected:", newSocket.id);

      // 🔥 JOIN ROOM
      newSocket.emit("joinUserRoom", user._id);
    });

    // ✅ DEBUG CONFIRMATION (VERY IMPORTANT)
    newSocket.on("connect_error", (err) => {
      console.log("❌ Socket error:", err.message);
    });

    newSocket.on("newNotification", (data) => {
      console.log("🔔 RECEIVED:", data);

      setNotifications((prev) => {
        if (prev.find((n) => n._id === data._id)) return prev;
        return [data, ...prev];
      });

      setHasNewNotif(true);
      setNewNotifIds((prev) => [data._id, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <div className="flex items-center justify-between mb-6 border-b border-gray-300 pb-4">
      {/* LEFT */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4 relative">
        {/* 🔔 NOTIFICATION BELL */}
        {/* 🔔 NOTIFICATION BELL */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setNotifBellOpen(!notifBellOpen);

              // ✅ mark as seen
              if (notifications.length > 0) {
                const latest = new Date(notifications[0].createdAt).getTime();

                localStorage.setItem("lastSeenNotification", latest);
                setHasNewNotif(false);
              }
            }}
            className="p-2 rounded-full bg-green-200 hover:bg-gray-200 transition cursor-pointer"
          >
            <Bell size={20} className="text-gray-700" />
            {hasNewNotif && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                1
              </span>
            )}
          </div>

          {/* 🔽 NOTIFICATION DROPDOWN */}
          {notifBellOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-xl border z-50 overflow-hidden"
            >
              <div className="p-3 border-b font-semibold text-gray-700 bg-gray-50">
                🔔 Notifications
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-3 text-gray-500 text-sm">No notifications</p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      className={`p-3 border-b transition 
    ${
      newNotifIds.includes(item._id)
        ? "bg-blue-50 border-l-4 border-blue-500"
        : "hover:bg-gray-50"
    }`}
                    >
                      <p className="font-semibold text-sm text-gray-800 flex items-center">
                        {item.title}

                        {newNotifIds.includes(item._id) && (
                          <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded">
                            NEW
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-gray-600 mt-1">
                        {item.message}
                      </p>

                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🔔 ANNOUNCEMENT BELL */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen(!notifOpen);

              // ✅ Mark as seen (BUT DO NOT CLEAR newIds)
              if (announcements.length > 0) {
                const latest = new Date(announcements[0].createdAt).getTime();

                localStorage.setItem("lastSeenAnnouncement", latest);

                setHasNew(false);

                // ❌ IMPORTANT: removed setNewIds([])
              }
            }}
            className="p-2 rounded-full bg-green-200 hover:bg-gray-200 transition cursor-pointer"
          >
            <Megaphone size={20} className="text-gray-700" />
          </div>

          {/* 🔴 SHOW ONLY 1 */}
          {hasNew && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
              1
            </span>
          )}

          {/* 🔽 ANNOUNCEMENT DROPDOWN */}
          {notifOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-xl border z-50 overflow-hidden"
            >
              <div className="p-3 border-b font-semibold text-gray-700 bg-gray-50">
                📢 Announcements
              </div>

              <div className="max-h-72 overflow-y-auto">
                {announcements.length === 0 ? (
                  <p className="p-3 text-gray-500 text-sm">No announcements</p>
                ) : (
                  announcements.map((item) => (
                    <div
                      key={item._id}
                      className={`p-3 border-b transition 
                        ${
                          newIds.includes(item._id)
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                    >
                      <p className="font-semibold text-sm text-gray-800 flex items-center">
                        {item.title}

                        {/* 🆕 NEW BADGE */}
                        {newIds.includes(item._id) && (
                          <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded">
                            NEW
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-gray-600 mt-1">
                        {item.description}
                      </p>

                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 👤 PROFILE */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-gray-100 transition"
          >
            <div className="w-9 h-9 rounded-full bg-[#22c55e] text-white flex items-center justify-center font-semibold text-sm">
              {initial}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {user?.firstName || "User"}
              </p>
            </div>
          </div>

          {/* PROFILE DROPDOWN */}
          {open && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-52 bg-white shadow-xl rounded-xl border z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.firstName || "User"}
                </p>
              </div>

              <ul className="text-sm">
                <li
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 cursor-pointer"
                >
                  <User size={16} />
                  Profile
                </li>

                <li
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 cursor-pointer"
                >
                  <LogOut size={16} />
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavbarClient;

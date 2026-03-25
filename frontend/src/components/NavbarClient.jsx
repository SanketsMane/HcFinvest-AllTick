import {User, BadgeCheck, Moon , LogOut} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {  useState } from "react";


const NavbarClient = ({title , subtitle}) => {

    const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/user/login')
  }
      const [open, setOpen] = useState(false);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const navigate = useNavigate();
      const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

    return(
            <div className="flex items-center justify-between mb-6 relative border-b border-gray-300 pb-4">
              
              {/* LEFT */}
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {title}
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    {/* {subtitle} */}
                  </span>
                </h1>
                <p className="text-gray-500">
                  {subtitle}.
                </p>
              </div>
        
              {/* RIGHT - PROFILE */}
                  <div className="relative" >
                    {/* PROFILE BUTTON */}
                    <div
                      onClick={() => setOpen(!open)}
                      className="flex items-center gap-4 cursor-pointer px-5 py-3 rounded-xl bg-white shadow-sm transition-all duration-200 hover:bg-gray-100 hover:shadow-md hover:scale-[1.02] active:scale-95 group">
                      {/* Avatar */}
                     <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold shadow-sm transition-transform duration-200 group-hover:scale-110">
                        {initial}
                      </div>
        
                      {/* Name */}
                      <div className="text-right leading-tight">
                        <p className="text-lg font-semibold text-gray-800">
                          {user?.firstName || "User"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Pro Trader
                        </p>
                      </div>
                    </div>
        
          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-52 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
        
              {/* HEADER */}
              <div className="px-4 py-3 border-b bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">
                  {user?.firstName || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  Manage your account
                </p>
              </div>
        
              {/* MENU */}
              <ul className="text-sm text-gray-700">
        
                <li
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer transition group"
                >
                  <User size={18} className="text-gray-500 group-hover:text-black" />
                  <span className="font-medium">Profile</span>
                </li>
        
                <li className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer transition group">
                  <BadgeCheck size={18} className="text-gray-500 group-hover:text-black" />
                  <span className="font-medium">KYC Verification</span>
                </li>
        
                <li className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer transition group">
                  <Moon size={18} className="text-gray-500 group-hover:text-black" />
                  <span className="font-medium">Theme Settings</span>
                </li>

                <li
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer transition group"
                >
                  <LogOut size={18} className="text-red-500 group-hover:text-red-600" />
                  <span className="text-red-500 font-medium group-hover:text-red-600">
                    Logout
                  </span>
                </li>
        
              </ul>
        
            </div>
          )}
        </div>
        
            </div>
    )
}

export default NavbarClient
// app/settings/page.tsx
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

export default async function SettingsPage() {
  // Thực tế sếp sẽ get Session User ở đây. Tạm thời mình hardcode để build UI.
  const currentUser = {
    username: "admin",
    fullname: "Trưởng Phòng",
    role: "admin", // Đổi thành 'staff' để test giao diện nhân viên
  };

  // Kéo danh sách user từ DB (Mock data để test UI trước)
  const usersList = [
    { username: "admin", fullname: "Trưởng Phòng", role: "admin" },
    { username: "nv_linh", fullname: "Nhân viên Linh", role: "staff" },
  ];

  return <SettingsClient currentUser={currentUser} initialUsers={usersList} />;
}
import { initials } from "../utils/format";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
}

export default function Avatar({ firstName, lastName, size = 36 }: AvatarProps) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(firstName, lastName)}
    </div>
  );
}

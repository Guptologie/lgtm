
interface AvatarProps {
  login: string;
  avatarUrl: string;
  size?: number;
}

export function Avatar({ login, avatarUrl, size = 24 }: AvatarProps) {
  return (
    <span
      className="lgtm-avatar"
      style={{ width: size, height: size }}
      title={login}
    >
      <img
        className="lgtm-avatar__img"
        src={avatarUrl}
        alt={login}
        width={size}
        height={size}
        loading="lazy"
      />
    </span>
  );
}

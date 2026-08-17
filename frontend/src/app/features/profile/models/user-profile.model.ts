export interface UserProfileResponse {
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isOwner: boolean;
  email?: string;
  token?: string;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface UserSummary {
  username: string;
  avatarUrl?: string | null;
}

export interface UserSecurityResponse {
  username: string;
  email: string;
}

export interface UpdateProfileInfoRequest {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfileSecurityRequest {
  oldPassword: string;
  newPassword?: string;
  email?: string;
}

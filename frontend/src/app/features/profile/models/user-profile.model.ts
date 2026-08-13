export interface UserProfileResponse {
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isOwner: boolean;
  email?: string;
  token?: string;
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

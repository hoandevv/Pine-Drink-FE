import { AuthUser } from '../../../shared/models/user.model';

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  account: AuthUser;
}

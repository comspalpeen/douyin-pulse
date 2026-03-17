export interface Author {
  sec_uid: string;
  weight: number;
  nickname: string;
  avatar?: string;
  signature?: string;
  live_status: number; 
  web_rid?: string;
  user_count: number;
  follower_count: number; // ✅ 新增
}
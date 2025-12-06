// 对应 Python 的 StatsSummary 模型
export interface StatsSummary {
  total_messages: number;
  active_rooms: number;
  total_gifts_value: number;
  system_health: number;
}

// 对应 Python 的 RoomInfo 模型
export interface RoomInfo {
  web_rid: string;
  room_id: string;
  title: string;
  nickname: string;
  avatar_url: string;
  cover_url: string;
  user_count: number;        // 核心排序字段：在线人数
  total_user_count: number;
  max_viewers: number;
  like_count: number;
  start_follower_count: number;
  end_follower_count: number;
  follower_diff: number;     // 核心指标：涨粉数
  total_danmu_count: number;
  total_gift_value: number;
  room_status: number;
  updated_at: string;
}
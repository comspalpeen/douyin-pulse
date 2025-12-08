// src/types/room.ts

export interface ChatMsg {
    user_name: string;
    content: string;
    avatar_url?: string;
    sec_uid?: string;
    gender?: number; 
    pay_grade_icon?: string; 
    fans_club_icon?: string; 
    created_at?: string;
    event_time?: string;
}

export interface GiftMsg {
    user_name: string;
    gift_name: string;
    gift_icon_url?: string;
    diamond_count: number;
    total_diamond_count: number;
    combo_count: number;
    group_count?: number;
    avatar_url?: string;
    sec_uid?: string;
    gender?: number;
    pay_grade_icon?: string; 
    fans_club_icon?: string;
    created_at?: string;
    send_time?: string;
}

export type SearchTarget = 'all' | 'chat' | 'gift';
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// 1. 更新接口定义
interface ChatMsg {
  user_name: string;
  content: string;
  created_at: string;
  fans_club_level: number;
  avatar_url?: string;
  gender?: number;            // 1男 2女
  pay_grade_icon?: string;
  fans_club_icon?: string;
  sec_uid?: string;
}

interface GiftMsg {
  user_name: string;
  gift_name: string;
  total_diamond_count: number;
  combo_count: number;
  avatar_url?: string;
  created_at: string;
  gender?: number;
  pay_grade_icon?: string;
  fans_club_icon?: string;
  sec_uid?: string;
  gift_icon_url?: string;
}

interface PKRecord {
  battle_id: string;
  mode: string;
  start_time: string;
  teams: {
    team_id: string;
    win_status: number;
    anchors: {
      nickname: string;
      avatar: string;
      score: number;
    }[];
  }[];
}